import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { stripe, computeCommission } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { createDelivery, getDeliveryQuote } from "@/lib/uber-direct";
import { sendTopUpPaymentEmail } from "@/lib/resend";

// Runs every minute (see pg_cron job `process-dispatch-queue`) to settle
// every order whose 10-minute stock-check window has closed:
//   1. Any item still 'flagged' (store flagged it, customer never responded)
//      auto-resolves to a refund.
//   2. The net final total is computed from each item's actual resolution
//      (available at original price / substituted at the substitute's price
//      / refunded at $0).
//   3. Capture that net amount from the buffered authorization -- the
//      unused portion of the hold is released by Stripe automatically, no
//      refund needed, *unless* the net total exceeds even the buffer, in
//      which case we capture everything the hold covers and email the
//      customer a link for the small remaining balance (rare).
//   4. Transfer the store's share of the (possibly adjusted) subtotal.
//   5. For delivery orders, dispatch via Uber Direct with a manifest that
//      reflects what's actually being fulfilled (substitutes swapped in,
//      refunded items dropped). If literally everything was refunded,
//      there's nothing to deliver -- the order is cancelled instead.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: dueOrders, error } = await supabase
    .from("orders")
    .select(
      "id, store_id, customer_id, subtotal, delivery_fee, commission_amount, total, authorized_amount, fulfillment_type, stripe_payment_intent_id",
    )
    .lte("dispatch_at", new Date().toISOString())
    .is("captured_at", null)
    .not("stripe_payment_intent_id", "is", null);

  if (error) {
    Sentry.captureException(error, { tags: { area: "process_dispatch_queue_fetch" } });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const order of dueOrders ?? []) {
    results.push(await settleOrder(supabase, order));
  }

  return NextResponse.json({ processed: results.length, results });
}

async function settleOrder(
  supabase: ReturnType<typeof createServiceClient>,
  order: {
    id: string;
    store_id: string;
    customer_id: string;
    subtotal: number;
    delivery_fee: number;
    commission_amount: number;
    total: number;
    authorized_amount: number | null;
    fulfillment_type: string;
    stripe_payment_intent_id: string | null;
  },
) {
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, address, phone, stripe_connect_account_id, commission_rate")
    .eq("id", order.store_id)
    .single();

  // Timeout: any item the store flagged but the customer never responded to
  // auto-resolves to a refund now, before we compute the final total.
  await supabase
    .from("order_items")
    .update({ availability_status: "resolved_refund", resolved_at: new Date().toISOString(), effective_price: 0 })
    .eq("order_id", order.id)
    .eq("availability_status", "flagged");

  const { data: itemsRaw } = await supabase
    .from("order_items")
    .select("id, item_name, qty, price_at_purchase, availability_status, substitute_listing_id, effective_price")
    .eq("order_id", order.id);
  const items = itemsRaw ?? [];

  const lineTotal = (i: (typeof items)[number]) => {
    if (i.availability_status === "resolved_refund") return 0;
    if (i.availability_status === "resolved_substitute") return Number(i.effective_price ?? 0) * i.qty;
    return Number(i.price_at_purchase) * i.qty;
  };

  const finalSubtotal = Math.round(items.reduce((sum, i) => sum + lineTotal(i), 0) * 100) / 100;
  const isFullCancellation = finalSubtotal <= 0;
  const finalDeliveryFee = isFullCancellation ? 0 : order.delivery_fee;
  const finalCommission = isFullCancellation
    ? 0
    : computeCommission(finalSubtotal, Number(store?.commission_rate ?? 0.15));
  const finalTotal = finalSubtotal + finalDeliveryFee;
  const authorizedAmount = order.authorized_amount ?? order.total;
  const captureAmount = Math.min(finalTotal, authorizedAmount);
  const overflowAmount = Math.round((finalTotal - authorizedAmount) * 100) / 100;

  try {
    await stripe.paymentIntents.capture(order.stripe_payment_intent_id!, {
      amount_to_capture: Math.round(captureAmount * 100),
    });
  } catch (err) {
    console.error("Capture failed for order", order.id, err);
    Sentry.captureException(err, { extra: { orderId: order.id }, tags: { area: "dispatch_capture" } });
    return { orderId: order.id, error: "capture_failed" };
  }

  await supabase
    .from("orders")
    .update({
      captured_at: new Date().toISOString(),
      subtotal: finalSubtotal,
      delivery_fee: finalDeliveryFee,
      commission_amount: finalCommission,
      total: finalTotal,
      status: isFullCancellation ? "cancelled" : undefined,
    })
    .eq("id", order.id);

  if (overflowAmount > 0) {
    await handleOverflowTopUp(supabase, order, overflowAmount);
  }

  if (isFullCancellation) {
    return { orderId: order.id, capturedAmount: captureAmount, cancelled: true };
  }

  // In the overflow case (rare -- net total exceeded even the buffered
  // hold), only `captureAmount` was actually captured just now, not the
  // full `finalTotal`. A Transfer can never exceed what's actually on the
  // charge, so cap the store's share to what's really available; the rest
  // of their share arrives once the top-up payment is reconciled.
  const availableForStore = Math.max(0, captureAmount - finalDeliveryFee);
  const storeShare = Math.min(finalSubtotal - finalCommission, availableForStore);
  if (store?.stripe_connect_account_id && storeShare > 0) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id!);
      const chargeId =
        typeof paymentIntent.latest_charge === "string"
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge?.id;

      const transfer = await stripe.transfers.create({
        amount: Math.round(storeShare * 100),
        currency: "cad",
        destination: store.stripe_connect_account_id,
        source_transaction: chargeId,
        transfer_group: order.id,
      });

      await supabase.from("payouts").insert({
        store_id: store.id,
        order_id: order.id,
        stripe_transfer_id: transfer.id,
        amount: storeShare,
        status: "paid",
      });
    } catch (err) {
      console.error("Stripe transfer to connected account failed", err);
      Sentry.captureException(err, {
        extra: { orderId: order.id, storeId: store.id, amount: storeShare },
        tags: { area: "stripe_transfer" },
      });
      await supabase.from("payouts").insert({
        store_id: store.id,
        order_id: order.id,
        amount: storeShare,
        status: "failed",
      });
    }
  }

  if (order.fulfillment_type === "delivery" && store) {
    try {
      const manifestItems = await buildManifest(supabase, items);
      const { data: customer } = await supabase
        .from("users")
        .select("full_name, phone")
        .eq("id", order.customer_id)
        .single();

      // Delivery address isn't stored on the order row (it's a courier
      // instruction, not order data we display) -- re-derive it from the
      // PaymentIntent metadata that created this order.
      const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id!);
      const deliveryAddress = paymentIntent.metadata?.delivery_address;
      if (!deliveryAddress) throw new Error("Missing delivery_address in PaymentIntent metadata");

      const pickupAddress = paymentIntent.metadata?.store_address || store.address;
      const quote = await getDeliveryQuote(pickupAddress, deliveryAddress);
      const delivery = await createDelivery({
        quoteId: quote.id,
        pickupName: store.name,
        pickupAddress,
        pickupPhone: store.phone || "+14165550100",
        dropoffName: customer?.full_name ?? "AfriCarrt customer",
        dropoffAddress: deliveryAddress,
        dropoffPhone: customer?.phone || "+14165550101",
        manifestItems,
        externalId: order.id,
      });

      await supabase.from("orders").update({ uber_delivery_id: delivery.id }).eq("id", order.id);
    } catch (err) {
      console.error("Uber Direct delivery creation failed", err);
      Sentry.captureException(err, {
        extra: { orderId: order.id, storeId: store.id },
        tags: { area: "uber_direct_delivery_creation" },
      });
    }
  }

  return { orderId: order.id, capturedAmount: captureAmount };
}

async function buildManifest(
  supabase: ReturnType<typeof createServiceClient>,
  items: {
    item_name: string;
    qty: number;
    availability_status: string;
    substitute_listing_id: string | null;
  }[],
) {
  const substituteIds = items
    .filter((i) => i.availability_status === "resolved_substitute" && i.substitute_listing_id)
    .map((i) => i.substitute_listing_id!);

  const substituteNames = new Map<string, string>();
  if (substituteIds.length > 0) {
    const { data: substitutes } = await supabase
      .from("store_listings")
      .select("id, custom_name, catalog_items(name)")
      .in("id", substituteIds);
    for (const s of substitutes ?? []) {
      substituteNames.set(s.id, s.custom_name ?? s.catalog_items?.name ?? "Item");
    }
  }

  return items
    .filter((i) => i.availability_status !== "resolved_refund")
    .map((i) => ({
      name:
        i.availability_status === "resolved_substitute" && i.substitute_listing_id
          ? (substituteNames.get(i.substitute_listing_id) ?? i.item_name)
          : i.item_name,
      quantity: i.qty,
    }));
}

async function handleOverflowTopUp(
  supabase: ReturnType<typeof createServiceClient>,
  order: { id: string; customer_id: string },
  amountDue: number,
) {
  try {
    const { data: customer } = await supabase.auth.admin.getUserById(order.customer_id);
    const email = customer.user?.email;
    if (!email) return;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: { name: "AfriCarrt order balance" },
            unit_amount: Math.round(amountDue * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${siteUrl}/orders/${order.id}`,
      cancel_url: `${siteUrl}/orders/${order.id}`,
      metadata: { order_id: order.id, type: "top_up" },
    });

    if (session.url) {
      await sendTopUpPaymentEmail({ to: email, orderId: order.id, amountDue, paymentUrl: session.url });
    }
  } catch (err) {
    console.error("Overflow top-up handling failed", err);
    Sentry.captureException(err, { extra: { orderId: order.id, amountDue }, tags: { area: "overflow_topup" } });
  }
}
