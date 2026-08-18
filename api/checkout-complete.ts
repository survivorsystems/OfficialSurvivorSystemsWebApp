import { createAdminClient } from "@supabase/server/core";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { objectId, subscriptionHasAccess, syncSubscription } from "./_lib/library-access.js";

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function siteUrl() {
  return (process.env.SITE_URL?.trim() || "https://survivorsystems.org").replace(/\/$/, "");
}

function fail(response: VercelResponse, message: string) {
  const destination = new URL("/resources/access", siteUrl());
  destination.searchParams.set("access_error", message);
  return response.redirect(303, destination.toString());
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const sessionId = Array.isArray(request.query.session_id)
    ? request.query.session_id[0]
    : request.query.session_id;
  if (!sessionId?.startsWith("cs_")) return fail(response, "missing_checkout");

  try {
    const stripe = new Stripe(requiredEnvironment("STRIPE_SECRET_KEY"));
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    const subscriptionId = objectId(checkout.subscription);
    const email = checkout.customer_details?.email ?? checkout.customer_email;
    if (checkout.mode !== "subscription" || !subscriptionId || !email) {
      return fail(response, "invalid_checkout");
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!subscriptionHasAccess(subscription)) return fail(response, "inactive_subscription");

    const supabase = createAdminClient();
    await syncSubscription(supabase, stripe, subscription, email);

    const redirectTo = `${siteUrl()}/resources/access?checkout=success`;
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email.trim().toLowerCase(),
      options: { redirectTo },
    });
    if (error) throw error;

    return response.redirect(303, data.properties.action_link);
  } catch (error) {
    console.error("Checkout access handoff failed:", error instanceof Error ? error.message : error);
    return fail(response, "checkout_verification_failed");
  }
}
