"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import worldData from "world-atlas/countries-50m.json";
import { COUNTRY_BY_GEO_NAME } from "@/lib/geo";

// Centered/scaled to frame Africa and the Caribbean in one continuous view
// (roughly -85..55 longitude, -35..38 latitude) rather than the whole globe.
const PROJECTION_CONFIG = { center: [-14, 4] as [number, number], scale: 360 };

export function CatalogMap({
  availableRegions,
  selectedRegion,
  onSelectRegion,
}: {
  availableRegions: Set<string>;
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-sand bg-white">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={PROJECTION_CONFIG}
        width={800}
        height={480}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup center={[-14, 4]} minZoom={1} maxZoom={6}>
          <Geographies geography={worldData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const country = COUNTRY_BY_GEO_NAME.get(geo.properties.name as string);
                const region = country?.region;
                const hasItems = region ? availableRegions.has(region) : false;
                const isSelected = region !== undefined && region === selectedRegion;
                const isHovered = region !== undefined && region === hovered;

                let fill = "#e8dcc8"; // sand — no listings here
                if (hasItems) fill = isSelected ? "#c6551f" : isHovered ? "#d9a028" : "rgba(217,160,40,0.35)";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (!region || !hasItems) return;
                      onSelectRegion(isSelected ? null : region);
                    }}
                    onMouseEnter={() => region && hasItems && setHovered(region)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      default: { fill, stroke: "#faf3e7", strokeWidth: 0.5, outline: "none" },
                      hover: { fill, stroke: "#faf3e7", strokeWidth: 0.5, outline: "none" },
                      pressed: { fill, stroke: "#faf3e7", strokeWidth: 0.5, outline: "none" },
                    }}
                    className={hasItems ? "cursor-pointer" : "cursor-default"}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      <p className="border-t border-sand bg-white px-3 py-2 text-center text-xs text-ink/60">
        {hovered ?? selectedRegion ?? "Tap a highlighted country, or use the flags below"}
      </p>
    </div>
  );
}
