import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/roles";
import { logout } from "@/lib/auth-actions";
import { CartLink } from "@/components/CartLink";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null | undefined = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role;
  }

  return (
    <header className="flex h-16 items-center justify-between bg-ink px-4 sm:px-6">
      <Link href="/" className="font-display text-xl font-semibold text-parchment">
        AfriCarrt
      </Link>
      <nav className="flex items-center gap-5 text-sm">
        <Link href="/stores" className="font-medium text-parchment/80 transition hover:text-parchment">
          Stores
        </Link>
        <Link href="/browse" className="font-medium text-parchment/80 transition hover:text-parchment">
          Browse
        </Link>
        <CartLink />
        {user ? (
          <>
            <Link
              href={roleHome(role)}
              className="font-medium text-parchment/80 transition hover:text-parchment"
            >
              My account
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-parchment/30 px-3.5 py-1.5 font-medium text-parchment/90 transition hover:border-parchment/60 hover:text-parchment"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="font-medium text-parchment/80 transition hover:text-parchment">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-terracotta px-4 py-1.5 font-medium text-parchment transition hover:bg-terracotta/90"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
