"use client";

import { COUNTRIES, GENERIC_REGIONS, flagEmoji, type Landmass } from "@/lib/geo";

const LANDMASS_ICON: Record<Landmass, string> = { Africa: "🌍", Caribbean: "🌴" };

// Region chips deliberately rotate through the accent palette rather than
// all sharing one color, so the flag grid reads as lively/market-like.
const ACCENTS = [
  { selectedBg: "bg-forest", selectedText: "text-parchment", dot: "bg-forest" },
  { selectedBg: "bg-hibiscus", selectedText: "text-parchment", dot: "bg-hibiscus" },
  { selectedBg: "bg-gold", selectedText: "text-ink", dot: "bg-gold" },
  { selectedBg: "bg-ink", selectedText: "text-parchment", dot: "bg-ink" },
];

function entriesFor(landmass: Landmass, counts: Record<string, number>) {
  const countryEntries = COUNTRIES.filter((c) => c.landmass === landmass && counts[c.region] > 0).map((c) => ({
    region: c.region,
    label: c.region,
    icon: flagEmoji(c.iso2),
    count: counts[c.region],
  }));
  const genericEntries = GENERIC_REGIONS.filter((g) => g.landmass === landmass && counts[g.region] > 0).map((g) => ({
    region: g.region,
    label: g.label,
    icon: LANDMASS_ICON[landmass],
    count: counts[g.region],
  }));
  return [...countryEntries, ...genericEntries].sort((a, b) => b.count - a.count);
}

export function FlagGrid({
  regionCounts,
  selectedRegion,
  onSelectRegion,
}: {
  regionCounts: Record<string, number>;
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
}) {
  return (
    <div className="space-y-5">
      {(["Africa", "Caribbean"] as const).map((landmass) => {
        const entries = entriesFor(landmass, regionCounts);
        if (entries.length === 0) return null;
        return (
          <div key={landmass}>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink/80">
              <span>{LANDMASS_ICON[landmass]}</span> {landmass}
            </h3>
            <div className="flex flex-wrap gap-2">
              {entries.map((e, i) => {
                const isSelected = e.region === selectedRegion;
                const accent = ACCENTS[i % ACCENTS.length];
                return (
                  <button
                    key={e.region}
                    type="button"
                    onClick={() => onSelectRegion(isSelected ? null : e.region)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? `border-transparent ${accent.selectedBg} ${accent.selectedText}`
                        : "border-sand bg-white text-ink/80 hover:border-ink/25"
                    }`}
                  >
                    {!isSelected && <span className={`h-2 w-2 rounded-full ${accent.dot}`} />}
                    <span className="text-base leading-none">{e.icon}</span>
                    {e.label}
                    <span className={isSelected ? "opacity-80" : "text-ink/40"}>{e.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
