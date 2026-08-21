-- Atomic stock decrement, called from the Stripe webhook handler (service
-- role) after a paid order is created. Floors at 0 rather than going
-- negative if two webhook deliveries for the same event race.
create function public.decrement_listing_stock(p_listing_id uuid, p_qty integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.store_listings
  set stock_qty = greatest(stock_qty - p_qty, 0)
  where id = p_listing_id;
$$;
