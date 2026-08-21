"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartLink() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Link href="/cart" className="relative font-medium text-parchment/80 transition hover:text-parchment">
      Cart
      {count > 0 && (
        <span className="absolute -top-2 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-hibiscus px-1 text-[10px] font-semibold text-parchment">
          {count}
        </span>
      )}
    </Link>
  );
}
