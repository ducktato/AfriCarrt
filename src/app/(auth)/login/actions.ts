"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/profile";
import { roleHome } from "@/lib/roles";

export type AuthActionState = { error: string } | null;

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  await ensureUserProfile(supabase, data.user);
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(next || roleHome(profile?.role));
}
