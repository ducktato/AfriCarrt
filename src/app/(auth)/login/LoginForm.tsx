"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink/80">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink/80">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-parchment transition hover:bg-terracotta/90 disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-ink/60">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-terracotta hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
