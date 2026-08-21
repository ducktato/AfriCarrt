import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDelivery } from "@/lib/uber-direct";
import { OrderTracker } from "./OrderTracker";
import { FlaggedItemsPanel, type OrderItemRow } from "./FlaggedItemsPanel";
import type { OrderStatus } from "@/lib/supabase/types";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, fulfillment_type, delivery_tier, subtotal, delivery_fee, total, uber_delivery_id, created_at, store_id, stores(name, address)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "id, item_name, qty, price_at_purchase, availability_status, substitute_listing_id, effective_price, store_listing_id",
    )
    .eq("order_id", order.id);

  const flaggedListingIds = (items ?? []).filter((i) => i.availability_status !== "available").map((i) => i.store_listing_id);
  const { data: substituteListings } = await supabase
    .from("store_listings")
    .select("id, price, stock_qty, is_active, custom_name, catalog_items(name)")
    .eq("store_id", order.store_id)
    .eq("is_active", true)
    .gt("stock_qty", 0);

  const substitutesByStore = (substituteListings ?? [])
    .filter((l) => !flaggedListingIds.includes(l.id))
    .map((l) => ({
      id: l.id,
      name: l.custom_name ?? l.catalog_items?.name ?? "Item",
      price: Number(l.price),
    }));

  let trackingUrl: string | null = null;
  if (order.uber_delivery_id) {
    try {
      const delivery = await getDelivery(order.uber_delivery_id);
      trackingUrl = delivery.tracking_url ?? null;
    } catch {
      // best-effort -- tracker still works without the Uber deep link
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Order tracking</h1>
      <p className="mt-1 text-ink/60">
        {order.stores?.name} · {order.fulfillment_type === "delivery" ? "Delivery" : "Pickup"}
        {order.delivery_tier ? ` (${order.delivery_tier})` : ""}
      </p>

      <div className="mt-6 rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <OrderTracker
          orderId={order.id}
          initialStatus={order.status as OrderStatus}
          fulfillmentType={order.fulfillment_type as "pickup" | "delivery"}
          trackingUrl={trackingUrl}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink">Items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between text-ink/80">
              <span>
                {item.qty} × {item.item_name}
              </span>
              <span className="font-mono">${(Number(item.price_at_purchase) * item.qty).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-sand pt-3 text-sm">
          <div className="flex justify-between text-ink/70">
            <span>Subtotal</span>
            <span className="font-mono">${Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-ink/70">
            <span>Delivery</span>
            <span className="font-mono">${Number(order.delivery_fee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-ink">
            <span>Total</span>
            <span className="font-mono">${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <FlaggedItemsPanel
        orderId={order.id}
        initialItems={(items ?? []).map((i) => ({
          id: i.id,
          item_name: i.item_name,
          qty: i.qty,
          price_at_purchase: Number(i.price_at_purchase),
          availability_status: i.availability_status as OrderItemRow["availability_status"],
          substitute_listing_id: i.substitute_listing_id,
          effective_price: i.effective_price === null ? null : Number(i.effective_price),
        }))}
        substitutesByStore={substitutesByStore}
      />
    </div>
  );
}
