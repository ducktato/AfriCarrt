"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CatalogMap } from "./CatalogMap";
import { FlagGrid } from "./FlagGrid";

export function RegionBrowse({ regionCounts }: { regionCounts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const selectedRegion = searchParams.get("region");

  const handleSelect = useCallback(
    (region: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (region) params.set("region", region);
      else params.delete("region");
      startTransition(() => {
        router.push(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  const availableRegions = new Set(Object.keys(regionCounts));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CatalogMap
        availableRegions={availableRegions}
        selectedRegion={selectedRegion}
        onSelectRegion={handleSelect}
      />
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-ink/60">
            {selectedRegion ? `Showing: ${selectedRegion}` : "Showing everything"}
          </span>
          {selectedRegion && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="text-sm font-medium text-terracotta hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        <FlagGrid
          regionCounts={regionCounts}
          selectedRegion={selectedRegion}
          onSelectRegion={handleSelect}
        />
      </div>
    </div>
  );
}
