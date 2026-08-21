import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

const DISPATCH_HOLD_MINUTES = 10;

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set -- rejecting webhook.");
    Sentry.captureMessage("STRIPE_WEBHOOK_SECRET is not set -- rejecting webhook.", "error");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Manual-capture PaymentIntents fire this event once the authorization
  // succeeds (status -> requires_capture). This is our "payment confirmed,
  // create the order" trigger -- the actual capture (settlement, Transfer,
  // Uber dispatch) happens later, once the stock-check window closes (see
  // /api/cron/process-dispatch-queue).
  if (event.type === "payment_intent.amount_capturable_updated") {
    await handlePaymentAuthorized(event.data.object as Stripe.PaymentIntent);
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentAuthorized(paymentIntent: Stripe.PaymentIntent) {
  const supabase = createServiceClient();
  const meta = paymentIntent.metadata;
  if (!meta || !meta.store_id) {
    console.error("payment_intent.amount_capturable_updated with no metadata", paymentIntent.id);
    return;
  }

  // Stripe delivers webhooks at-least-once -- don't double-create.
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle();
  if (existingOrder) return;

  const items: { storeListingId: string; qty: number }[] = JSON.parse(meta.items ?? "[]");
  const subtotal = Number(meta.subtotal ?? 0);
  const deliveryFee = Number(meta.delivery_fee ?? 0);
  const commission = Number(meta.commission_amount ?? 0);
  const authorizedAmount = Number(meta.authorized_amount ?? paymentIntent.amount / 100);
  const total = subtotal + deliveryFee;

  const listingIds = items.map((i) => i.storeListingId);
  const { data: listings } = await supabase
    .from("store_listings")
    .select("id, price, custom_name, catalog_items(name)")
    .in("id", listingIds);

  const dispatchAt = new Date(Date.now() + DISPATCH_HOLD_MINUTES * 60_000).toISOString();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: meta.customer_id,
      store_id: meta.store_id,
      fulfillment_type: meta.fulfillment_type,
      delivery_tier: meta.delivery_tier || null,
      // Packing starts immediately -- it's dispatch (courier pickup /
      // settlement) that waits for the stock-check window, not prep.
      status: "packing",
      subtotal,
      delivery_fee: deliveryFee,
      commission_amount: commission,
      total,
      authorized_amount: authorizedAmount,
      dispatch_at: dispatchAt,
      stripe_payment_intent_id: paymentIntent.id,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Failed to create order from payment_intent.amount_capturable_updated", orderError);
    Sentry.captureException(new Error("Failed to create order from payment authorization"), {
      extra: { paymentIntentId: paymentIntent.id, orderError },
    });
    return;
  }

  for (const item of items) {
    const listing = listings?.find((l) => l.id === item.storeListingId);
    if (!listing) continue;
    await supabase.from("order_items").insert({
      order_id: order.id,
      store_listing_id: item.storeListingId,
      item_name: listing.custom_name ?? listing.catalog_items?.name ?? "Item",
      qty: item.qty,
      price_at_purchase: listing.price,
    });
    await supabase.rpc("decrement_listing_stock", { p_listing_id: item.storeListingId, p_qty: item.qty });
  }
}
