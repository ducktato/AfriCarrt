import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ClearCartOnMount } from "./ClearCartOnMount";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  const { payment_intent } = await searchParams;
  let orderId: string | null = null;

  if (payment_intent) {
    const supabase = await createClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_payment_intent_id", payment_intent)
      .maybeSingle();
    orderId = order?.id ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 text-center sm:px-6">
      <ClearCartOnMount />
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest/15 text-2xl text-forest">
        ✓
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink">Payment received</h1>
      {orderId ? (
        <>
          <p className="mt-2 text-ink/60">Your order is confirmed. The store is preparing it now.</p>
          <Link
            href={`/orders/${orderId}`}
            className="mt-6 inline-block rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-parchment hover:bg-terracotta/90"
          >
            Track your order
          </Link>
        </>
      ) : (
        <p className="mt-2 text-ink/60">
          We&apos;re finalizing your order now — refresh in a moment, or check{" "}
          <Link href="/orders" className="text-terracotta hover:underline">
            your orders
          </Link>
          .
        </p>
      )}
    </div>
  );
}
