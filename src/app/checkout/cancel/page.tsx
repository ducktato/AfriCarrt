import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Checkout canceled</h1>
      <p className="mt-2 text-ink/60">Your cart is still here whenever you&apos;re ready.</p>
      <Link
        href="/cart"
        className="mt-6 inline-block rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-parchment hover:bg-terracotta/90"
      >
        Back to cart
      </Link>
    </div>
  );
}
