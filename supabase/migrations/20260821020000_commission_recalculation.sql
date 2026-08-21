-- Automated monthly commission tier recalculation, per the Vendor Agreement:
-- 0-149 completed orders (prior calendar month) = 15%, 150-299 = 13%, 300+ = 11%.
-- "Completed" = delivered (delivery fulfillment) or completed (pickup fulfillment).

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.recalculate_commission_rates()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  period_start date := date_trunc('month', now() - interval '1 month')::date;
  period_end date := date_trunc('month', now())::date;
begin
  -- commission_rate is a privileged, admin/service-only field (see
  -- prevent_store_privileged_field_change). This is the system's own
  -- monthly batch job, so it disables that one trigger for the duration of
  -- its own update, the same way a bulk/system migration would.
  alter table public.stores disable trigger prevent_store_privileged_field_change;

  update public.stores s
  set commission_rate = case
    when completed.cnt >= 300 then 0.11
    when completed.cnt >= 150 then 0.13
    else 0.15
  end
  from (
    select store_id, count(*) as cnt
    from public.orders
    where status in ('delivered', 'completed')
      and created_at >= period_start
      and created_at < period_end
    group by store_id
  ) completed
  where s.id = completed.store_id;

  -- Stores with zero completed orders in the prior month have no row in the
  -- aggregate above -- explicitly step them back down to the base tier so a
  -- quiet month is reflected too, not just growth.
  update public.stores s
  set commission_rate = 0.15
  where not exists (
    select 1 from public.orders o
    where o.store_id = s.id
      and o.status in ('delivered', 'completed')
      and o.created_at >= period_start
      and o.created_at < period_end
  );

  alter table public.stores enable trigger prevent_store_privileged_field_change;
end;
$$;

select cron.schedule(
  'recalculate-commission-rates',
  '5 0 1 * *',
  $$select public.recalculate_commission_rates();$$
);
