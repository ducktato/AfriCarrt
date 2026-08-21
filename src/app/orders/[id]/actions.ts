"use server";

import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, qty, availability_status, order_id, orders(id, customer_id, dispatch_at, captured_at, store_id)")
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
