"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type StoreActionState = { error: string } | null;

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
}

export async function approveStore(
  _prevState: StoreActionState,
  formData: FormData,
): Promise<StoreActionState> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const storeId = String(formData.get("store_id") ?? "");
  if (!storeId) return { error: "Missing store id." };

  const { error } = await supabase
    .from("stores")
    .update({ verified: true, business_license_status: "verified" })
    .eq("id", storeId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return null;
}

export async function recalculateCommissionRates(): Promise<StoreActionState> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  // Direct RPC access is restricted to service_role (see migration
  // restrict_recalculate_commission_rates_grant) -- requireAdmin() above is
  // the actual gate; this call just needs a client with permission to run.
  const service = createServiceClient();
  const { error } = await service.rpc("recalculate_commission_rates");
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return null;
}

export async function setStoreActive(
  _prevState: StoreActionState,
  formData: FormData,
): Promise<StoreActionState> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const storeId = String(formData.get("store_id") ?? "");
  const isActive = formData.get("is_active") === "true";
  if (!storeId) return { error: "Missing store id." };

  const { error } = await supabase.from("stores").update({ is_active: isActive }).eq("id", storeId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return null;
}

export async function rejectStore(
  _prevState: StoreActionState,
  formData: FormData,
): Promise<StoreActionState> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const storeId = String(formData.get("store_id") ?? "");
  if (!storeId) return { error: "Missing store id." };

  const { error } = await supabase
    .from("stores")
    .update({ business_license_status: "rejected", is_active: false })
    .eq("id", storeId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return null;
}
