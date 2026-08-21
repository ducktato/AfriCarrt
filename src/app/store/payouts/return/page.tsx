import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";

export default async function StripeOnboardingReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ store_id?: string }>;
}) {
  const { store_id } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (store_id) {
    const { data: store } = await supabase
      .from("stores")
      .select("id, owner_id, stripe_connect_account_id")
      .eq("id", store_id)
      .single();

    if (store && store.owner_id === user.id && store.stripe_connect_account_id) {
      const account = await stripe.accounts.retrieve(store.stripe_connect_account_id);
      if (account.details_submitted && account.charges_enabled) {
        const service = createServiceClient();
        await service.from("stores").update({ stripe_connect_onboarded: true }).eq("id", store.id);
      }
    }
  }

  redirect("/store/payouts");
}
