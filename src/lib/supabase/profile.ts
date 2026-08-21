import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/lib/supabase/types";

// There is no DB trigger that mirrors auth.users -> public.users (see
// migration 20260817194846_rls_policies.sql: only a users_insert_own RLS
// policy exists). Email confirmation is required on this project, so a
// fresh signUp() has no session yet to insert with — the profile row has
// to be created lazily, the first time we see an authenticated session for
// a user who doesn't have one (auth callback, login).
export async function ensureUserProfile(
  supabase: SupabaseClient<Database>,
  user: User,
) {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const metadata = user.user_metadata as {
    role?: UserRole;
    full_name?: string;
    phone?: string;
    terms_accepted_at?: string;
  };

  await supabase.from("users").insert({
    id: user.id,
    role: metadata.role ?? "customer",
    full_name: metadata.full_name ?? null,
    phone: metadata.phone ?? null,
    terms_accepted_at: metadata.terms_accepted_at ?? null,
  });
}
