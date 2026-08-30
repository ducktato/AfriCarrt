import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();

  const [storesQuery, itemsQuery] = query
    ? await Promise.all([
        supabase
          .from("stores")
          .select("id, name, address")
          .eq("verified", true)
          .eq("is_active", true)
          .ilike("name", `%${query}%`)
          .limit(10),
        supabase
          .from("catalog_items")
          .select("id, name, category, brand, suggested_price")
          .or(`name.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%`)
          .order("name")
          .limit(60),
      ])
    : [{ data: [] }, { data: [] }];

  const stores = storesQuery.data ?? [];
  const items = itemsQuery.data ?? [];
  const hasQuery = query.length > 0;
  const hasResults = stores.length > 0 || items.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        {hasQuery ? `Results for "${query}"` : "Search"}
      </h1>

      {!hasQuery && <p className="mt-2 text-ink/60">Type in the search bar above to find products or stores.</p>}

      {hasQuery && !hasResults && (
        <p className="mt-4 text-ink/50">No products or stores matched &quot;{query}&quot;.</p>
      )}

      {stores.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Stores</h2>
          <ul className="space-y-2">
            {stores.map((store) => (
              <li key={store.id}>
                <Link
                  href={`/stores/${store.id}`}
                  className="block rounded-xl border border-sand bg-white p-4 text-sm shadow-sm transition hover:border-ink/25"
                >
                  <span className="font-medium text-ink">{store.name}</span>{" "}
                  <span className="text-ink/50">— {store.address}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">
            Products ({items.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-sand bg-white p-3 text-sm shadow-sm">
                <p className="font-medium text-ink">{item.name}</p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {item.brand ? `${item.brand} · ` : ""}
                  {item.category}
                </p>
                <p className="mt-1 font-mono font-medium text-terracotta">
                  ${Number(item.suggested_price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink/40">
            Products shown are from the shared catalog — availability depends on which stores currently
            carry them. Visit a store page to add items to your cart.
          </p>
        </div>
      )}
    </div>
  );
}
