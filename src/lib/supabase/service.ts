import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Bypasses RLS entirely. Only for server-only code with no user session to
// act as -- webhook handlers, and privileged writes (Stripe Connect fields,
// order/order_items/payouts creation) that have no client-facing policy on
// purpose. Never import this into a Client Component or expose it to a
// user-triggered request path without its own authorization check.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
