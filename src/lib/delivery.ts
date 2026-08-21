import type { DeliveryTier, FulfillmentType } from "@/lib/supabase/types";

// Flat-rate placeholder -- real distance-based pricing needs store/customer
// geolocation, which is stubbed for now (see CLAUDE.md conversion notes).
// Uber Direct's own quote (fetched at checkout time) is the source of truth
// for what we actually pay Uber; this is what we charge the customer.
const REGULAR_DELIVERY_FEE = 5.99;
const PRIORITY_MULTIPLIER = 1.6;

export function computeDeliveryFee(fulfillmentType: FulfillmentType, tier: DeliveryTier | null) {
  if (fulfillmentType === "pickup") return 0;
  if (tier === "priority") return Math.round(REGULAR_DELIVERY_FEE * PRIORITY_MULTIPLIER * 100) / 100;
  return REGULAR_DELIVERY_FEE;
}
