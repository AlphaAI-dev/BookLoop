-- BL-002 · Migration 4/4 — storage buckets and object access policies.
--
-- Path convention for every bucket:  <owner auth uid>/<anything>
-- The first folder segment must equal the uploader's uid, so users can only
-- write inside their own folder.
--
-- avatars, listing-images : public read via public URL (approved BL-002).
-- digital-resources       : PRIVATE. Only the owning seller can read/write via
--                           the API. Buyers will receive short-lived signed URLs
--                           issued server-side after an entitlement check
--                           (Phase 8). Never make this bucket public.
--
-- Bucket MIME/size limits are a first line of defence only; server code must
-- still validate extension, content and ownership before accepting uploads.

-- Upsert so the migration converges if a bucket was created in the dashboard.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('listing-images', 'listing-images', true, 5 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('digital-resources', 'digital-resources', false, 50 * 1024 * 1024,
   array[
     'application/pdf',
     'application/epub+zip',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
   ])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Owner-folder policies (one set per bucket, explicit for reviewability)
-- ---------------------------------------------------------------------------

-- avatars -------------------------------------------------------------------
create policy "avatars: owners can read own objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: owners can upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: owners can update own objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: owners can delete own objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- listing-images ------------------------------------------------------------
create policy "listing-images: owners can read own objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "listing-images: owners can upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "listing-images: owners can update own objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "listing-images: owners can delete own objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- digital-resources (private) ----------------------------------------------
create policy "digital-resources: owners can read own objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'digital-resources' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "digital-resources: owners can upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'digital-resources' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "digital-resources: owners can update own objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'digital-resources' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'digital-resources' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "digital-resources: owners can delete own objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'digital-resources' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- No anon policies on any bucket, and no buyer read policy on
-- digital-resources: paid-file access is server-mediated only.
