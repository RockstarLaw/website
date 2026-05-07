-- Phase 2: professor-photos storage RLS
-- Date: 2026-05-07
-- Bucket is PRIVATE. RLS gates reads to authenticated users and writes to the owning professor.
-- Drops the narrower Phase 1 INSERT+DELETE policies and replaces with a unified ALL + SELECT pair.

drop policy if exists "professors can upload their own photo" on storage.objects;
drop policy if exists "professors can delete their own photo" on storage.objects;
drop policy if exists "professors can manage their own photo" on storage.objects;

create policy "professors can manage their own photo"
on storage.objects
for all
using (
  bucket_id = 'professor-photos'
  and exists (
    select 1 from public.professor_profiles pp
    where pp.user_id = auth.uid()
      and name like pp.id::text || '/%'
  )
)
with check (
  bucket_id = 'professor-photos'
  and exists (
    select 1 from public.professor_profiles pp
    where pp.user_id = auth.uid()
      and name like pp.id::text || '/%'
  )
);

drop policy if exists "anyone authenticated can read professor photos" on storage.objects;
create policy "anyone authenticated can read professor photos"
on storage.objects for select
using (
  bucket_id = 'professor-photos'
  and auth.uid() is not null
);
