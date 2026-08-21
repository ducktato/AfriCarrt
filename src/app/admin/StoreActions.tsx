"use client";

import { useActionState } from "react";
import { approveStore, rejectStore } from "./actions";

export function StoreActions({ storeId }: { storeId: string }) {
  const [approveState, approveAction, approvePending] = useActionState(approveStore, null);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectStore, null);
  const busy = approvePending || rejectPending;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <form action={approveAction}>
          <input type="hidden" name="store_id" value={storeId} />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-parchment transition hover:bg-forest/90 disabled:opacity-60"
          >
            {approvePending ? "Approving..." : "Approve"}
          </button>
        </form>
        <form
          action={rejectAction}
          onSubmit={(e) => {
            if (!confirm("Reject this store? It will be disabled and hidden from customers.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="store_id" value={storeId} />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full border border-hibiscus px-3 py-1.5 text-xs font-semibold text-hibiscus transition hover:bg-hibiscus/10 disabled:opacity-60"
          >
            {rejectPending ? "Rejecting..." : "Reject"}
          </button>
        </form>
      </div>
      {approveState?.error && <span className="text-xs text-red-600">{approveState.error}</span>}
      {rejectState?.error && <span className="text-xs text-red-600">{rejectState.error}</span>}
    </div>
  );
}
