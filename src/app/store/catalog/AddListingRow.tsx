"use client";

import { useActionState, useState } from "react";
import { addListingFromCatalog } from "./actions";

interface CatalogItemLite {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  suggested_price: number | null;
  is_perishable: boolean;
  is_returnable: boolean;
}

export function AddListingRow({
  item,
  alreadyListed,
}: {
  item: CatalogItemLite;
  alreadyListed: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, pending] = useActionState(addListingFromCatalog, null);

  const suggested = item.suggested_price ?? 0;
  const [priceValue, setPriceValue] = useState(suggested.toFixed(2));
  const isStillSuggested = priceValue === suggested.toFixed(2);

  const added = state && "success" in state;

  return (
    <div className="rounded-xl border border-sand bg-white p-4 shadow-sm">
      <p className="font-medium text-ink">{item.name}</p>
      <p className="mt-0.5 text-xs text-ink/50">
        {item.brand ? `${item.brand} · ` : ""}
        {item.category}
        {item.subcategory ? ` / ${item.subcategory}` : ""}
      </p>

      {alreadyListed || added ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-forest">
          <span className="h-1.5 w-1.5 rounded-full bg-forest" /> In your store
        </p>
      ) : !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 rounded-full border border-forest px-3 py-1 text-xs font-semibold text-forest transition hover:bg-forest/10"
        >
          Add to my store
        </button>
      ) : (
        <form action={formAction} className="mt-3 space-y-2">
          <input type="hidden" name="catalog_item_id" value={item.id} />
          <input type="hidden" name="is_perishable" value={String(item.is_perishable)} />
          <input type="hidden" name="is_returnable" value={String(item.is_returnable)} />

          <div>
            <label className="block text-xs font-medium text-ink/60">
              Price {isStillSuggested && <span className="text-ink/35">(suggested — edit freely)</span>}
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-ink/35">
                $
              </span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                className={`w-full rounded-lg border border-sand py-1.5 pr-2 pl-6 font-mono text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta ${
                  isStillSuggested ? "text-ink/35" : "text-ink"
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/60">Starting stock</label>
            <input
              name="stock_qty"
              type="number"
              min="0"
              defaultValue={0}
              className="mt-1 w-full rounded-lg border border-sand px-2 py-1.5 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          {state && "error" in state && (
            <p className="text-xs text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-parchment transition hover:bg-forest/90 disabled:opacity-60"
            >
              {pending ? "Adding..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-full border border-sand px-3 py-1.5 text-xs font-medium text-ink/60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
