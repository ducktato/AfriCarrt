import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, fulfillment_type, total, created_at, stores(name)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Your orders</h1>

      {!orders || orders.length === 0 ? (
        <p className="mt-4 text-ink/50">No orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-sand bg-white px-4 py-3 shadow-sm transition hover:border-terracotta/40"
              >
                <div>
                  <p className="font-medium text-ink">{order.stores?.name}</p>
                  <p className="text-xs text-ink/50 capitalize">
                    {order.fulfillment_type} · {order.status.replace("_", " ")}
                  </p>
                </div>
                <span className="font-mono font-medium text-terracotta">${Number(order.total).toFixed(2)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
