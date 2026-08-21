"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signup } from "./actions";
import type { UserRole } from "@/lib/supabase/types";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, null);
  const [role, setRole] = useState<UserRole>("customer");

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <span className="block text-sm font-medium text-ink/80">
          I&apos;m signing up as a
        </span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              { value: "customer", label: "Customer" },
              { value: "store_owner", label: "Store owner" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition ${
                role === option.value
                  ? "border-terracotta bg-terracotta/10 text-terracotta"
                  : "border-sand text-ink/60 hover:border-ink/25"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-ink/80">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          autoComplete="name"
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

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
        <label htmlFor="phone" className="block text-sm font-medium text-ink/80">
          Phone <span className="text-ink/40">(optional for now)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1 416 555 0100"
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
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        <p className="mt-1 text-xs text-ink/50">At least 8 characters.</p>
      </div>

      <label className="flex items-start gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          name="accept_terms"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-sand text-terracotta focus:ring-terracotta"
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="font-medium text-terracotta hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-terracotta hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

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
        {pending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-terracotta hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
