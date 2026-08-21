"use client";

import { useActionState } from "react";
import { flagItemUnavailable } from "./actions";

export function FlagItemButton({ orderItemId }: { orderItemId: string }) {
  const [state, action, pending] = useActionState(flagItemUnavailable, null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Flag this item as unavailable? The customer will be notified immediately.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="order_item_id" value={orderItemId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-hibiscus px-3 py-1 text-xs font-semibold text-hibiscus transition hover:bg-hibiscus/10 disabled:opacity-60"
      >
        {pending ? "Flagging..." : "Flag unavailable"}
      </button>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
