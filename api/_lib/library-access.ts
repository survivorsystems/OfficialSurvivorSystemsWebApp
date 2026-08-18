import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const accessStatuses = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

export function objectId(value: string | { id: string } | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnds = subscription.items.data.map((item) => item.current_period_end);
  return periodEnds.length > 0 ? new Date(Math.max(...periodEnds) * 1000).toISOString() : null;
}

export async function findAuthUserId(supabase: SupabaseClient, email: string) {
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

export async function syncSubscription(
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
  if (existing?.access_type === "owner") return existing.user_id as string;

  const email = suppliedEmail ?? await customerEmail(stripe, customerId);
  const userId = existing?.user_id ?? (email ? await findAuthUserId(supabase, email) : null);
  if (!userId) throw new Error(`No Supabase user could be resolved for subscription ${subscription.id}.`);

  const { data: userEntitlement, error: userEntitlementError } = await supabase
    .from("library_entitlements")
    .select("access_type")
    .eq("user_id", userId)
    .maybeSingle();
  if (userEntitlementError) throw userEntitlementError;
  if (userEntitlement?.access_type === "owner") return userId as string;

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
  return userId as string;
}

export function subscriptionHasAccess(subscription: Stripe.Subscription) {
  return accessStatuses.has(subscription.status);
}
