// Shared with src/app/api/cron/process-dispatch-queue/route.ts and
// src/app/orders/[id]/actions.ts -- both need the exact same "what does this
// order currently total" math, and a drift between the two is exactly how
// the buffered-authorization overflow exploit (CVE-worthy: pick an
// expensive substitute, never pay the top-up, get dispatched anyway) would
// silently come back after being fixed once.
export function orderItemLineTotal(item: {
  qty: number;
  price_at_purchase: number;
  availability_status: string;
  effective_price: number | null;
}) {
  if (item.availability_status === "resolved_refund") return 0;
  if (item.availability_status === "resolved_substitute") {
    return Number(item.effective_price ?? 0) * item.qty;
  }
  // Still "flagged" (unresolved) or "available" -- counts at its original
  // price, matching what it will settle to if never touched again.
  return Number(item.price_at_purchase) * item.qty;
}

export function orderSubtotal(
  items: {
    qty: number;
    price_at_purchase: number;
    availability_status: string;
    effective_price: number | null;
  }[],
) {
  return Math.round(items.reduce((sum, i) => sum + orderItemLineTotal(i), 0) * 100) / 100;
}
