"use server";

import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { stripe, computeCommission, computeAuthorizedAmount } from "@/lib/stripe";
import { computeDeliveryFee } from "@/lib/delivery";
import type { DeliveryTier, FulfillmentType } from "@/lib/supabase/types";

export interface CheckoutInput {
  storeId: string;
  items: { storeListingId: string; qty: number }[];
  fulfillmentType: FulfillmentType;
  deliveryTier: DeliveryTier | null;
  deliveryAddress: string | null;
}

export type CheckoutResult =
  | { clientSecret: string; displayTotal: number }
  | { error: string };

// Creates a manual-capture PaymentIntent, authorized for more than the
// displayed total (see computeAuthorizedAmount) so that a pricier substitute
// chosen during the post-payment stock-check window can usually be captured
// from this same hold instead of needing a second charge. The customer only
// ever sees/confirms `displayTotal` on the payment form -- the buffer is an
// invisible-to-them authorization headroom, standard practice for
// hold-then-settle flows (hotels, car rentals).
export async function createPaymentIntent(input: CheckoutInput): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to check out." };
  if (input.items.length === 0) return { error: "Your cart is empty." };
  if (input.fulfillmentType === "delivery" && !input.deliveryTier) {
    return { error: "Choose a delivery speed." };
  }
  if (input.fulfillmentType === "delivery" && !input.deliveryAddress?.trim()) {
    return { error: "Enter a delivery address." };
  }

  // Re-fetch everything server-side -- never trust client-submitted prices.
  const listingIds = input.items.map((i) => i.storeListingId);
  const { data: listings } = await supabase
    .from("store_listings")
    .select("id, price, stock_qty, is_active, store_id, custom_name, catalog_items(name)")
    .in("id", listingIds);

  if (!listings || listings.length !== listingIds.length) {
    return { error: "Some items in your cart are no longer available." };
  }
  if (listings.some((l) => l.store_id !== input.storeId)) {
    return { error: "Cart contains items from more than one store." };
  }
  if (listings.some((l) => !l.is_active)) {
    return { error: "Some items in your cart are no longer listed." };
  }
  for (const item of input.items) {
    const listing = listings.find((l) => l.id === item.storeListingId);
    if (!listing || listing.stock_qty < item.qty) {
      return { error: `Not enough stock for one of your items.` };
    }
  }

  const { data: store } = await supabase
    .from("stores")
    .select(
      "id, name, verified, is_active, address, stripe_connect_account_id, stripe_connect_onboarded, commission_rate",
    )
    .eq("id", input.storeId)
    .single();

  if (!store || !store.verified || !store.is_active) {
    return { error: "This store isn't available for orders right now." };
  }
  if (!store.stripe_connect_onboarded || !store.stripe_connect_account_id) {
    return { error: "This store hasn't finished payment setup yet -- check back soon." };
  }

  const subtotal = input.items.reduce((sum, item) => {
    const listing = listings.find((l) => l.id === item.storeListingId)!;
    return sum + Number(listing.price) * item.qty;
  }, 0);
  const deliveryFee = computeDeliveryFee(input.fulfillmentType, input.deliveryTier);
  const commission = computeCommission(subtotal, Number(store.commission_rate));
  const displayTotal = subtotal + deliveryFee;
  const authorizedAmount = computeAuthorizedAmount(subtotal, deliveryFee);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(authorizedAmount * 100),
      currency: "cad",
      capture_method: "manual",
      // Card only, not automatic_payment_methods: wallet UIs (Apple/Google
      // Pay) surface the PaymentIntent's actual amount in their own sheet,
      // which would show the buffered hold instead of the real order total.
      payment_method_types: ["card"],
      receipt_email: user.email ?? undefined,
      metadata: {
        customer_id: user.id,
        store_id: input.storeId,
        fulfillment_type: input.fulfillmentType,
        delivery_tier: input.deliveryTier ?? "",
        delivery_address: input.deliveryAddress ?? "",
        store_address: store.address,
        subtotal: subtotal.toFixed(2),
        delivery_fee: deliveryFee.toFixed(2),
        commission_amount: commission.toFixed(2),
        commission_rate: String(store.commission_rate),
        authorized_amount: authorizedAmount.toFixed(2),
        items: JSON.stringify(input.items),
      },
    });

    if (!paymentIntent.client_secret) return { error: "Could not start checkout." };
    return { clientSecret: paymentIntent.client_secret, displayTotal };
  } catch (err) {
    Sentry.captureException(err, {
      extra: { storeId: input.storeId, customerId: user.id },
      tags: { area: "stripe_payment_intent_create" },
    });
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return { error: message };
  }
}
