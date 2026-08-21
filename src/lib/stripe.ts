import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Platform commission taken out of the item subtotal before transferring the
// rest to the store's connected account. Delivery fee is not shared with the
// store -- it's a platform-side pass-through cost (Uber Direct). 15% is the
// default rate (stores.commission_rate); a lower rate can be set per-store
// by an admin for the future loyalty step-down program.
export const DEFAULT_COMMISSION_RATE = 0.15;

export function computeCommission(subtotal: number, rate: number = DEFAULT_COMMISSION_RATE) {
  return Math.round(subtotal * rate * 100) / 100;
}

// Feature 2 (stock-shortfall handling): we authorize more than the order
// total so that if the customer picks a pricier substitute for an
// unavailable item, we can usually capture the real final amount from the
// same hold -- no second charge, no refund. Delivery fee isn't buffered
// (it's fixed, not subject to substitution).
export const AVAILABILITY_BUFFER_RATE = 0.2;

export function computeAuthorizedAmount(subtotal: number, deliveryFee: number) {
  const bufferedSubtotal = Math.round(subtotal * (1 + AVAILABILITY_BUFFER_RATE) * 100) / 100;
  return bufferedSubtotal + deliveryFee;
}
