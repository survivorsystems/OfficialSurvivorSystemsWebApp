import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { storeProductsBySlug, type StoreProduct } from "./_lib/store-catalog.js";

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function siteUrl() {
  return (process.env.SITE_URL?.trim() || "https://survivorsystems.org").replace(/\/$/, "");
}

async function priceForProduct(stripe: Stripe, product: StoreProduct) {
  if (product.stripeProductId) {
    const stripeProduct = await stripe.products.retrieve(product.stripeProductId);
    const defaultPrice = typeof stripeProduct.default_price === "string"
      ? stripeProduct.default_price
      : stripeProduct.default_price?.id;
    if (defaultPrice) return defaultPrice;

    const prices = await stripe.prices.list({ product: product.stripeProductId, active: true, type: "one_time", limit: 10 });
    const matchingPrice = prices.data.find((price) => price.unit_amount === Math.round(product.price * 100));
    if (matchingPrice) return matchingPrice.id;
    throw new Error(`${product.name} does not have an active one-time Stripe price matching $${product.price.toFixed(2)}.`);
  }

  const paymentLinks = await stripe.paymentLinks.list({ active: true, limit: 100 });
  const paymentLink = paymentLinks.data.find((link) => link.url === product.paymentLink);
  if (!paymentLink) throw new Error(`${product.name} payment link could not be found in Stripe.`);
  const lineItems = await stripe.paymentLinks.listLineItems(paymentLink.id, { limit: 10 });
  const price = lineItems.data[0]?.price;
  if (!price?.id) throw new Error(`${product.name} does not have an active Stripe price.`);
  return price.id;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const submitted = Array.isArray(request.body?.productSlugs) ? request.body.productSlugs : [];
    const slugs = [...new Set(submitted.filter((value: unknown): value is string => typeof value === "string"))];
    const products = slugs.map((slug) => storeProductsBySlug.get(slug)).filter((product): product is StoreProduct => Boolean(product));
    if (products.length === 0 || products.length !== slugs.length || products.length > 20) {
      return response.status(400).json({ error: "The cart contains an unavailable product." });
    }

    const stripe = new Stripe(requiredEnvironment("STRIPE_SECRET_KEY"));
    const prices = await Promise.all(products.map((product) => priceForProduct(stripe, product)));
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: prices.map((price) => ({ price, quantity: 1 })),
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_creation: "always",
      success_url: `${siteUrl()}/store/order?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/store?checkout=cancelled`,
      metadata: { product_slugs: products.map((product) => product.slug).join(",") },
    });
    if (!checkout.url) throw new Error("Stripe did not return a checkout URL.");
    return response.status(200).json({ url: checkout.url });
  } catch (error) {
    console.error("Store checkout creation failed:", error instanceof Error ? error.message : error);
    return response.status(500).json({ error: "Checkout could not be opened. Please try again." });
  }
}
