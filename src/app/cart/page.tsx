"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { createPaymentIntent } from "@/app/checkout/actions";
import { computeDeliveryFee } from "@/lib/delivery";
import { CheckoutForm } from "./CheckoutForm";
import type { DeliveryTier, FulfillmentType } from "@/lib/supabase/types";

const REGULAR_FEE = computeDeliveryFee("delivery", "regular");
const PRIORITY_FEE = computeDeliveryFee("delivery", "priority");

export default function CartPage() {
  const { storeId, storeName, items, updateQty, removeItem, subtotal, clear } = useCart();
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("pickup");
  const [tier, setTier] = useState<DeliveryTier>("regular");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<{ clientSecret: string; displayTotal: number } | null>(null);

  const deliveryFee = computeDeliveryFee(fulfillment, fulfillment === "delivery" ? tier : null);
  const total = subtotal + deliveryFee;

  async function handleContinueToPayment() {
    if (!storeId) return;
    if (fulfillment === "delivery" && !deliveryAddress.trim()) {
      setError("Enter a delivery address.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await createPaymentIntent({
      storeId,
      items: items.map((i) => ({ storeListingId: i.storeListingId, qty: i.qty })),
      fulfillmentType: fulfillment,
      deliveryTier: fulfillment === "delivery" ? tier : null,
      deliveryAddress: fulfillment === "delivery" ? deliveryAddress.trim() : null,
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setPayment(result);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Your cart is empty</h1>
        <Link
          href="/stores"
          className="mt-4 inline-block rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-parchment hover:bg-terracotta/90"
        >
          Browse stores
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Your cart</h1>
      <p className="mt-1 text-ink/60">From {storeName}.</p>

      <div className="mt-6 space-y-2">
        {items.map((item) => (
          <div
            key={item.storeListingId}
            className="flex items-center justify-between rounded-xl border border-sand bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-medium text-ink">{item.name}</p>
              <p className="font-mono text-sm text-ink/60">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-sand">
                <button
                  type="button"
                  onClick={() => updateQty(item.storeListingId, item.qty - 1)}
                  disabled={!!payment}
                  className="px-2.5 py-1 text-ink/60 disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-6 text-center font-mono text-sm">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => updateQty(item.storeListingId, item.qty + 1)}
                  disabled={!!payment}
                  className="px-2.5 py-1 text-ink/60 disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.storeListingId)}
                disabled={!!payment}
                className="text-xs font-medium text-hibiscus hover:underline disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-sand bg-white p-5 shadow-sm">
        <fieldset disabled={!!payment} className="contents">
          <p className="mb-2 text-sm font-semibold text-ink">Fulfillment</p>
          <div className="grid grid-cols-2 gap-2">
            {(["pickup", "delivery"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFulfillment(opt)}
                className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition disabled:opacity-40 ${
                  fulfillment === opt
                    ? "border-terracotta bg-terracotta/10 text-terracotta"
                    : "border-sand text-ink/60 hover:border-ink/25"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {fulfillment === "delivery" && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-ink">Delivery speed</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTier("regular")}
                  className={`rounded-full border px-4 py-2 text-left text-sm transition disabled:opacity-40 ${
                    tier === "regular"
                      ? "border-terracotta bg-terracotta/10"
                      : "border-sand hover:border-ink/25"
                  }`}
                >
                  <span className="font-medium text-ink">Regular</span>
                  <span className="ml-1 font-mono text-ink/60">${REGULAR_FEE.toFixed(2)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTier("priority")}
                  className={`rounded-full border px-4 py-2 text-left text-sm transition disabled:opacity-40 ${
                    tier === "priority"
                      ? "border-gold bg-gold/10"
                      : "border-sand hover:border-ink/25"
                  }`}
                >
                  <span className="font-medium text-ink">Priority</span>
                  <span className="ml-1 font-mono text-ink/60">${PRIORITY_FEE.toFixed(2)}</span>
                </button>
              </div>

              <label htmlFor="delivery_address" className="mt-4 block text-sm font-semibold text-ink">
                Delivery address
              </label>
              <input
                id="delivery_address"
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="123 Queen St W, Toronto, ON"
                className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta disabled:opacity-40"
              />
            </div>
          )}
        </fieldset>

        <div className="mt-5 space-y-1 border-t border-sand pt-4 text-sm">
          <div className="flex justify-between text-ink/70">
            <span>Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-ink/70">
            <span>Delivery</span>
            <span className="font-mono">{deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : "Free"}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold text-ink">
            <span>Total</span>
            <span className="font-mono">${total.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <p className="mt-4 text-xs text-ink/40">
          Product images are for illustration only — actual packaging, brand, and appearance may vary.
        </p>

        {payment ? (
          <CheckoutForm clientSecret={payment.clientSecret} displayTotal={payment.displayTotal} />
        ) : (
          <>
            <button
              type="button"
              onClick={handleContinueToPayment}
              disabled={pending}
              className="mt-4 w-full rounded-full bg-terracotta px-4 py-3 text-sm font-semibold text-parchment transition hover:bg-terracotta/90 disabled:opacity-60"
            >
              {pending ? "Preparing payment..." : `Continue to payment — $${total.toFixed(2)}`}
            </button>
            <button
              type="button"
              onClick={clear}
              className="mt-2 w-full text-center text-xs font-medium text-ink/50 hover:underline"
            >
              Clear cart
            </button>
          </>
        )}
      </div>
    </div>
  );
}
