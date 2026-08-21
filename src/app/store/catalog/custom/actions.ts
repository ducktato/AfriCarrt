"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getOwnedStore(supabase: SupabaseServerClient, userId: string) {
  const { data } = await supabase.from("stores").select("id").eq("owner_id", userId).limit(1).maybeSingle();
  return data;
}

export type SimilarItem =
  Database["public"]["Functions"]["find_similar_catalog_items"]["Returns"][number];

// Plain server function (not a form action) -- called directly from the
// client on a debounced name change to power the "Did you mean...?" check.
export async function checkSimilarItems(name: string): Promise<SimilarItem[]> {
  if (name.trim().length < 3) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_similar_catalog_items", {
    search: name.trim(),
    match_threshold: 0.3,
    match_limit: 5,
  });
  if (error) return [];
  return data ?? [];
}

export type CustomItemActionState = { error: string } | null;

export async function createCustomListing(
  _prevState: CustomItemActionState,
  formData: FormData,
): Promise<CustomItemActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const store = await getOwnedStore(supabase, user.id);
  if (!store) return { error: "Set up your store before adding listings." };

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const price = parseFloat(String(formData.get("price") ?? ""));
  const stockQty = parseInt(String(formData.get("stock_qty") ?? "0"), 10);
  const isPerishable = formData.get("is_perishable") === "on";
  const isReturnable = formData.get("is_returnable") === "on";
  const photo = formData.get("photo") as File | null;

  if (!name || !category || !Number.isFinite(price) || price < 0) {
    return { error: "Name, category, and a valid price are required." };
  }

  let customImageUrl: string | null = null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() || "jpg";
    const path = `${store.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, photo, { contentType: photo.type });
    if (uploadError) return { error: `Photo upload failed: ${uploadError.message}` };
    customImageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("store_listings").insert({
    store_id: store.id,
    catalog_item_id: null,
    custom_name: name,
    custom_category: category,
    custom_image_url: customImageUrl,
    price,
    stock_qty: Number.isFinite(stockQty) ? stockQty : 0,
    is_perishable: isPerishable,
    is_returnable: isReturnable,
  });

  if (error) return { error: error.message };

  redirect("/store/catalog?added=1");
}
