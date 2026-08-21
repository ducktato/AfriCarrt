import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/roles";
import { FlagItemButton } from "./FlagItemButton";
import { MarkReadyButton, CancelOrderButton } from "./OrderActions";

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  flagged: "Flagged — awaiting customer",
  resolved_substitute: "Substituted",
  resolved_refund: "Refunded",
};

export default async function StoreOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role && profile.role !== "store_owner") redirect(roleHome(profile.role));

  const { data: stores } = await supabase.from("stores").select("id").eq("owner_id", user.id);
  const storeIds = (stores ?? []).map((s) => s.id);

  const { data: orders } = storeIds.length
    ? await supabase
        .from("orders")
        .select("id, total, fulfillment_type, dispatch_at, captured_at, created_at, ready_at")
        .in("store_id", storeIds)
        .is("captured_at", null)
        .not("dispatch_at", "is", null)
        .order("dispatch_at", { ascending: true })
    : { data: [] };

  const pendingOrders = orders ?? [];
  const orderIds = pendingOrders.map((o) => o.id);
  const { data: itemsByOrder } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("id, order_id, item_name, qty, price_at_purchase, availability_status")
        .in("order_id", orderIds)
    : { data: [] };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Pending orders</h1>
      <p className="mt-1 text-sm text-ink/60">
        Orders in the 10-minute stock-check window. Flag anything you can&apos;t fulfill before
        dispatch — the customer is notified immediately and picks a substitute or a refund.
      </p>

      {pendingOrders.length === 0 ? (
        <p className="mt-6 text-ink/50">No orders currently in the stock-check window.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {pendingOrders.map((order) => {
            const items = (itemsByOrder ?? []).filter((i) => i.order_id === order.id);
            const dispatchAt = order.dispatch_at ? new Date(order.dispatch_at) : null;
            return (
              <li key={order.id} className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">
                    Order <Link href={`/orders/${order.id}`} className="text-terracotta hover:underline">
                      #{order.id.slice(0, 8)}
                    </Link>{" "}
                    <span className="capitalize text-ink/50">— {order.fulfillment_type}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {dispatchAt && (
                      <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                        Dispatches {dispatchAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    {order.ready_at ? (
                      <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs font-semibold text-forest">
                        Ready
                      </span>
                    ) : (
                      <MarkReadyButton orderId={order.id} />
                    )}
                    <CancelOrderButton orderId={order.id} />
                  </div>
                </div>
                <ul className="mt-3 space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sand px-3 py-2 text-sm"
                    >
                      <span>
                        {item.qty} × {item.item_name}{" "}
                        <span className="font-mono text-ink/50">
                          ${Number(item.price_at_purchase).toFixed(2)}
                        </span>
                      </span>
                      {item.availability_status === "available" ? (
                        <FlagItemButton orderItemId={item.id} />
                      ) : (
                        <span className="text-xs font-medium text-ink/50">
                          {STATUS_LABEL[item.availability_status] ?? item.availability_status}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
