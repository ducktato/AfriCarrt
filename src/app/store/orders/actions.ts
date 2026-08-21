"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";
import { sendItemUnavailableEmail } from "@/lib/resend";

export type FlagItemState = { error: string } | null;

export async function flagItemUnavailable(
  _prevState: FlagItemState,
  formData: FormData,
): Promise<FlagItemState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const orderItemId = String(formData.get("order_item_id") ?? "");
  if (!orderItemId) return { error: "Missing item." };

  const { data: item } = await supabase
    .from("order_items")
    .select(
      "id, item_name, availability_status, store_listing_id, order_id, orders(id, store_id, dispatch_at, captured_at, customer_id, stores(owner_id))",
    )
    .eq("id", orderItemId)
    .single();

  if (!item || !item.orders) return { error: "Order item not found." };
  const order = item.orders;
  if (order.stores?.owner_id !== user.id) return { error: "Not your order." };
  if (order.captured_at) return { error: "This order has already been dispatched." };
  if (order.dispatch_at && new Date(order.dispatch_at) < new Date()) {
    return { error: "The stock-check window for this order has already closed." };
  }
  if (item.availability_status !== "available") {
    return { error: "This item has already been flagged." };
  }

  const { error: updateError } = await supabase
    .from("order_items")
    .update({ availability_status: "flagged", flagged_at: new Date().toISOString() })
    .eq("id", orderItemId);
  if (updateError) return { error: updateError.message };

  const service = createServiceClient();

  // Best-effort: correct the listing's stock so future customers don't hit
  // the same out-of-stock surprise. Not the customer-facing critical path.
  await supabase.from("store_listings").update({ stock_qty: 0 }).eq("id", item.store_listing_id);

  try {
    await service.rpc("record_performance_event", {
      p_store_id: order.store_id,
      p_order_id: order.id,
      p_event_type: "stockout",
    });
  } catch (err) {
    Sentry.captureException(err, {
      extra: { orderId: order.id, storeId: order.store_id },
      tags: { area: "record_performance_event" },
    });
  }

  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const { data: authUser } = await service.auth.admin.getUserById(order.customer_id);
    if (authUser.user?.email) {
      await sendItemUnavailableEmail({
        to: authUser.user.email,
        itemName: item.item_name,
        orderId: order.id,
        siteUrl: origin,
      });
    }
  } catch (err) {
    Sentry.captureException(err, {
      extra: { orderItemId, orderId: order.id },
      tags: { area: "item_unavailable_email" },
    });
  }

  revalidatePath("/store/orders");
  return null;
}

export type MarkReadyState = { error: string } | null;

export async function markOrderReady(
  _prevState: MarkReadyState,
  formData: FormData,
): Promise<MarkReadyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const orderId = String(formData.get("order_id") ?? "");
  if (!orderId) return { error: "Missing order." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, fulfillment_type, ready_at, stores(owner_id)")
    .eq("id", orderId)
    .single();

  if (!order || order.stores?.owner_id !== user.id) return { error: "Not your order." };
  if (order.ready_at) return { error: "Already marked ready." };

  const { error } = await supabase
    .from("orders")
    .update({
      ready_at: new Date().toISOString(),
      status: order.fulfillment_type === "pickup" ? "completed" : undefined,
    })
    .eq("id", orderId);
  if (error) return { error: error.message };

  revalidatePath("/store/orders");
  return null;
}

export type CancelOrderState = { error: string } | null;

export async function cancelOrder(
  _prevState: CancelOrderState,
  formData: FormData,
): Promise<CancelOrderState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const orderId = String(formData.get("order_id") ?? "");
  if (!orderId) return { error: "Missing order." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, store_id, customer_id, captured_at, stripe_payment_intent_id, stores(owner_id)")
    .eq("id", orderId)
    .single();

  if (!order || order.stores?.owner_id !== user.id) return { error: "Not your order." };
  if (order.captured_at) return { error: "This order has already been dispatched and can't be cancelled here." };

  try {
    if (order.stripe_payment_intent_id) {
      await stripe.paymentIntents.cancel(order.stripe_payment_intent_id);
    }
  } catch (err) {
    Sentry.captureException(err, { extra: { orderId }, tags: { area: "cancel_order_payment_intent" } });
    return { error: "Could not cancel the payment. Please try again." };
  }

  const service = createServiceClient();
  await service
    .from("orders")
    .update({ status: "cancelled", captured_at: new Date().toISOString() })
    .eq("id", orderId);
  await service
    .from("order_items")
    .update({ availability_status: "resolved_refund", resolved_at: new Date().toISOString(), effective_price: 0 })
    .eq("order_id", orderId);

  try {
    await service.rpc("record_performance_event", {
      p_store_id: order.store_id,
      p_order_id: order.id,
      p_event_type: "cancellation",
    });
  } catch (err) {
    Sentry.captureException(err, {
      extra: { orderId: order.id, storeId: order.store_id },
      tags: { area: "record_performance_event" },
    });
  }

  revalidatePath("/store/orders");
  return null;
}
