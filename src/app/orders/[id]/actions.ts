"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { orderSubtotal } from "@/lib/order-totals";

export type ResolveItemState = { error: string } | null;

export async function resolveFlaggedItem(
  _prevState: ResolveItemState,
  formData: FormData,
): Promise<ResolveItemState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const orderItemId = String(formData.get("order_item_id") ?? "");
  const choice = String(formData.get("choice") ?? ""); // "substitute" | "refund"
  const substituteListingId = String(formData.get("substitute_listing_id") ?? "") || null;

  if (!orderItemId || (choice !== "substitute" && choice !== "refund")) {
    return { error: "Invalid request." };
  }
  if (choice === "substitute" && !substituteListingId) {
    return { error: "Choose a substitute item." };
  }

  const { data: item } = await supabase
    .from("order_items")
    .select(
      "id, qty, availability_status, order_id, orders(id, customer_id, dispatch_at, captured_at, store_id, authorized_amount, total, delivery_fee)",
    )
    .eq("id", orderItemId)
    .single();

  if (!item || !item.orders) return { error: "Order item not found." };
  const order = item.orders;
  if (order.customer_id !== user.id) return { error: "Not your order." };
  if (order.captured_at) return { error: "This order has already been dispatched." };
  if (order.dispatch_at && new Date(order.dispatch_at) < new Date()) {
    return { error: "The response window for this order has closed." };
  }
  if (item.availability_status !== "flagged") {
    return { error: "This item isn't awaiting a response." };
  }

  if (choice === "refund") {
    const { error } = await supabase
      .from("order_items")
      .update({
        availability_status: "resolved_refund",
        resolved_at: new Date().toISOString(),
        effective_price: 0,
      })
      .eq("id", orderItemId);
    if (error) return { error: error.message };
    revalidatePath(`/orders/${order.id}`);
    return null;
  }

  // Substitute: validate it's a real, active, in-stock listing from the same store.
  const { data: substitute } = await supabase
    .from("store_listings")
    .select("id, price, stock_qty, is_active, store_id")
    .eq("id", substituteListingId!)
    .single();

  if (!substitute || substitute.store_id !== order.store_id || !substitute.is_active) {
    return { error: "That substitute is no longer available." };
  }
  if (substitute.stock_qty < item.qty) {
    return { error: "Not enough stock of that substitute." };
  }

  // Buffer cap: the payment authorization was only ever buffered ~20% above
  // the original subtotal. A substitute is only allowed to be a "free swap"
  // if the order's total with this substitute applied still fits inside
  // that existing hold -- otherwise the order would dispatch immediately
  // while the difference is only ever an emailed, optional payment link
  // (see process-dispatch-queue's overflow handling), which a customer
  // could simply never pay. Rejecting the pick here closes that off at the
  // only point it can ever be created, instead of trying to claw it back
  // after the fact.
  const { data: allItemsRaw } = await supabase
    .from("order_items")
    .select("id, qty, price_at_purchase, availability_status, effective_price")
    .eq("order_id", order.id);
  const allItems = allItemsRaw ?? [];
  const hypotheticalSubtotal = orderSubtotal(
    allItems.map((i) =>
      i.id === orderItemId
        ? {
            qty: i.qty,
            price_at_purchase: Number(i.price_at_purchase),
            availability_status: "resolved_substitute",
            effective_price: Number(substitute.price),
          }
        : {
            qty: i.qty,
            price_at_purchase: Number(i.price_at_purchase),
            availability_status: i.availability_status,
            effective_price: i.effective_price === null ? null : Number(i.effective_price),
          },
    ),
  );
  const hypotheticalTotal = hypotheticalSubtotal + Number(order.delivery_fee ?? 0);
  const authorizedAmount = Number(order.authorized_amount ?? order.total ?? 0);
  if (hypotheticalTotal > authorizedAmount) {
    return {
      error:
        "That substitute costs more than what's covered by your original payment hold. Pick a cheaper option, or choose a refund for this item instead.",
    };
  }

  const { error } = await supabase
    .from("order_items")
    .update({
      availability_status: "resolved_substitute",
      resolved_at: new Date().toISOString(),
      substitute_listing_id: substitute.id,
      effective_price: substitute.price,
    })
    .eq("id", orderItemId);
  if (error) return { error: error.message };

  try {
    await supabase.rpc("decrement_listing_stock", { p_listing_id: substitute.id, p_qty: item.qty });
  } catch (err) {
    Sentry.captureException(err, {
      extra: { orderItemId, substituteListingId: substitute.id },
      tags: { area: "substitute_stock_decrement" },
    });
  }

  revalidatePath(`/orders/${order.id}`);
  return null;
}
