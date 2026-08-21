import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/roles";
import { InventoryTable, type ListingRow } from "./InventoryTable";

export default async function StoreOwnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role && profile.role !== "store_owner") {
    redirect(roleHome(profile.role));
  }

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, verified, is_active, business_license_status, strike_count, suspension_level")
    .eq("owner_id", user.id);

  const primaryStore = stores?.[0];

  let listings: ListingRow[] = [];
  if (primaryStore) {
    const { data: rows } = await supabase
      .from("store_listings")
      .select(
        "id, price, stock_qty, low_stock_threshold, is_active, custom_name, custom_category, catalog_items(name, category)",
      )
      .eq("store_id", primaryStore.id)
      .order("created_at", { ascending: false });

    listings = (rows ?? []).map((r) => ({
      id: r.id,
      name: r.custom_name ?? r.catalog_items?.name ?? "Untitled item",
      category: r.custom_category ?? r.catalog_items?.category ?? "—",
      price: Number(r.price),
      stock_qty: r.stock_qty,
      low_stock_threshold: r.low_stock_threshold,
      is_active: r.is_active,
    }));
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
      </h1>
      {!stores || stores.length === 0 ? (
        <div className="mt-4">
          <p className="text-ink/60">You haven&apos;t set up a store yet.</p>
          <Link
            href="/store/new"
            className="mt-3 inline-block rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-parchment transition hover:bg-terracotta/90"
          >
            Create your store
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {stores.map((store) => (
              <li
                key={store.id}
                className="rounded-xl border border-sand bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span className="font-medium text-ink">{store.name}</span>{" "}
                <span className="text-ink/60">
                  —{" "}
                  {store.verified ? (
                    <span className="text-forest">verified</span>
                  ) : (
                    `${store.business_license_status}, awaiting verification`
                  )}
                  {!store.is_active && " (disabled)"}
                </span>
                {store.suspension_level !== "none" && (
                  <p className="mt-1 text-xs font-semibold text-hibiscus">
                    Performance standing: {store.suspension_level} ({store.strike_count} strike
                    {store.strike_count === 1 ? "" : "s"} on record)
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/store/catalog"
              className="inline-block rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-parchment transition hover:bg-forest/90"
            >
              Add products
            </Link>
            <Link
              href="/store/payouts"
              className="inline-block rounded-full border border-terracotta px-5 py-2.5 text-sm font-semibold text-terracotta transition hover:bg-terracotta/10"
            >
              Payouts
            </Link>
            <Link
              href="/store/orders"
              className="inline-block rounded-full border border-terracotta px-5 py-2.5 text-sm font-semibold text-terracotta transition hover:bg-terracotta/10"
            >
              Pending orders
            </Link>
          </div>

          <div className="mt-10">
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">Inventory</h2>
            <InventoryTable listings={listings} />
          </div>
        </>
      )}
    </div>
  );
}
