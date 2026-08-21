"use client";

import { useActionState } from "react";
import { setStoreActive } from "./actions";

export function LiveStoreActions({ storeId, isActive }: { storeId: string; isActive: boolean }) {
  const [state, action, pending] = useActionState(setStoreActive, null);

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={action}
        onSubmit={(e) => {
          const msg = isActive
            ? "Disable this store? It will disappear from customer browsing and block checkout immediately."
            : "Re-enable this store? It will become visible to customers again.";
          if (!confirm(msg)) e.preventDefault();
        }}
      >
        <input type="hidden" name="store_id" value={storeId} />
        <input type="hidden" name="is_active" value={(!isActive).toString()} />
        <button
          type="submit"
          disabled={pending}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
            isActive
              ? "border border-hibiscus text-hibiscus hover:bg-hibiscus/10"
              : "bg-forest text-parchment hover:bg-forest/90"
          }`}
        >
          {pending ? "Saving..." : isActive ? "Disable store" : "Re-enable store"}
        </button>
      </form>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </div>
  );
}
