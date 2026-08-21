-- Storage bucket for catalog/listing product photos.
-- Object path convention: {store_id}/{filename}, so ownership can be checked
-- against the store the uploader owns.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] in (
        select id::text from public.stores where owner_id = auth.uid()
      )
    )
  );

create policy "product_images_owner_update" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] in (
        select id::text from public.stores where owner_id = auth.uid()
      )
    )
  );

create policy "product_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] in (
        select id::text from public.stores where owner_id = auth.uid()
      )
    )
  );
