"use client";

import { useActionState, useMemo, useState } from "react";
import { bulkUpdateListings } from "./inventory-actions";

export interface ListingRow {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_qty: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export function InventoryTable({ listings }: { listings: ListingRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState(bulkUpdateListings, null);

  const lowStock = useMemo(
    () => listings.filter((l) => l.stock_qty <= l.low_stock_threshold),
    [listings],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === listings.length ? new Set() : new Set(listings.map((l) => l.id))));
  }

  if (listings.length === 0) {
    return <p className="text-ink/50">No listings yet.</p>;
  }

  return (
    <div>
      {lowStock.length > 0 && (
        <div className="mb-5 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-xs text-ink">
              !
            </span>
            {lowStock.length} listing{lowStock.length === 1 ? "" : "s"} at or below its low-stock threshold
          </p>
          <ul className="mt-2 space-y-0.5 pl-7 text-sm text-ink/70">
            {lowStock.map((l) => (
              <li key={l.id}>
                {l.name} — {l.stock_qty} left (threshold {l.low_stock_threshold})
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={formAction}>
        {[...selected].map((id) => (
          <input key={id} type="hidden" name="listing_id" value={id} />
        ))}

        <div className="overflow-x-auto rounded-2xl border border-sand bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-sand text-left text-xs font-semibold tracking-wide text-ink/50 uppercase">
              <tr>
                <th className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === listings.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="h-4 w-4 rounded border-sand accent-terracotta"
                  />
                </th>
                <th className="px-3 py-3">Item</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Low-stock at</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l, i) => {
                const isLow = l.stock_qty <= l.low_stock_threshold;
                return (
                  <tr
                    key={l.id}
                    className={`${i > 0 ? "border-t border-sand/70" : ""} ${isLow ? "bg-gold/10" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(l.id)}
                        onChange={() => toggle(l.id)}
                        aria-label={`Select ${l.name}`}
                        className="h-4 w-4 rounded border-sand accent-terracotta"
                      />
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="font-medium text-ink">{l.name}</p>
                      <p className="text-xs text-ink/50">{l.category}</p>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-ink/80">${l.price.toFixed(2)}</td>
                    <td className={`px-3 py-3.5 font-mono font-medium ${isLow ? "text-gold" : "text-ink/80"}`}>
                      {l.stock_qty}
                    </td>
                    <td className="px-3 py-3.5 font-mono text-ink/50">{l.low_stock_threshold}</td>
                    <td className="px-3 py-3.5">
                      {l.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-forest">
                          <span className="h-1.5 w-1.5 rounded-full bg-forest" /> Active
                        </span>
                      ) : (
                        <span className="text-ink/35">Disabled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selected.size > 0 && (
          <div className="sticky bottom-4 mt-5 rounded-2xl border border-sand bg-white p-5 shadow-lg">
            <p className="font-medium text-ink">
              Bulk edit {selected.size} listing{selected.size === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-xs text-ink/50">
              Leave a field blank to leave it unchanged for the selected listings.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink/60">New price</label>
                <input
                  name="new_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 4.99"
                  className="mt-1 w-full rounded-lg border border-sand px-2 py-1.5 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/60">New stock</label>
                <input
                  name="new_stock"
                  type="number"
                  min="0"
                  placeholder="e.g. 20"
                  className="mt-1 w-full rounded-lg border border-sand px-2 py-1.5 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/60">Low-stock threshold</label>
                <input
                  name="new_threshold"
                  type="number"
                  min="0"
                  placeholder="e.g. 5"
                  className="mt-1 w-full rounded-lg border border-sand px-2 py-1.5 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
              </div>
            </div>

            {state && "error" in state && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {state.error}
              </p>
            )}
            {state && "success" in state && (
              <p className="mt-2 text-sm text-forest">Updated {state.count} listing(s).</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-parchment transition hover:bg-forest/90 disabled:opacity-60"
              >
                {pending ? "Applying..." : `Apply to ${selected.size} selected`}
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-full border border-sand px-4 py-2 text-sm font-medium text-ink/70 hover:border-ink/25"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
