"use client";

import { useActionState } from "react";
import { recalculateCommissionRates } from "./actions";

export function RecalculateCommissionButton() {
  const [state, action, pending] = useActionState(async () => recalculateCommissionRates(), null);

  return (
    <form action={action} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-terracotta px-3 py-1.5 text-xs font-semibold text-terracotta transition hover:bg-terracotta/10 disabled:opacity-60"
      >
        {pending ? "Recalculating..." : "Recalculate commission rates now"}
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
