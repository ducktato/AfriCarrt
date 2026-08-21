"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FulfillmentType, OrderStatus } from "@/lib/supabase/types";

const DELIVERY_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "placed", label: "Placed" },
  { key: "packing", label: "Packing" },
  { key: "courier_assigned", label: "Courier assigned" },
  { key: "picked_up", label: "Picked up" },
  { key: "delivered", label: "Delivered" },
];

const PICKUP_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "placed", label: "Placed" },
  { key: "packing", label: "Packing" },
  { key: "completed", label: "Ready / completed" },
];

export function OrderTracker({
  orderId,
  initialStatus,
  fulfillmentType,
  trackingUrl,
}: {
  orderId: string;
  initialStatus: OrderStatus;
  fulfillmentType: FulfillmentType;
  trackingUrl?: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // Realtime authorizes postgres_changes per-connection using the subscriber's
    // JWT -- if we subscribe before the session has hydrated from cookies, the
    // channel joins anonymously and the RLS-filtered row is silently dropped.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);
      channel = supabase
        .channel(`order-${orderId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
          (payload) => {
            const next = (payload.new as { status?: OrderStatus }).status;
            if (next) setStatus(next);
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [orderId]);

  const steps = fulfillmentType === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const isCancelled = status === "cancelled";
  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div>
      {isCancelled ? (
        <div className="rounded-2xl border border-hibiscus/40 bg-hibiscus/10 px-5 py-4 text-center">
          <p className="font-semibold text-hibiscus">This order was cancelled.</p>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          {steps.map((step, i) => {
            const reached = currentIndex >= 0 && i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div key={step.key} className="flex flex-1 flex-col items-center text-center">
                <div className="flex w-full items-center">
                  <div className={`h-0.5 flex-1 ${i === 0 ? "invisible" : reached ? "bg-forest" : "bg-sand"}`} />
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isCurrent
                        ? "bg-terracotta text-parchment"
                        : reached
                          ? "bg-forest text-parchment"
                          : "bg-sand text-ink/40"
                    }`}
                  >
                    {reached && !isCurrent ? "✓" : i + 1}
                  </div>
                  <div
                    className={`h-0.5 flex-1 ${i === steps.length - 1 ? "invisible" : currentIndex > i ? "bg-forest" : "bg-sand"}`}
                  />
                </div>
                <p className={`mt-2 text-xs font-medium ${isCurrent ? "text-ink" : "text-ink/50"}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {trackingUrl && !isCancelled && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 block text-center text-sm font-medium text-terracotta hover:underline"
        >
          Live courier tracking (Uber) →
        </a>
      )}
    </div>
  );
}
