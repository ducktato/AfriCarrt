-- The severity override (>25% of recent orders have a documented issue)
-- needs a minimum sample size to mean anything -- otherwise a single
-- stockout on a brand-new store's first order (100%) immediately suspends
-- it. Below 10 total orders in the rolling 30-day window, only the
-- standard cumulative 3-strike escalation applies.

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

  if v_recent_orders >= 10 and v_severity_pct > 0.25 then
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
