"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  storeListingId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string | null;
}

interface CartState {
  storeId: string | null;
  storeName: string | null;
  items: CartItem[];
}

const EMPTY_CART: CartState = { storeId: null, storeName: null, items: [] };
const STORAGE_KEY = "africarrt_cart";

interface CartContextValue extends CartState {
  addItem: (storeId: string, storeName: string, item: CartItem) => void;
  updateQty: (storeListingId: string, qty: number) => void;
  removeItem: (storeListingId: string) => void;
  clear: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(EMPTY_CART);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage, no SSR-safe alternative
      if (raw) setState(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue["addItem"] = (storeId, storeName, item) => {
      setState((prev) => {
        // Orders are single-store, so adding from a different store replaces the cart.
        const base: CartState = prev.storeId && prev.storeId !== storeId ? { storeId, storeName, items: [] } : { ...prev, storeId, storeName };
        const existing = base.items.find((i) => i.storeListingId === item.storeListingId);
        const items = existing
          ? base.items.map((i) => (i.storeListingId === item.storeListingId ? { ...i, qty: i.qty + item.qty } : i))
          : [...base.items, item];
        return { ...base, items };
      });
    };

    const updateQty: CartContextValue["updateQty"] = (storeListingId, qty) => {
      setState((prev) => ({
        ...prev,
        items:
          qty <= 0
            ? prev.items.filter((i) => i.storeListingId !== storeListingId)
            : prev.items.map((i) => (i.storeListingId === storeListingId ? { ...i, qty } : i)),
      }));
    };

    const removeItem: CartContextValue["removeItem"] = (storeListingId) => {
      setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.storeListingId !== storeListingId) }));
    };

    const clear = () => setState(EMPTY_CART);

    const subtotal = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);

    return { ...state, addItem, updateQty, removeItem, clear, subtotal };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
