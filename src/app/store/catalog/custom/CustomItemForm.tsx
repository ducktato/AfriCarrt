"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { checkSimilarItems, createCustomListing, type SimilarItem } from "./actions";

export function CustomItemForm() {
  const [state, formAction, pending] = useActionState(createCustomListing, null);
  const [name, setName] = useState("");
  const [matches, setMatches] = useState<SimilarItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDismissed(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await checkSimilarItems(name);
      setMatches(results);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name]);

  const showSuggestions = matches.length > 0 && !dismissed;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink/80">
          Item name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />

        {showSuggestions && (
          <div className="mt-2 rounded-xl border border-gold/40 bg-gold/10 p-3">
            <p className="text-sm font-medium text-ink">Did you mean one of these?</p>
            <ul className="mt-2 space-y-1.5">
              {matches.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink/70">
                    {m.name}
                    {m.suggested_price ? ` · $${Number(m.suggested_price).toFixed(2)}` : ""}
                  </span>
                  <Link
                    href={`/store/catalog?q=${encodeURIComponent(m.name)}`}
                    className="font-medium text-terracotta hover:underline"
                  >
                    Use this instead
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="mt-2 text-xs font-medium text-ink/60 hover:underline"
            >
              None of these — it&apos;s a different item
            </button>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-ink/80">
          Category
        </label>
        <input
          id="category"
          name="category"
          type="text"
          required
          placeholder="e.g. Snacks, Frozen, Beverages"
          className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-ink/80">
            Price
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>
        <div>
          <label htmlFor="stock_qty" className="block text-sm font-medium text-ink/80">
            Starting stock
          </label>
          <input
            id="stock_qty"
            name="stock_qty"
            type="number"
            min="0"
            defaultValue={0}
            className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" name="is_perishable" className="rounded border-sand accent-terracotta" />
          Perishable
        </label>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            name="is_returnable"
            defaultChecked
            className="rounded border-sand accent-terracotta"
          />
          Returnable
        </label>
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-ink/80">
          Photo <span className="text-ink/40">(optional)</span>
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          className="mt-1 w-full text-sm text-ink/60 file:mr-3 file:rounded-full file:border-0 file:bg-terracotta/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-terracotta"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-forest px-4 py-2 text-sm font-semibold text-parchment transition hover:bg-forest/90 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add custom item"}
      </button>
    </form>
  );
}
