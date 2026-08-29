"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

export function AddToCartButton({
  storeId,
  storeName,
  listingId,
  name,
  price,
  imageUrl,
}: {
  storeId: string;
  storeName: string;
  listingId: string;
  name: string;
  price: number;
  imageUrl: string | null;
}) {
  const { addItem, storeId: cartStoreId } = useCart();
  const [added, setAdded] = useState(false);

  const wouldReplace = cartStoreId !== null && cartStoreId !== storeId;

  function handleAdd() {
    if (wouldReplace) {
      const ok = confirm(
        "Your cart has items from another store. Adding this will clear your current cart. Continue?",
      );
      if (!ok) return;
    }
    addItem(storeId, storeName, { storeListingId: listingId, name, price, qty: 1, imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="shrink-0 rounded-full bg-forest px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-parchment transition hover:bg-forest/90"
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
