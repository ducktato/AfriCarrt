"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/profile";
import { roleHome } from "@/lib/roles";
import { addSignupContact } from "@/lib/resend";
import type { UserRole } from "@/lib/supabase/types";

export type AuthActionState = { error: string } | null;

export async function signup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "customer") as UserRole;
  const acceptedTerms = formData.get("accept_terms") === "on";

  if (!email || !password || !fullName) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (role !== "customer" && role !== "store_owner") {
    return { error: "Invalid role selected." };
  }
  if (!acceptedTerms) {
    return { error: "You must accept the Terms of Service and Privacy Policy to sign up." };
  }

  const supabase = await createClient();
  const origin =
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const termsAcceptedAt = new Date().toISOString();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { role, full_name: fullName, phone: phone || null, terms_accepted_at: termsAcceptedAt },
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Something went wrong. Please try again." };

  await addSignupContact({ email, fullName, role });

  // mailer_autoconfirm is off for this project, so signUp() normally returns
  // no session — but handle the confirmed-immediately case too, just in case.
  if (data.session) {
    await ensureUserProfile(supabase, data.user);
    redirect(roleHome(role));
  }

  redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
}
