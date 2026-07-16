insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Product media public read" on storage.objects;
drop policy if exists "Users upload own product media" on storage.objects;
drop policy if exists "Users update own product media" on storage.objects;
drop policy if exists "Users delete own product media" on storage.objects;

create policy "Product media public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-media');

create policy "Users upload own product media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-media'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Users update own product media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-media'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'product-media'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

create policy "Users delete own product media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-media'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
