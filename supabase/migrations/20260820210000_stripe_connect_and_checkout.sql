-- Stripe Connect account per store, plus a couple of columns checkout needs
-- that weren't modeled yet: which order a payout is for is already covered
-- by payouts.order_id, but stores needs somewhere to keep its connected
-- account id, and orders needs a place to record the platform commission
-- taken out of each order (kept separate from delivery/service fees).
alter table public.stores
  add column stripe_connect_account_id text,
  add column stripe_connect_onboarded boolean not null default false;

alter table public.orders
  add column commission_amount numeric(10, 2) not null default 0;

-- Store owners can read their own connect status (already covered by
-- stores_select_all being public), but only admins/service-role should write
-- stripe_connect_account_id / stripe_connect_onboarded -- those are set by
-- server-side Stripe API responses, never by client input. The existing
-- stores_update_owner_or_admin policy would otherwise let an owner set these
-- directly, so guard them the same way the earlier privileged-fields trigger
-- guards verified/business_license_status/is_active.
create or replace function public.prevent_store_privileged_field_change()
returns trigger
language plpgsql
security definer set search_path = public
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
  ) then
    raise exception 'Only an admin (or the server, via service role) can change verified, business_license_status, is_active, or Stripe Connect fields';
  end if;
  return new;
end;
$$;
