"use client";

import { useActionState } from "react";
import { startStripeOnboarding } from "./actions";

export function StartOnboardingButton({ storeId }: { storeId: string }) {
  const [state, formAction, pending] = useActionState(startStripeOnboarding, null);

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="store_id" value={storeId} />
      {state?.error && (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-parchment transition hover:bg-terracotta/90 disabled:opacity-60"
      >
        {pending ? "Redirecting to Stripe..." : "Connect with Stripe"}
      </button>
    </form>
  );
}
