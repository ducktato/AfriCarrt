import { Resend } from "resend";
import type { UserRole } from "@/lib/supabase/types";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Resend segment IDs (dashboard: Audiences), one per signup role.
export const RESEND_SEGMENT_ID_BY_ROLE: Partial<Record<UserRole, string>> = {
  customer: "5755c1ce-b531-45b6-abb1-1597cecd478f",
  store_owner: "93a39439-3a6f-4e2e-800e-649ffd97bc8e",
};

// Best-effort: a signup should never fail because the marketing contact
// sync failed, so this only ever logs on error.
export async function addSignupContact({
  email,
  fullName,
  role,
}: {
  email: string;
  fullName: string;
  role: UserRole;
}) {
  const segmentId = RESEND_SEGMENT_ID_BY_ROLE[role];
  if (!segmentId || !process.env.RESEND_API_KEY) return;

  const [firstName, ...rest] = fullName.trim().split(/\s+/);

  try {
    await resend.contacts.create({
      email,
      firstName,
      lastName: rest.join(" ") || undefined,
      segments: [{ id: segmentId }],
    });
  } catch (err) {
    console.error("Resend contact sync failed:", err);
  }
}

// Best-effort: the in-app realtime banner on the order page is the primary
// notification channel; email must never block or fail the flag action.
export async function sendItemUnavailableEmail({
  to,
  itemName,
  orderId,
  siteUrl,
}: {
  to: string;
  itemName: string;
  orderId: string;
  siteUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    await resend.emails.send({
      from: "AfriCarrt <orders@africarrt.com>",
      to,
      subject: `Action needed: "${itemName}" is unavailable`,
      text:
        `One of the items in your recent AfriCarrt order — "${itemName}" — is unavailable.\n\n` +
        `Choose a substitute or accept a partial refund within the next few minutes, or we'll ` +
        `automatically refund you for this item and continue with the rest of your order.\n\n` +
        `Respond here: ${siteUrl}/orders/${orderId}`,
    });
  } catch (err) {
    console.error("Resend item-unavailable email failed:", err);
  }
}

// Rare path: the net total after substitutions exceeded even the buffered
// authorization hold. We've already captured everything the hold covers;
// this asks the customer to pay the small remaining difference separately.
export async function sendTopUpPaymentEmail({
  to,
  orderId,
  amountDue,
  paymentUrl,
}: {
  to: string;
  orderId: string;
  amountDue: number;
  paymentUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    await resend.emails.send({
      from: "AfriCarrt <orders@africarrt.com>",
      to,
      subject: `A small balance is due on order #${orderId.slice(0, 8)}`,
      text:
        `The substitute item(s) in your recent AfriCarrt order came to a bit more than your original ` +
        `payment covered. A balance of $${amountDue.toFixed(2)} is due to complete the order.\n\n` +
        `Pay here: ${paymentUrl}\n\n` +
        `Your order is already being prepared and this does not affect your delivery/pickup.`,
    });
  } catch (err) {
    console.error("Resend top-up payment email failed:", err);
  }
}
