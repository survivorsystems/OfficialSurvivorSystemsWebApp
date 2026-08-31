import { createAdminClient } from "@supabase/server/core";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import {
  normalizeStoreFileName,
  storeProductsByStripeProductId,
  stripeObjectId,
  type StoreProduct,
} from "./_lib/store-catalog.js";

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function productDownloads(
  supabase: ReturnType<typeof createAdminClient>,
  product: StoreProduct,
) {
  const { data: objects, error: listError } = await supabase.storage
    .from(product.bucket)
    .list(product.folder, { limit: 200, sortBy: { column: "name", order: "asc" } });
  if (listError) throw listError;

  const requiredStems = new Set(product.requiredFileStems.map(normalizeStoreFileName));
  const matchingObjects = (objects ?? []).filter((object) => requiredStems.has(normalizeStoreFileName(object.name)));
  const foundStems = new Set(matchingObjects.map((object) => normalizeStoreFileName(object.name)));
  const missing = [...requiredStems].filter((stem) => !foundStems.has(stem));
  if (missing.length > 0) {
    throw new Error(`${product.name} is missing ${missing.length} expected file${missing.length === 1 ? "" : "s"}.`);
  }

  return Promise.all(matchingObjects.map(async (object) => {
    const path = product.folder ? `${product.folder}/${object.name}` : object.name;
    const { data, error } = await supabase.storage.from(product.bucket).createSignedUrl(path, 600, {
      download: object.name,
    });
    if (error) throw error;
    return { name: object.name, url: data.signedUrl };
  }));
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  response.setHeader("Cache-Control", "no-store");
  const sessionId = Array.isArray(request.query.session_id) ? request.query.session_id[0] : request.query.session_id;
  if (!sessionId?.startsWith("cs_")) {
    return response.status(400).json({ error: "The checkout confirmation is missing." });
  }

  try {
    const stripe = new Stripe(requiredEnvironment("STRIPE_SECRET_KEY"));
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    if (checkout.mode !== "payment" || !["paid", "no_payment_required"].includes(checkout.payment_status)) {
      return response.status(403).json({ error: "This purchase has not been paid." });
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
      expand: ["data.price.product"],
    });
    const purchasedProducts = new Map<string, StoreProduct>();
    for (const lineItem of lineItems.data) {
      const stripeProductId = stripeObjectId(lineItem.price?.product);
      const product = stripeProductId ? storeProductsByStripeProductId.get(stripeProductId) : null;
      if (product) purchasedProducts.set(product.slug, product);
    }
    if (purchasedProducts.size === 0) {
      return response.status(403).json({ error: "No recognized Survivor Systems products were found in this checkout." });
    }

    const supabase = createAdminClient();
    const products = await Promise.all([...purchasedProducts.values()].map(async (product) => ({
      slug: product.slug,
      name: product.name,
      downloads: await productDownloads(supabase, product),
    })));

    return response.status(200).json({
      customerEmail: checkout.customer_details?.email ?? checkout.customer_email ?? null,
      products,
      expiresInSeconds: 600,
    });
  } catch (error) {
    console.error("Store access failed:", error instanceof Error ? error.message : error);
    return response.status(500).json({ error: "The purchased files could not be prepared. Please refresh and try again." });
  }
}
