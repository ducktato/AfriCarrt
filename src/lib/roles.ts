import type { UserRole } from "@/lib/supabase/types";

export function roleHome(role?: UserRole | string | null) {
  switch (role) {
    case "store_owner":
      return "/store";
    case "admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}
