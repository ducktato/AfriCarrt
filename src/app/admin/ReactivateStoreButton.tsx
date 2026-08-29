"use client";

import { useActionState } from "react";
import { reactivateStore } from "./actions";

export function ReactivateStoreButton({ storeId }: { storeId: string }) {
  const [state, action, pending] = useActionState(reactivateStore, null);

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={action}
        onSubmit={(e) => {
          if (
            !confirm(
              "Reactivate this store? This clears its strike count and suspension standing, and makes it active again.",
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="store_id" value={storeId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-parchment transition hover:bg-forest/90 disabled:opacity-60"
        >
          {pending ? "Reactivating..." : "Reactivate (clear strikes)"}
        </button>
      </form>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </div>
  );
}
