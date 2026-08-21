-- Legal doc acceptance tracking + automated vendor verification fields.

alter table public.users
  add column terms_accepted_at timestamptz;

alter table public.stores
  add column ontario_corp_number text,
  add column hst_number text,
  add column business_registration_doc_path text,
  add column food_handler_cert_path text,
  add column certificate_of_insurance_path text,
  add column vendor_agreement_accepted_at timestamptz,
  add column google_place_id text,
  add column google_places_match_status text
    check (google_places_match_status is null or google_places_match_status = any (
      array['matched', 'mismatch', 'not_found', 'error']
    )),
  add column google_places_name text,
  add column google_places_address text,
  add column commission_rate numeric(5, 4) not null default 0.15;

-- Guard the system-computed verification fields the same way Stripe Connect
-- fields are guarded: only admin or the server (service role) can set them.
-- Self-reported fields (corp number, HST, doc paths, agreement acceptance)
-- stay owner-writable, same as business_license_number already is.
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
  ) then
    raise exception 'Only an admin (or the server, via service role) can change verified, business_license_status, is_active, Stripe Connect, commission rate, or Google Places fields';
  end if;
  return new;
end;
$$;

-- Private bucket for vendor KYB documents (business registration, food
-- handler cert, certificate of insurance). Object path convention:
-- {store_id}/{filename}, mirroring product-images. Unlike product-images,
-- this bucket is NOT public -- files are viewed via signed URLs generated
-- for the owning store owner or an admin.
insert into storage.buckets (id, name, public)
values ('vendor-documents', 'vendor-documents', false)
on conflict (id) do nothing;

create policy "vendor_documents_owner_or_admin_read" on storage.objects
  for select using (
    bucket_id = 'vendor-documents'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] in (
        select id::text from public.stores where owner_id = auth.uid()
      )
    )
  );

create policy "vendor_documents_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'vendor-documents'
    and (storage.foldername(name))[1] in (
      select id::text from public.stores where owner_id = auth.uid()
    )
  );

create policy "vendor_documents_owner_update" on storage.objects
  for update using (
    bucket_id = 'vendor-documents'
    and (storage.foldername(name))[1] in (
      select id::text from public.stores where owner_id = auth.uid()
    )
  );
