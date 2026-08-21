-- Powers the "Did you mean...?" check when a store owner types a custom item
-- name that might already exist in the shared catalog.
create function public.find_similar_catalog_items(search text, match_threshold real default 0.3, match_limit int default 5)
returns table (id uuid, name text, category text, subcategory text, brand text, suggested_price numeric, similarity real)
language sql
stable
as $$
  select
    catalog_items.id,
    catalog_items.name,
    catalog_items.category,
    catalog_items.subcategory,
    catalog_items.brand,
    catalog_items.suggested_price,
    similarity(catalog_items.name, search) as similarity
  from public.catalog_items
  where similarity(catalog_items.name, search) > match_threshold
  order by similarity desc
  limit match_limit;
$$;
