import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StoresPage() {
  const supabase = await createClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, address, description")
    .eq("verified", true)
    .eq("is_active", true)
    .order("name");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Stores</h1>
      <p className="mt-1 text-ink/60">Verified African &amp; Caribbean grocers in Toronto.</p>

      {!stores || stores.length === 0 ? (
        <p className="mt-6 text-ink/50">No verified stores yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/stores/${store.id}`}
              className="rounded-xl border border-sand bg-white p-4 shadow-sm transition hover:border-terracotta/40"
            >
              <p className="font-display text-lg font-semibold text-ink">{store.name}</p>
              <p className="mt-0.5 text-sm text-ink/50">{store.address}</p>
              {store.description && <p className="mt-2 text-sm text-ink/70">{store.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
