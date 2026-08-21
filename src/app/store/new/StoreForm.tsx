"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createStore } from "./actions";

const fileInputClass =
  "mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-terracotta/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-terracotta focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta";

export function StoreForm() {
  const [state, formAction, pending] = useActionState(createStore, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink/80">
          Store name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-ink/80">
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          required
          placeholder="123 Eglinton Ave W, Toronto, ON"
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        <p className="mt-1 text-xs text-ink/50">
          We check this against Google&apos;s business listings, so use your real storefront address.
        </p>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-ink/80">
          Phone <span className="text-ink/40">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink/80">
          Description <span className="text-ink/40">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      <div className="border-t border-sand pt-4">
        <h2 className="text-sm font-semibold text-ink">Business verification</h2>
        <p className="mt-1 text-xs text-ink/50">
          Required before an admin can approve your store. Documents are private and only visible to
          you and AfriCarrt admins.
        </p>

        <div className="mt-3">
          <label htmlFor="ontario_corp_number" className="block text-sm font-medium text-ink/80">
            Ontario Corporation Number or Business Identification Number (BIN)
          </label>
          <input
            id="ontario_corp_number"
            name="ontario_corp_number"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>

        <div className="mt-3">
          <label htmlFor="hst_number" className="block text-sm font-medium text-ink/80">
            HST number <span className="text-ink/40">(optional for now)</span>
          </label>
          <input
            id="hst_number"
            name="hst_number"
            type="text"
            className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>

        <div className="mt-3">
          <label htmlFor="business_registration_doc" className="block text-sm font-medium text-ink/80">
            Business registration document
          </label>
          <input
            id="business_registration_doc"
            name="business_registration_doc"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png"
            className={fileInputClass}
          />
        </div>

        <div className="mt-3">
          <label htmlFor="food_handler_cert" className="block text-sm font-medium text-ink/80">
            Food handler certificate
          </label>
          <input
            id="food_handler_cert"
            name="food_handler_cert"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png"
            className={fileInputClass}
          />
        </div>

        <div className="mt-3">
          <label htmlFor="certificate_of_insurance" className="block text-sm font-medium text-ink/80">
            Certificate of insurance
          </label>
          <input
            id="certificate_of_insurance"
            name="certificate_of_insurance"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png"
            className={fileInputClass}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 border-t border-sand pt-4 text-sm text-ink/70">
        <input
          type="checkbox"
          name="accept_vendor_agreement"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-sand text-terracotta focus:ring-terracotta"
        />
        <span>
          I have read and agree to the{" "}
          <Link href="/vendor-agreement" target="_blank" className="font-medium text-terracotta hover:underline">
            AfriCarrt Vendor Agreement
          </Link>
          , including the platform commission on completed orders.
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
        {pending ? "Creating store..." : "Create store"}
      </button>

      <p className="text-xs text-ink/50">
        An admin needs to verify your store before it&apos;s visible to customers, but
        you can start building your catalog now.
      </p>
    </form>
  );
}
