"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ListingActionState = { error: string } | { success: true } | null;

async function getOwnedStoreId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("stores").select("id").eq("owner_id", userId).limit(1).maybeSingle();
  return data?.id ?? null;
}

export async function addListingFromCatalog(
  _prevState: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const storeId = await getOwnedStoreId(supabase, user.id);
  if (!storeId) return { error: "Set up your store before adding listings." };

  const catalogItemId = String(formData.get("catalog_item_id") ?? "");
  const price = parseFloat(String(formData.get("price") ?? ""));
  const stockQty = parseInt(String(formData.get("stock_qty") ?? "0"), 10);
  const isPerishable = formData.get("is_perishable") === "true";
  const isReturnable = formData.get("is_returnable") === "true";

  if (!catalogItemId || !Number.isFinite(price) || price < 0) {
    return { error: "Invalid price." };
  }

  const { error } = await supabase.from("store_listings").insert({
    store_id: storeId,
    catalog_item_id: catalogItemId,
    price,
    stock_qty: Number.isFinite(stockQty) ? stockQty : 0,
    is_perishable: isPerishable,
    is_returnable: isReturnable,
  });

  if (error) return { error: error.message };

  revalidatePath("/store/catalog");
  return { success: true };
}
