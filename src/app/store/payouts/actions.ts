"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";

export type PayoutsActionState = { error: string } | null;

export async function startStripeOnboarding(
  _prevState: PayoutsActionState,
  formData: FormData,
): Promise<PayoutsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const storeId = String(formData.get("store_id") ?? "");
  const { data: store } = await supabase
    .from("stores")
    .select("id, owner_id, name, stripe_connect_account_id")
    .eq("id", storeId)
    .single();

  if (!store || store.owner_id !== user.id) {
    return { error: "Store not found." };
  }

  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Service client: stripe_connect_account_id is server-only writable
  // (see the prevent_store_privileged_field_change trigger).
  const service = createServiceClient();

  let accountId = store.stripe_connect_account_id;
  let onboardingUrl: string;

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "CA",
        email: user.email ?? undefined,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { store_id: store.id },
      });
      accountId = account.id;
      await service.from("stores").update({ stripe_connect_account_id: accountId }).eq("id", store.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/store/payouts`,
      return_url: `${origin}/store/payouts/return?store_id=${store.id}`,
      type: "account_onboarding",
    });
    onboardingUrl = accountLink.url;
  } catch (err) {
    Sentry.captureException(err, {
      extra: { storeId: store.id },
      tags: { area: "stripe_connect_onboarding" },
    });
    const message = err instanceof Error ? err.message : "Could not start Stripe onboarding.";
    return { error: message };
  }

  redirect(onboardingUrl);
}
