import { createClient } from "@/lib/supabase/server";
import { RegionBrowse } from "@/components/browse/RegionBrowse";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region } = await searchParams;
  const supabase = await createClient();

  const [{ data: regionRows }, itemsQuery] = await Promise.all([
    supabase.from("catalog_items").select("region").not("region", "is", null),
    region
      ? supabase
          .from("catalog_items")
          .select("id, name, category, subcategory, region, brand, suggested_price, image_url")
          .eq("region", region)
          .order("name")
          .limit(60)
      : supabase
          .from("catalog_items")
          .select("id, name, category, subcategory, region, brand, suggested_price, image_url")
          .order("name")
          .limit(60),
  ]);

  const regionCounts: Record<string, number> = {};
  for (const row of regionRows ?? []) {
    if (!row.region) continue;
    regionCounts[row.region] = (regionCounts[row.region] ?? 0) + 1;
  }

  const items = itemsQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Browse by country</h1>
      <p className="mt-1 text-ink/60">
        Tap a country on the map or a flag below to filter the catalog.
      </p>

      <div className="mt-6">
        <RegionBrowse regionCounts={regionCounts} />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          {region ? `${items.length} item${items.length === 1 ? "" : "s"} from ${region}` : `${items.length} items`}
        </h2>
        {items.length === 0 ? (
          <p className="text-ink/50">No items found for this region yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-sand bg-white p-3 text-sm shadow-sm"
              >
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
        )}
      </div>
    </div>
  );
}
