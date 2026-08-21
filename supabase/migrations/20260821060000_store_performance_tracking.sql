-- Feature 3: store performance tracking (late packing, cancellations,
-- stockouts) with two enforcement mechanisms per the Vendor Agreement:
--   Standard escalation (cumulative, all-time): 1st issue -> warning,
--     2nd -> suspended, 3rd -> deactivated.
--   Severity override: >25% of a store's orders in a rolling 30-day window
--     have a documented issue -> immediate suspension, bypassing the
--     standard sequence.
-- Both "suspended" and "deactivated" are enforced via the same is_active
-- kill-switch already built and tested; suspension_level just records which
-- tier triggered it.

-- Needed so pickup orders (which never get an Uber webhook) have a way to
-- leave 'packing', and so "late packing" has a completion signal to check
-- against at all.
alter table public.orders add column ready_at timestamptz;

alter table public.stores
  add column strike_count integer not null default 0,
  add column suspension_level text not null default 'none'
    check (suspension_level = any (array['none', 'warning', 'suspended', 'deactivated']));

create table public.store_performance_events (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid not null references public.stores (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  event_type text not null check (event_type = any (array['late_packing', 'cancellation', 'stockout'])),
  created_at timestamptz not null default now()
);

alter table public.store_performance_events enable row level security;

create policy "performance_events_select_involved" on public.store_performance_events
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.is_admin()
  );

-- strike_count and suspension_level are system-computed, same guard as
-- commission_rate / Google Places fields: owner can read, only admin or the
-- server can write.
create or replace function public.prevent_store_privileged_field_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if not public.is_admin() and (
    new.verified is distinct from old.verified
    or new.business_license_status is distinct from old.business_license_status
    or new.is_active is distinct from old.is_active
    or new.stripe_connect_account_id is distinct from old.stripe_connect_account_id
    or new.stripe_connect_onboarded is distinct from old.stripe_connect_onboarded
    or new.commission_rate is distinct from old.commission_rate
    or new.google_place_id is distinct from old.google_place_id
    or new.google_places_match_status is distinct from old.google_places_match_status
    or new.google_places_name is distinct from old.google_places_name
    or new.google_places_address is distinct from old.google_places_address
    or new.strike_count is distinct from old.strike_count
    or new.suspension_level is distinct from old.suspension_level
  ) then
    raise exception 'Only an admin (or the server, via service role) can change verified, business_license_status, is_active, Stripe Connect, commission rate, Google Places, or performance-standing fields';
  end if;
  return new;
end;
$$;

create or replace function public.record_performance_event(
  p_store_id uuid, p_order_id uuid, p_event_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_strike_count integer;
  v_recent_events integer;
  v_recent_orders integer;
  v_severity_pct numeric;
  v_new_level text;
begin
  insert into public.store_performance_events (store_id, order_id, event_type)
  values (p_store_id, p_order_id, p_event_type);

  select count(*) into v_strike_count
  from public.store_performance_events where store_id = p_store_id;

  select count(*) into v_recent_events
  from public.store_performance_events
  where store_id = p_store_id and created_at >= now() - interval '30 days';

  select count(*) into v_recent_orders
  from public.orders
  where store_id = p_store_id and created_at >= now() - interval '30 days';

  v_severity_pct := case when v_recent_orders > 0
    then v_recent_events::numeric / v_recent_orders else 0 end;

  if v_severity_pct > 0.25 then
    v_new_level := 'suspended';
  elsif v_strike_count >= 3 then
    v_new_level := 'deactivated';
  elsif v_strike_count = 2 then
    v_new_level := 'suspended';
  elsif v_strike_count = 1 then
    v_new_level := 'warning';
  else
    v_new_level := 'none';
  end if;

  alter table public.stores disable trigger prevent_store_privileged_field_change;

  update public.stores
  set strike_count = v_strike_count,
      suspension_level = v_new_level,
      is_active = case when v_new_level in ('suspended', 'deactivated') then false else is_active end
  where id = p_store_id;

  alter table public.stores enable trigger prevent_store_privileged_field_change;
end;
$$;

-- Moves real enforcement state (can take a store offline); only the server
-- (service_role) or pg_cron's internal execution may call it.
revoke execute on function public.record_performance_event(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.record_performance_event(uuid, uuid, text) to service_role;

create or replace function public.check_late_packing()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select o.id, o.store_id
    from public.orders o
    where o.status = 'packing'
      and o.ready_at is null
      and o.created_at < now() - interval '30 minutes'
      and not exists (
        select 1 from public.store_performance_events e
        where e.order_id = o.id and e.event_type = 'late_packing'
      )
  loop
    perform public.record_performance_event(r.store_id, r.id, 'late_packing');
  end loop;
end;
$$;

select cron.schedule(
  'check-late-packing',
  '*/5 * * * *',
  $$select public.check_late_packing();$$
);
