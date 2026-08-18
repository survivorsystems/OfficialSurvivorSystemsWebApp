import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

export const config = { api: { bodyParser: false } };

const accessStatuses = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function supabaseServerKey() {
  const key = process.env.SUPABASE_SECRET_KEY?.trim() ?? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not configured.");
  return key;
}

async function readRawBody(request: VercelRequest) {
  let body = "";
  for await (const chunk of request) {
    body += typeof chunk === "string" ? chunk : chunk.toString("utf8");
  }
  return body;
}

function objectId(value: string | { id: string } | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnds = subscription.items.data.map((item) => item.current_period_end);
  return periodEnds.length > 0 ? new Date(Math.max(...periodEnds) * 1000).toISOString() : null;
}

async function findAuthUserId(supabase: SupabaseClient, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const users = data.users as Array<{ id: string; email?: string }>;
    const existing = users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (existing) return existing.id;
    if (users.length < 1000) break;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function customerEmail(stripe: Stripe, customerId: string | null) {
  if (!customerId) return null;
  const customer = await stripe.customers.retrieve(customerId);
  return "email" in customer ? customer.email : null;
}

async function syncSubscription(
  supabase: SupabaseClient,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  suppliedEmail: string | null,
) {
  const customerId = objectId(subscription.customer);
  const filters = [`stripe_subscription_id.eq.${subscription.id}`];
  if (customerId) filters.push(`stripe_customer_id.eq.${customerId}`);

  const { data: existing, error: existingError } = await supabase
    .from("library_entitlements")
    .select("user_id, access_type")
    .or(filters.join(","))
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.access_type === "owner") return;

  const email = suppliedEmail ?? await customerEmail(stripe, customerId);
  const userId = existing?.user_id ?? (email ? await findAuthUserId(supabase, email) : null);
  if (!userId) throw new Error(`No Supabase user could be resolved for subscription ${subscription.id}.`);

  const { data: userEntitlement, error: userEntitlementError } = await supabase
    .from("library_entitlements")
    .select("access_type")
    .eq("user_id", userId)
    .maybeSingle();
  if (userEntitlementError) throw userEntitlementError;
  if (userEntitlement?.access_type === "owner") return;

  const active = accessStatuses.has(subscription.status);
  const { error } = await supabase.from("library_entitlements").upsert({
    user_id: userId,
    access_type: "subscriber",
    active,
    expires_at: active ? subscriptionPeriodEnd(subscription) : new Date().toISOString(),
    source: "stripe",
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_status: subscription.status,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) throw error;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  return objectId(subscription ?? null);
}

async function processStripeEvent(event: Stripe.Event, stripe: Stripe, supabase: SupabaseClient) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = objectId(session.subscription);
      if (!subscriptionId) return;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const email = session.customer_details?.email ?? session.customer_email;
      await syncSubscription(supabase, stripe, subscription, email);
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
    const supabase = createClient(
      requiredEnvironment("SUPABASE_URL"),
      supabaseServerKey(),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
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
    console.error("Stripe library webhook failed:", message);
    return response.status(400).json({ error: "Webhook processing failed" });
  }
}
