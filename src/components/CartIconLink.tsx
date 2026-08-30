"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartIconLink() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-parchment"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3.6-8H5.4M7 13L5.4 5M7 13l-1.7 4.6A1 1 0 0 0 6.24 19H17" />
        <circle cx="8" cy="21" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17" cy="21" r="1.5" fill="currentColor" stroke="none" />
      </svg>
      {count > 0 && (
        <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-hibiscus px-1 text-[10px] font-semibold text-parchment">
          {count}
        </span>
      )}
    </Link>
  );
}
