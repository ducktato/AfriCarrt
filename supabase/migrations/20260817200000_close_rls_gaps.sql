-- Closes three RLS gaps found while auditing the pulled schema (see chat):
--   1. users_update_own let a user change their own `role`.
--   2. stores_update_owner_or_admin let an owner self-verify, flip
--      business_license_status, or flip is_active (the kill switch).
--   3. reviews_insert_customer didn't check the order belonged to the
--      customer or was completed.
--
-- (1) and (2) are column-level restrictions, which RLS USING/WITH CHECK can't
-- express against OLD values reliably, so they're enforced with BEFORE UPDATE
-- triggers layered on top of the existing policies. (3) is a straight
-- WITH CHECK rewrite.

-- 1. Prevent self-service role escalation ---------------------------------
create function public.prevent_user_role_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an admin can change a user''s role';
  end if;
  return new;
end;
$$;

create trigger prevent_user_role_change
  before update on public.users
  for each row execute function public.prevent_user_role_change();

-- 2. Prevent store owners from self-verifying / lifting the kill switch ---
create function public.prevent_store_privileged_field_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() and (
    new.verified is distinct from old.verified
    or new.business_license_status is distinct from old.business_license_status
    or new.is_active is distinct from old.is_active
  ) then
    raise exception 'Only an admin can change verified, business_license_status, or is_active';
  end if;
  return new;
end;
$$;

create trigger prevent_store_privileged_field_change
  before update on public.stores
  for each row execute function public.prevent_store_privileged_field_change();

-- 3. Reviews must belong to the reviewer's own completed order ------------
drop policy if exists reviews_insert_customer on public.reviews;

create policy reviews_insert_customer on public.reviews
  for insert with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = reviews.order_id
        and o.customer_id = reviews.customer_id
        and o.store_id = reviews.store_id
        and o.status = 'completed'
    )
  );
