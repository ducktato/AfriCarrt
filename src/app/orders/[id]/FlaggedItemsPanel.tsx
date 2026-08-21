"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveFlaggedItem } from "./actions";
import type { AvailabilityStatus } from "@/lib/supabase/types";

export interface OrderItemRow {
  id: string;
  item_name: string;
  qty: number;
  price_at_purchase: number;
  availability_status: AvailabilityStatus;
  substitute_listing_id: string | null;
  effective_price: number | null;
}

export interface SubstituteOption {
  id: string;
  name: string;
  price: number;
}

function ResolveForm({
  item,
  substitutes,
}: {
  item: OrderItemRow;
  substitutes: SubstituteOption[];
}) {
  const [state, action, pending] = useActionState(resolveFlaggedItem, null);

  return (
    <div className="mt-2 rounded-xl border border-hibiscus/40 bg-hibiscus/5 p-4">
      <p className="text-sm font-semibold text-hibiscus">
        &quot;{item.item_name}&quot; is unavailable
      </p>
      <p className="mt-1 text-xs text-ink/60">
        Pick a substitute, or accept a refund for this item. If you don&apos;t respond in time,
        you&apos;ll automatically get a refund for it and the rest of your order will proceed.
      </p>

      {substitutes.length > 0 && (
        <div className="mt-3 space-y-2">
          {substitutes.map((sub) => (
            <form key={sub.id} action={action}>
              <input type="hidden" name="order_item_id" value={item.id} />
              <input type="hidden" name="choice" value="substitute" />
              <input type="hidden" name="substitute_listing_id" value={sub.id} />
              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-between rounded-lg border border-sand bg-white px-3 py-2 text-left text-sm transition hover:border-terracotta/40 disabled:opacity-60"
              >
                <span className="text-ink">{sub.name}</span>
                <span className="font-mono text-ink/60">${sub.price.toFixed(2)}</span>
              </button>
            </form>
          ))}
        </div>
      )}

      <form action={action} className="mt-3">
        <input type="hidden" name="order_item_id" value={item.id} />
        <input type="hidden" name="choice" value="refund" />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full border border-ink/20 px-3 py-2 text-xs font-semibold text-ink/70 transition hover:bg-ink/5 disabled:opacity-60"
        >
          {pending ? "Processing..." : `Just refund me for this item ($${Number(item.price_at_purchase).toFixed(2)})`}
        </button>
      </form>

      {state?.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}

export function FlaggedItemsPanel({
  orderId,
  initialItems,
  substitutesByStore,
}: {
  orderId: string;
  initialItems: OrderItemRow[];
  substitutesByStore: SubstituteOption[];
}) {
  const [items, setItems] = useState(initialItems);

  // useState's initial value is only used on mount -- when the customer's
  // own action refreshes this route's server components, React does NOT
  // re-run useState(initialItems) on the already-mounted panel, so a fresh
  // `initialItems` prop needs to be synced explicitly or the UI stays on
  // stale data until a manual reload (the resolution is still correct in
  // the DB either way, just not reflected without this).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resyncing from a fresh server-refetched prop, no SSR-safe alternative
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);
      channel = supabase
        .channel(`order-items-${orderId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "order_items", filter: `order_id=eq.${orderId}` },
          (payload) => {
            const updated = payload.new as OrderItemRow;
            setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [orderId]);

  const flaggedItems = items.filter((i) => i.availability_status === "flagged");
  const resolvedItems = items.filter(
    (i) => i.availability_status === "resolved_substitute" || i.availability_status === "resolved_refund",
  );

  if (flaggedItems.length === 0 && resolvedItems.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-sand bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">Item availability</h2>
      {flaggedItems.map((item) => {
        const currentItem = items.find((i) => i.id === item.id) ?? item;
        const otherSubstituteIds = new Set(
          items.filter((i) => i.substitute_listing_id).map((i) => i.substitute_listing_id),
        );
        const options = substitutesByStore.filter((s) => !otherSubstituteIds.has(s.id));
        return <ResolveForm key={item.id} item={currentItem} substitutes={options} />;
      })}
      {resolvedItems.map((item) => (
        <p key={item.id} className="mt-2 text-sm text-ink/60">
          {item.item_name}:{" "}
          {item.availability_status === "resolved_substitute" ? "substituted" : "refunded"}
        </p>
      ))}
    </div>
  );
}
