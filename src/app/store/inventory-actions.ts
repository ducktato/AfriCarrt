"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type BulkEditState = { error: string } | { success: true; count: number } | null;

export async function bulkUpdateListings(
  _prevState: BulkEditState,
  formData: FormData,
): Promise<BulkEditState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ids = formData.getAll("listing_id").map(String).filter(Boolean);
  const priceRaw = String(formData.get("new_price") ?? "").trim();
  const stockRaw = String(formData.get("new_stock") ?? "").trim();
  const thresholdRaw = String(formData.get("new_threshold") ?? "").trim();

  if (ids.length === 0) return { error: "Select at least one listing." };
  if (!priceRaw && !stockRaw && !thresholdRaw) {
    return { error: "Enter a new price, stock, or low-stock threshold to apply." };
  }

  const update: { price?: number; stock_qty?: number; low_stock_threshold?: number } = {};
  if (priceRaw) {
    const price = parseFloat(priceRaw);
    if (!Number.isFinite(price) || price < 0) return { error: "Invalid price." };
    update.price = price;
  }
  if (stockRaw) {
    const stock = parseInt(stockRaw, 10);
    if (!Number.isFinite(stock) || stock < 0) return { error: "Invalid stock quantity." };
    update.stock_qty = stock;
  }
  if (thresholdRaw) {
    const threshold = parseInt(thresholdRaw, 10);
    if (!Number.isFinite(threshold) || threshold < 0) return { error: "Invalid low-stock threshold." };
    update.low_stock_threshold = threshold;
  }

  // RLS (listings_update_owner) already restricts this to the caller's own
  // store's listings regardless of which ids are passed in.
  const { error, count } = await supabase
    .from("store_listings")
    .update(update, { count: "exact" })
    .in("id", ids);

  if (error) return { error: error.message };

  revalidatePath("/store");
  return { success: true, count: count ?? ids.length };
}
