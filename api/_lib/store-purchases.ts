import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { storeProductsByStripeProductId, stripeObjectId } from "./store-catalog.js";

function lineItemProductId(lineItem: Stripe.LineItem) {
  return stripeObjectId(lineItem.price?.product);
}

export async function syncStorePurchase(
  supabase: SupabaseClient,
  stripe: Stripe,
  checkout: Stripe.Checkout.Session,
) {
  if (checkout.mode !== "payment") return null;

  const lineItems = await stripe.checkout.sessions.listLineItems(checkout.id, {
    limit: 100,
    expand: ["data.price.product"],
  });
  const recognizedItems = lineItems.data.flatMap((lineItem) => {
    const stripeProductId = lineItemProductId(lineItem);
    if (!stripeProductId) return [];
    const product = storeProductsByStripeProductId.get(stripeProductId);
    if (!product) return [];
    return [{ lineItem, product, stripeProductId }];
  });
  if (recognizedItems.length === 0) return null;

  const paymentIntentId = stripeObjectId(checkout.payment_intent);
  const customerId = stripeObjectId(checkout.customer);
  const customerEmail = checkout.customer_details?.email ?? checkout.customer_email ?? null;
  const paid = checkout.payment_status === "paid" || checkout.payment_status === "no_payment_required";
  const { data: order, error: orderError } = await supabase
    .from("store_orders")
    .upsert({
      stripe_checkout_session_id: checkout.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
      customer_email: customerEmail?.trim().toLowerCase() ?? null,
      payment_status: paid ? "paid" : checkout.payment_status,
      currency: checkout.currency,
      amount_total: checkout.amount_total,
      updated_at: new Date().toISOString(),
    }, { onConflict: "stripe_checkout_session_id" })
    .select("id")
    .single();
  if (orderError) throw orderError;

  const { error: deleteError } = await supabase
    .from("store_order_items")
    .delete()
    .eq("order_id", order.id);
  if (deleteError) throw deleteError;

  const { error: itemError } = await supabase.from("store_order_items").insert(
    recognizedItems.map(({ lineItem, product, stripeProductId }) => ({
      order_id: order.id,
      stripe_product_id: stripeProductId,
      stripe_price_id: lineItem.price?.id ?? null,
      product_slug: product.slug,
      quantity: lineItem.quantity ?? 1,
      amount_total: lineItem.amount_total,
    })),
  );
  if (itemError) throw itemError;
  return order.id as string;
}

export async function updateStoreOrderPaymentStatus(
  supabase: SupabaseClient,
  stripeCheckoutSessionId: string,
  paymentStatus: string,
) {
  const { error } = await supabase
    .from("store_orders")
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq("stripe_checkout_session_id", stripeCheckoutSessionId);
  if (error) throw error;
}
