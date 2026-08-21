import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/roles";

export default async function CustomerDashboardPage() {
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

  if (profile?.role && profile.role !== "customer") {
    redirect(roleHome(profile.role));
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
      </h1>
      <p className="mt-2 text-ink/60">Browse local stores, or check your past orders.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/stores"
          className="inline-block rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-parchment transition hover:bg-terracotta/90"
        >
          Browse stores
        </Link>
        <Link
          href="/orders"
          className="inline-block rounded-full border border-terracotta px-5 py-2.5 text-sm font-semibold text-terracotta transition hover:bg-terracotta/10"
        >
          Your orders
        </Link>
      </div>
    </div>
  );
}
