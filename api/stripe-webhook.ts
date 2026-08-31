import { createAdminClient } from "@supabase/server/core";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { objectId, syncSubscription } from "./_lib/library-access.js";
import { stripeObjectId } from "./_lib/store-catalog.js";
import { syncStorePurchase, updateStoreOrderPaymentStatus } from "./_lib/store-purchases.js";

export const config = { api: { bodyParser: false } };

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function readRawBody(request: VercelRequest) {
  let body = "";
  for await (const chunk of request) {
    body += typeof chunk === "string" ? chunk : chunk.toString("utf8");
  }
  return body;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  return objectId(subscription ?? null);
}

async function processStripeEvent(event: Stripe.Event, stripe: Stripe, supabase: ReturnType<typeof createAdminClient>) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "payment") {
        await syncStorePurchase(supabase, stripe, session);
        return;
      }
      const subscriptionId = objectId(session.subscription);
      if (!subscriptionId) return;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const email = session.customer_details?.email ?? session.customer_email;
      await syncSubscription(supabase, stripe, subscription, email);
      return;
    }
    case "checkout.session.async_payment_succeeded":
      await syncStorePurchase(supabase, stripe, event.data.object);
      return;
    case "checkout.session.async_payment_failed":
      await updateStoreOrderPaymentStatus(supabase, event.data.object.id, "failed");
      return;
    case "charge.refunded": {
      const paymentIntentId = stripeObjectId(event.data.object.payment_intent);
      if (!paymentIntentId) return;
      const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
      const session = sessions.data[0];
      if (session) await updateStoreOrderPaymentStatus(supabase, session.id, "refunded");
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(supabase, stripe, event.data.object, null);
      return;
    case "invoice.paid":
    case "invoice.payment_failed": {
      const subscriptionId = invoiceSubscriptionId(event.data.object);
      if (!subscriptionId) return;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(supabase, stripe, subscription, null);
      return;
    }
    default:
      return;
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripe = new Stripe(requiredEnvironment("STRIPE_SECRET_KEY"));
    const supabase = createAdminClient();
    const signature = request.headers["stripe-signature"];
    if (typeof signature !== "string") {
      return response.status(400).json({ error: "Missing Stripe signature" });
    }

    const event = stripe.webhooks.constructEvent(
      await readRawBody(request),
      signature,
      requiredEnvironment("STRIPE_WEBHOOK_SECRET"),
    );
    await processStripeEvent(event, stripe, supabase);
    return response.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    console.error("Stripe store webhook failed:", message);
    return response.status(400).json({ error: "Webhook processing failed" });
  }
}
