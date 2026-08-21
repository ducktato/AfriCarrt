"use server";

import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyBusinessListing } from "@/lib/google-places";

export type StoreActionState = { error: string } | null;

const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024;

async function uploadVendorDoc(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
  field: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${storeId}/${field}.${ext}`;
  const { error } = await supabase.storage.from("vendor-documents").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

export async function createStore(
  _prevState: StoreActionState,
  formData: FormData,
): Promise<StoreActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const ontarioCorpNumber = String(formData.get("ontario_corp_number") ?? "").trim();
  const hstNumber = String(formData.get("hst_number") ?? "").trim();
  const vendorAgreementAccepted = formData.get("accept_vendor_agreement") === "on";

  const businessRegistrationDoc = formData.get("business_registration_doc") as File | null;
  const foodHandlerCert = formData.get("food_handler_cert") as File | null;
  const certificateOfInsurance = formData.get("certificate_of_insurance") as File | null;

  if (!name || !address) {
    return { error: "Store name and address are required." };
  }
  if (!ontarioCorpNumber) {
    return { error: "Ontario Corporation Number or BIN is required." };
  }
  if (!vendorAgreementAccepted) {
    return { error: "You must accept the Vendor Agreement to create a store." };
  }
  for (const [label, file] of [
    ["Business registration document", businessRegistrationDoc],
    ["Food handler certificate", foodHandlerCert],
    ["Certificate of insurance", certificateOfInsurance],
  ] as const) {
    if (!file || file.size === 0) return { error: `${label} is required.` };
    if (file.size > MAX_DOC_SIZE_BYTES) return { error: `${label} must be under 10MB.` };
  }

  const { data: store, error: insertError } = await supabase
    .from("stores")
    .insert({
      owner_id: user.id,
      name,
      address,
      description: description || null,
      phone: phone || null,
      ontario_corp_number: ontarioCorpNumber,
      hst_number: hstNumber || null,
      vendor_agreement_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !store) return { error: insertError?.message ?? "Could not create store." };

  try {
    const [businessRegistrationDocPath, foodHandlerCertPath, certificateOfInsurancePath] =
      await Promise.all([
        uploadVendorDoc(supabase, store.id, "business-registration", businessRegistrationDoc!),
        uploadVendorDoc(supabase, store.id, "food-handler-cert", foodHandlerCert!),
        uploadVendorDoc(supabase, store.id, "certificate-of-insurance", certificateOfInsurance!),
      ]);

    await supabase
      .from("stores")
      .update({
        business_registration_doc_path: businessRegistrationDocPath,
        food_handler_cert_path: foodHandlerCertPath,
        certificate_of_insurance_path: certificateOfInsurancePath,
      })
      .eq("id", store.id);
  } catch (err) {
    Sentry.captureException(err, {
      extra: { storeId: store.id },
      tags: { area: "vendor_document_upload" },
    });
    return { error: "Store created, but a document upload failed. Contact support to finish verification." };
  }

  // Google Places match is a system-computed, admin-only field -- write it
  // via the service client (the owner-scoped client is blocked from touching
  // it by the same trigger that guards Stripe Connect / verified / etc).
  try {
    const placesResult = await verifyBusinessListing(name, address);
    const service = createServiceClient();
    await service
      .from("stores")
      .update({
        google_place_id: placesResult.placeId,
        google_places_match_status: placesResult.matchStatus,
        google_places_name: placesResult.name,
        google_places_address: placesResult.formattedAddress,
      })
      .eq("id", store.id);
  } catch (err) {
    console.error("Google Places verification failed", err);
    Sentry.captureException(err, {
      extra: { storeId: store.id, name, address },
      tags: { area: "google_places_verification" },
    });
    // Non-fatal -- the admin queue just shows "error" and falls back to
    // manual review; the store creation itself still succeeds.
  }

  redirect("/store");
}
