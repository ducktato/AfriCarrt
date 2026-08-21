-- Adds columns needed for the seeded catalog and the region browse feature.
-- subcategory/brand: requested by the catalog import (not previously modeled).
-- region: drives the new map/flag country-filtering UI.

alter table public.catalog_items
  add column subcategory text,
  add column brand text,
  add column region text;

create index catalog_items_region_idx on public.catalog_items (region);
