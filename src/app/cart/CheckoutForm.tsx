"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";

function PayButton({ displayTotal }: { displayTotal: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPending(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed. Please try again.");
      setPending(false);
      return;
    }
    if (paymentIntent) {
      router.push(`/checkout/success?payment_intent=${paymentIntent.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <PaymentElement />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || pending}
        className="w-full rounded-full bg-terracotta px-4 py-3 text-sm font-semibold text-parchment transition hover:bg-terracotta/90 disabled:opacity-60"
      >
        {pending ? "Processing..." : `Pay $${displayTotal.toFixed(2)}`}
      </button>
    </form>
  );
}

export function CheckoutForm({
  clientSecret,
  displayTotal,
}: {
  clientSecret: string;
  displayTotal: number;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          variables: {
            colorPrimary: "#c6551f",
            colorText: "#2e2013",
            fontFamily: "var(--font-inter), sans-serif",
            borderRadius: "8px",
          },
        },
      }}
    >
      <PayButton displayTotal={displayTotal} />
    </Elements>
  );
}
