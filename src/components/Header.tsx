import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/roles";
import { HeaderNav } from "@/components/HeaderNav";

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
    <header className="relative flex h-16 items-center justify-between bg-ink px-4 sm:px-6">
      <Link href="/" className="font-display text-xl font-semibold text-parchment">
        AfriCarrt
      </Link>
      <HeaderNav isLoggedIn={!!user} accountHref={roleHome(role)} />
    </header>
  );
}
