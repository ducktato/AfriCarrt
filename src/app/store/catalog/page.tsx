import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddListingRow } from "./AddListingRow";

export default async function StoreCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!store) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-10 text-center sm:px-6">
        <h1 className="font-display text-xl font-semibold text-ink">Set up your store first</h1>
        <p className="mt-2 text-ink/60">
          You need a store before you can add products from the catalog.
        </p>
        <Link
          href="/store/new"
          className="mt-4 inline-block rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-parchment hover:bg-terracotta/90"
        >
          Create your store
        </Link>
      </div>
    );
  }

  let query = supabase
    .from("catalog_items")
    .select("id, name, category, subcategory, brand, suggested_price, is_perishable, is_returnable")
    .order("name")
    .limit(50);
  if (q) query = query.ilike("name", `%${q}%`);

  const [{ data: items }, { data: existingListings }] = await Promise.all([
    query,
    supabase.from("store_listings").select("catalog_item_id").eq("store_id", store.id),
  ]);

  const listedIds = new Set((existingListings ?? []).map((l) => l.catalog_item_id));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold text-ink">Add from catalog</h1>
        <Link href="/store/catalog/custom" className="text-sm font-medium text-terracotta hover:underline">
          Can&apos;t find it? Add a custom item →
        </Link>
      </div>
      <p className="mt-1 text-ink/60">
        For {store.name}. Prices pre-fill from the shared catalog — edit freely before confirming.
      </p>

      <form className="mt-4" action="/store/catalog" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search the catalog..."
          className="w-full max-w-sm rounded-full border border-sand bg-white px-4 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </form>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(items ?? []).map((item) => (
          <AddListingRow key={item.id} item={item} alreadyListed={listedIds.has(item.id)} />
        ))}
        {items && items.length === 0 && (
          <p className="text-ink/50">No catalog items match &quot;{q}&quot;.</p>
        )}
      </div>
    </div>
  );
}
