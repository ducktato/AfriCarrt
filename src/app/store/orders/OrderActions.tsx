"use client";

import { useActionState } from "react";
import { markOrderReady, cancelOrder } from "./actions";

export function MarkReadyButton({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(markOrderReady, null);
  return (
    <form action={action}>
      <input type="hidden" name="order_id" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-parchment transition hover:bg-forest/90 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Mark ready"}
      </button>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(cancelOrder, null);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "Cancel this whole order? The customer is refunded in full and this counts as a cancellation on your store's performance record.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="order_id" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:bg-ink/5 disabled:opacity-60"
      >
        {pending ? "Cancelling..." : "Cancel order"}
      </button>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
