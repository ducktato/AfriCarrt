import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/profile";
import { roleHome } from "@/lib/roles";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await ensureUserProfile(supabase, data.user);
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      return NextResponse.redirect(
        `${origin}${next ?? roleHome(profile?.role)}`,
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Could not confirm your email. Please try again.`,
  );
}
