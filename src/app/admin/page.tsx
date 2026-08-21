import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/roles";
import { StoreActions } from "./StoreActions";
import { LiveStoreActions } from "./LiveStoreActions";
import { RecalculateCommissionButton } from "./RecalculateCommissionButton";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect(roleHome(profile?.role));
  }

  const { data: pendingStoresRaw } = await supabase
    .from("stores")
    .select(
      "id, name, address, business_license_status, created_at, ontario_corp_number, hst_number, google_place_id, google_places_match_status, google_places_name, google_places_address, business_registration_doc_path, food_handler_cert_path, certificate_of_insurance_path",
    )
    .eq("business_license_status", "pending")
    .order("created_at", { ascending: true });

  const pendingStores = pendingStoresRaw
    ? await Promise.all(
        pendingStoresRaw.map(async (store) => {
          const docPaths = {
            business_registration_doc: store.business_registration_doc_path,
            food_handler_cert: store.food_handler_cert_path,
            certificate_of_insurance: store.certificate_of_insurance_path,
          };
          const docLinks: Record<string, string | null> = {};
          for (const [key, path] of Object.entries(docPaths)) {
            if (!path) {
              docLinks[key] = null;
              continue;
            }
            const { data } = await supabase.storage
              .from("vendor-documents")
              .createSignedUrl(path, 3600);
            docLinks[key] = data?.signedUrl ?? null;
          }
          return { ...store, docLinks };
        }),
      )
    : null;

  const { data: liveStores } = await supabase
    .from("stores")
    .select("id, name, address, is_active, strike_count, suspension_level")
    .eq("business_license_status", "verified")
    .order("name", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Vendor verification queue</h1>
      {!pendingStores || pendingStores.length === 0 ? (
        <p className="mt-2 text-ink/60">No stores waiting on verification.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {pendingStores.map((store) => {
            const placesBadge = {
              matched: { label: "Google Places: matched", cls: "bg-forest/10 text-forest" },
              mismatch: { label: "Google Places: mismatch", cls: "bg-hibiscus/10 text-hibiscus" },
              not_found: { label: "Google Places: not found", cls: "bg-hibiscus/10 text-hibiscus" },
              error: { label: "Google Places: lookup error", cls: "bg-gold/10 text-gold" },
            }[store.google_places_match_status ?? ""] ?? {
              label: "Google Places: not checked",
              cls: "bg-sand text-ink/50",
            };

            const obrQuery = encodeURIComponent(store.ontario_corp_number ?? store.name);

            return (
              <li key={store.id} className="rounded-xl border border-sand bg-white p-4 text-sm shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="font-medium text-ink">{store.name}</span>{" "}
                    <span className="text-ink/50">— {store.address}</span>
                    <div className="mt-1 text-xs text-ink/50">
                      Corp #/BIN: {store.ontario_corp_number ?? "—"}
                      {store.hst_number ? ` · HST: ${store.hst_number}` : ""}
                    </div>
                  </div>
                  <StoreActions storeId={store.id} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${placesBadge.cls}`}>
                    {placesBadge.label}
                  </span>
                  <a
                    href={`https://www.ontario.ca/page/ontario-business-registry?search=${obrQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-ink/70 hover:bg-ink/10"
                  >
                    Check OBR →
                  </a>
                </div>

                {(store.google_places_name || store.google_places_address) && (
                  <p className="mt-1 text-xs text-ink/50">
                    Google match: {store.google_places_name ?? "—"} · {store.google_places_address ?? "—"}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {store.docLinks.business_registration_doc ? (
                    <a
                      href={store.docLinks.business_registration_doc}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-terracotta hover:underline"
                    >
                      Business registration doc
                    </a>
                  ) : (
                    <span className="text-ink/40">No business registration doc</span>
                  )}
                  {store.docLinks.food_handler_cert ? (
                    <a
                      href={store.docLinks.food_handler_cert}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-terracotta hover:underline"
                    >
                      Food handler cert
                    </a>
                  ) : (
                    <span className="text-ink/40">No food handler cert</span>
                  )}
                  {store.docLinks.certificate_of_insurance ? (
                    <a
                      href={store.docLinks.certificate_of_insurance}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-terracotta hover:underline"
                    >
                      Certificate of insurance
                    </a>
                  ) : (
                    <span className="text-ink/40">No certificate of insurance</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-sm text-ink/50">
        Approved stores become visible to customers immediately; rejected stores are disabled.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Live stores</h2>
        <RecalculateCommissionButton />
      </div>
      {!liveStores || liveStores.length === 0 ? (
        <p className="mt-2 text-ink/60">No verified stores yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {liveStores.map((store) => (
            <li
              key={store.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand bg-white px-4 py-3 text-sm shadow-sm"
            >
              <span>
                <span className="font-medium text-ink">{store.name}</span>{" "}
                <span className="text-ink/50">— {store.address}</span>{" "}
                {!store.is_active && (
                  <span className="rounded-full bg-hibiscus/10 px-2 py-0.5 text-xs font-semibold text-hibiscus">
                    Disabled
                  </span>
                )}
                {store.suspension_level !== "none" && (
                  <span className="ml-1 rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                    {store.suspension_level} ({store.strike_count} strike
                    {store.strike_count === 1 ? "" : "s"})
                  </span>
                )}
              </span>
              <LiveStoreActions storeId={store.id} isActive={store.is_active} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-ink/50">
        Disabling a store hides it from browsing and blocks new checkouts immediately.
      </p>
    </div>
  );
}
