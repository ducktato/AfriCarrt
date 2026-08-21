import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCartButton } from "./AddToCartButton";

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, address, description")
    .eq("id", id)
    .eq("verified", true)
    .eq("is_active", true)
    .maybeSingle();

  if (!store) notFound();

  const { data: listings } = await supabase
    .from("store_listings")
    .select(
      "id, price, stock_qty, custom_name, custom_category, custom_image_url, catalog_items(name, category, image_url)",
    )
    .eq("store_id", store.id)
    .eq("is_active", true)
    .gt("stock_qty", 0)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{store.name}</h1>
      <p className="mt-1 text-ink/60">{store.address}</p>
      {store.description && <p className="mt-2 text-ink/70">{store.description}</p>}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(listings ?? []).map((l) => {
          const name = l.custom_name ?? l.catalog_items?.name ?? "Item";
          const category = l.custom_category ?? l.catalog_items?.category ?? "";
          return (
            <div key={l.id} className="flex items-center justify-between rounded-xl border border-sand bg-white p-4 shadow-sm">
              <div>
                <p className="font-medium text-ink">{name}</p>
                <p className="text-xs text-ink/50">{category}</p>
                <p className="mt-1 font-mono font-medium text-terracotta">${Number(l.price).toFixed(2)}</p>
              </div>
              <AddToCartButton
                storeId={store.id}
                storeName={store.name}
                listingId={l.id}
                name={name}
                price={Number(l.price)}
                imageUrl={l.custom_image_url ?? l.catalog_items?.image_url ?? null}
              />
            </div>
          );
        })}
        {(!listings || listings.length === 0) && (
          <p className="text-ink/50">This store hasn&apos;t listed any items yet.</p>
        )}
      </div>

      {listings && listings.length > 0 && (
        <p className="mt-4 text-xs text-ink/40">
          Product images are for illustration only — actual packaging, brand, and appearance may vary.
        </p>
      )}
    </div>
  );
}
