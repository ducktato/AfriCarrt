-- Reconstructed from live pg_policies / pg_proc on glbzvocaonvtcgrdmhsx (see
-- note in 20260817194833_initial_schema.sql). Policy bodies below are the
-- exact `qual` / `with_check` expressions read back from pg_policies.

create function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

alter table public.users enable row level security;
alter table public.stores enable row level security;
alter table public.catalog_items enable row level security;
alter table public.store_listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.payouts enable row level security;

-- users
create policy users_select_own on public.users
  for select using (id = auth.uid() or is_admin());
create policy users_insert_own on public.users
  for insert with check (id = auth.uid());
create policy users_update_own on public.users
  for update using (id = auth.uid());

-- stores
create policy stores_select_all on public.stores
  for select using (true);
create policy stores_insert_owner on public.stores
  for insert with check (owner_id = auth.uid());
create policy stores_update_owner_or_admin on public.stores
  for update using (owner_id = auth.uid() or is_admin());

-- catalog_items
create policy catalog_select_all on public.catalog_items
  for select using (true);
create policy catalog_write_admin on public.catalog_items
  for insert with check (is_admin());
create policy catalog_update_admin on public.catalog_items
  for update using (is_admin());

-- store_listings
create policy listings_select_all on public.store_listings
  for select using (true);
create policy listings_insert_owner on public.store_listings
  for insert with check (
    exists (select 1 from public.stores where stores.id = store_listings.store_id and stores.owner_id = auth.uid())
  );
create policy listings_update_owner on public.store_listings
  for update using (
    exists (select 1 from public.stores where stores.id = store_listings.store_id and stores.owner_id = auth.uid())
    or is_admin()
  );
create policy listings_delete_owner on public.store_listings
  for delete using (
    exists (select 1 from public.stores where stores.id = store_listings.store_id and stores.owner_id = auth.uid())
  );

-- orders
create policy orders_select_involved on public.orders
  for select using (
    customer_id = auth.uid()
    or exists (select 1 from public.stores where stores.id = orders.store_id and stores.owner_id = auth.uid())
    or is_admin()
  );
create policy orders_insert_customer on public.orders
  for insert with check (customer_id = auth.uid());
create policy orders_update_involved on public.orders
  for update using (
    customer_id = auth.uid()
    or exists (select 1 from public.stores where stores.id = orders.store_id and stores.owner_id = auth.uid())
    or is_admin()
  );

-- order_items
create policy order_items_select_involved on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.customer_id = auth.uid()
          or exists (select 1 from public.stores s where s.id = o.store_id and s.owner_id = auth.uid())
          or is_admin()
        )
    )
  );
create policy order_items_insert_customer on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.customer_id = auth.uid())
  );

-- reviews
create policy reviews_select_all on public.reviews
  for select using (true);
create policy reviews_insert_customer on public.reviews
  for insert with check (customer_id = auth.uid());

-- payouts
create policy payouts_select_owner on public.payouts
  for select using (
    exists (select 1 from public.stores where stores.id = payouts.store_id and stores.owner_id = auth.uid())
    or is_admin()
  );
