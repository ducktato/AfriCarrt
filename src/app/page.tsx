import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <span className="inline-flex items-center gap-2 rounded-full bg-terracotta/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-terracotta uppercase">
        <span className="flex gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-forest" />
          <span className="h-1.5 w-1.5 rounded-full bg-hibiscus" />
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        </span>
        Toronto&apos;s African &amp; Caribbean marketplace
      </span>

      <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        African &amp; Caribbean groceries, delivered across Toronto
      </h1>
      <p className="mt-4 max-w-xl text-ink/70">
        Order from trusted local grocers for pickup or delivery — or list your
        store and reach more customers.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-parchment shadow-sm transition hover:bg-terracotta/90"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-ink/15 bg-white/50 px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/30 hover:bg-white"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
