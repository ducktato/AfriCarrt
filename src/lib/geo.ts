// Maps catalog_items.region values to map/flag display data. Built against
// world-atlas's countries-50m.json (properties.name is the join key for the
// map; ISO alpha-2 drives the flag emoji).
export type Landmass = "Africa" | "Caribbean";

export interface CountryMeta {
  region: string; // exact catalog_items.region value
  geoName: string; // matching world-atlas properties.name
  iso2: string;
  landmass: Landmass;
}

// Countries with a specific flag AND a matching shape on the 50m map.
export const COUNTRIES: CountryMeta[] = [
  { region: "Nigeria", geoName: "Nigeria", iso2: "NG", landmass: "Africa" },
  { region: "Ghana", geoName: "Ghana", iso2: "GH", landmass: "Africa" },
  { region: "Ethiopia", geoName: "Ethiopia", iso2: "ET", landmass: "Africa" },
  { region: "Somalia", geoName: "Somalia", iso2: "SO", landmass: "Africa" },
  { region: "Kenya", geoName: "Kenya", iso2: "KE", landmass: "Africa" },
  { region: "Senegal", geoName: "Senegal", iso2: "SN", landmass: "Africa" },
  { region: "South Africa", geoName: "South Africa", iso2: "ZA", landmass: "Africa" },
  { region: "Cameroon", geoName: "Cameroon", iso2: "CM", landmass: "Africa" },
  { region: "DR Congo", geoName: "Dem. Rep. Congo", iso2: "CD", landmass: "Africa" },
  { region: "Congo", geoName: "Congo", iso2: "CG", landmass: "Africa" },
  { region: "Zimbabwe", geoName: "Zimbabwe", iso2: "ZW", landmass: "Africa" },
  { region: "Morocco", geoName: "Morocco", iso2: "MA", landmass: "Africa" },
  { region: "Ivory Coast", geoName: "Côte d'Ivoire", iso2: "CI", landmass: "Africa" },
  { region: "Sudan", geoName: "Sudan", iso2: "SD", landmass: "Africa" },
  { region: "South Sudan", geoName: "S. Sudan", iso2: "SS", landmass: "Africa" },
  { region: "Sierra Leone", geoName: "Sierra Leone", iso2: "SL", landmass: "Africa" },
  { region: "Egypt", geoName: "Egypt", iso2: "EG", landmass: "Africa" },
  { region: "Liberia", geoName: "Liberia", iso2: "LR", landmass: "Africa" },
  { region: "Uganda", geoName: "Uganda", iso2: "UG", landmass: "Africa" },
  { region: "Gambia", geoName: "Gambia", iso2: "GM", landmass: "Africa" },
  { region: "Benin", geoName: "Benin", iso2: "BJ", landmass: "Africa" },
  { region: "Tanzania", geoName: "Tanzania", iso2: "TZ", landmass: "Africa" },
  { region: "Zambia", geoName: "Zambia", iso2: "ZM", landmass: "Africa" },
  { region: "Malawi", geoName: "Malawi", iso2: "MW", landmass: "Africa" },
  { region: "Mozambique", geoName: "Mozambique", iso2: "MZ", landmass: "Africa" },
  { region: "Burkina Faso", geoName: "Burkina Faso", iso2: "BF", landmass: "Africa" },
  { region: "Rwanda", geoName: "Rwanda", iso2: "RW", landmass: "Africa" },
  { region: "Mali", geoName: "Mali", iso2: "ML", landmass: "Africa" },
  { region: "Eritrea", geoName: "Eritrea", iso2: "ER", landmass: "Africa" },
  { region: "Algeria", geoName: "Algeria", iso2: "DZ", landmass: "Africa" },
  { region: "Tunisia", geoName: "Tunisia", iso2: "TN", landmass: "Africa" },
  { region: "Togo", geoName: "Togo", iso2: "TG", landmass: "Africa" },
  { region: "Guinea", geoName: "Guinea", iso2: "GN", landmass: "Africa" },

  { region: "Jamaica", geoName: "Jamaica", iso2: "JM", landmass: "Caribbean" },
  { region: "Trinidad", geoName: "Trinidad and Tobago", iso2: "TT", landmass: "Caribbean" },
  { region: "Haiti", geoName: "Haiti", iso2: "HT", landmass: "Caribbean" },
  { region: "Guyana", geoName: "Guyana", iso2: "GY", landmass: "Caribbean" },
  { region: "Suriname", geoName: "Suriname", iso2: "SR", landmass: "Caribbean" },
  { region: "Barbados", geoName: "Barbados", iso2: "BB", landmass: "Caribbean" },
  { region: "Grenada", geoName: "Grenada", iso2: "GD", landmass: "Caribbean" },
  { region: "Dominican Republic", geoName: "Dominican Rep.", iso2: "DO", landmass: "Caribbean" },
  { region: "St. Lucia", geoName: "Saint Lucia", iso2: "LC", landmass: "Caribbean" },
  { region: "Bahamas", geoName: "Bahamas", iso2: "BS", landmass: "Caribbean" },
  { region: "Belize", geoName: "Belize", iso2: "BZ", landmass: "Caribbean" },
  { region: "Dominica", geoName: "Dominica", iso2: "DM", landmass: "Caribbean" },
];

// Broader/multi-country labels with no single flag or map shape. Shown in the
// flag grid as a landmass-general chip instead.
export interface GenericRegionMeta {
  region: string;
  label: string;
  landmass: Landmass;
}

export const GENERIC_REGIONS: GenericRegionMeta[] = [
  { region: "West Africa", label: "West Africa (general)", landmass: "Africa" },
  { region: "East Africa", label: "East Africa (general)", landmass: "Africa" },
  { region: "North Africa", label: "North Africa (general)", landmass: "Africa" },
  { region: "Central Africa", label: "Central Africa (general)", landmass: "Africa" },
  { region: "Pan-African", label: "Pan-African", landmass: "Africa" },
  { region: "Caribbean", label: "Caribbean (general)", landmass: "Caribbean" },
  { region: "Pan-Caribbean", label: "Pan-Caribbean", landmass: "Caribbean" },
  { region: "Eastern Caribbean", label: "Eastern Caribbean (general)", landmass: "Caribbean" },
  { region: "Pan-tropical", label: "Pan-tropical", landmass: "Caribbean" },
];

export const COUNTRY_BY_REGION = new Map(COUNTRIES.map((c) => [c.region, c]));
export const COUNTRY_BY_GEO_NAME = new Map(COUNTRIES.map((c) => [c.geoName, c]));

export function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
