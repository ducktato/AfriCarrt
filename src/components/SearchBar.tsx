export function SearchBar() {
  return (
    <form
      action="/search"
      method="GET"
      className="border-b border-sand bg-parchment px-4 py-2.5 sm:px-6"
    >
      <div className="relative mx-auto max-w-6xl">
        <button
          type="submit"
          aria-label="Search"
          className="absolute top-1/2 left-1 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink/50 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
        </button>
        <input
          type="search"
          name="q"
          placeholder="Search products or stores…"
          className="w-full rounded-full border border-sand bg-white py-2 pr-4 pl-9 text-sm text-ink placeholder:text-ink/40 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>
    </form>
  );
}
