import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StartOnboardingButton } from "./StartOnboardingButton";

export default async function StorePayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, stripe_connect_account_id, stripe_connect_onboarded")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!store) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-10 text-center sm:px-6">
        <h1 className="font-display text-xl font-semibold text-ink">Set up your store first</h1>
        <Link
          href="/store/new"
          className="mt-4 inline-block rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-parchment hover:bg-terracotta/90"
        >
          Create your store
        </Link>
      </div>
    );
  }

  const { data: payouts } = await supabase
    .from("payouts")
    .select("id, amount, status, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Payouts</h1>
      <p className="mt-1 text-ink/60">For {store.name}.</p>

      <div className="mt-6 rounded-2xl border border-sand bg-white p-6 shadow-sm">
        {store.stripe_connect_onboarded ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-forest">
            <span className="h-2 w-2 rounded-full bg-forest" /> Connected — you can receive payouts.
          </p>
        ) : (
          <>
            <p className="text-sm text-ink/70">
              Connect a Stripe account so we can pay you out for each order (minus AfriCarrt&apos;s commission).
              Customers can&apos;t check out from your store until this is done.
            </p>
            <StartOnboardingButton storeId={store.id} />
          </>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Recent payouts</h2>
        {!payouts || payouts.length === 0 ? (
          <p className="text-ink/50">No payouts yet.</p>
        ) : (
          <ul className="space-y-2">
            {payouts.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-sand bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span className="font-mono text-ink">${Number(p.amount).toFixed(2)}</span>
                <span
                  className={
                    p.status === "paid"
                      ? "text-forest"
                      : p.status === "failed"
                        ? "text-hibiscus"
                        : "text-gold"
                  }
                >
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
