import { createAdminClient } from "@supabase/server/core";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const bundle = {
  name: "Survivor Healing Bundle",
  bucket: "Paid Trauma Healing",
  folder: "Trauma Healing",
  files: [
    "Emotional Autonomy Restoration",
    "Financial Autonomy Restoration",
    "Sexual Autonomy Restoration",
    "Total Autonomy Restoration",
    "Dismantling The Patriarchy",
  ],
} as const;

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function normalizeFileName(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  response.setHeader("Cache-Control", "no-store");
  const sessionId = Array.isArray(request.query.session_id)
    ? request.query.session_id[0]
    : request.query.session_id;

  if (!sessionId?.startsWith("cs_")) {
    return response.status(400).json({ error: "The checkout confirmation is missing." });
  }

  try {
    const stripe = new Stripe(requiredEnvironment("STRIPE_SECRET_KEY"));
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 20 });
    const purchasedBundle = lineItems.data.some(
      (item) => normalizeFileName(item.description) === normalizeFileName(bundle.name),
    );

    if (checkout.mode !== "payment" || checkout.payment_status !== "paid" || !purchasedBundle) {
      return response.status(403).json({ error: "This checkout does not include the Survivor Healing Bundle." });
    }

    const supabase = createAdminClient();
    const { data: objects, error: listError } = await supabase.storage
      .from(bundle.bucket)
      .list(bundle.folder, { limit: 100, sortBy: { column: "name", order: "asc" } });
    if (listError) throw listError;

    const expectedNames = new Set(bundle.files.map(normalizeFileName));
    const matchingObjects = (objects ?? []).filter((object) => expectedNames.has(normalizeFileName(object.name)));
    if (matchingObjects.length !== bundle.files.length) {
      throw new Error(`Expected ${bundle.files.length} bundle files but found ${matchingObjects.length}.`);
    }

    const downloads = await Promise.all(matchingObjects.map(async (object) => {
      const path = `${bundle.folder}/${object.name}`;
      const { data, error } = await supabase.storage.from(bundle.bucket).createSignedUrl(path, 600, {
        download: object.name,
      });
      if (error) throw error;
      return {
        name: object.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
        url: data.signedUrl,
      };
    }));

    return response.status(200).json({
      bundle: bundle.name,
      customerEmail: checkout.customer_details?.email ?? checkout.customer_email ?? null,
      downloads,
      expiresInSeconds: 600,
    });
  } catch (error) {
    console.error("Bundle access failed:", error instanceof Error ? error.message : error);
    return response.status(500).json({ error: "The bundle could not be prepared. Please refresh and try again." });
  }
}
