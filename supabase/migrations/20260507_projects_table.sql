-- RockStar Law: projects table for professor-uploaded project source materials
-- Date: 2026-05-07
-- Files live in Supabase Storage bucket "projects". This table stores metadata + path refs.

create table if not exists public.projects (
  id                uuid primary key default gen_random_uuid(),
  professor_id      uuid not null
                      references public.professor_profiles(id) on delete cascade,
  title             text not null,
  description       text,
  original_filename text not null,
  storage_path      text not null,
  file_size_bytes   bigint not null,
  mime_type         text not null,
  uploaded_at       timestamptz not null default timezone('utc', now())
);

create index if not exists idx_projects_professor_id
  on public.projects(professor_id);

-- ─── DB table RLS ─────────────────────────────────────────────────────────────

alter table public.projects enable row level security;

drop policy if exists "professors can manage their own projects" on public.projects;
create policy "professors can manage their own projects"
on public.projects for all
using (
  exists (
    select 1 from public.professor_profiles pp
    where pp.id = projects.professor_id
      and pp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.professor_profiles pp
    where pp.id = projects.professor_id
      and pp.user_id = auth.uid()
  )
);

-- ─── Storage object RLS (belt-and-suspenders for future client-side uploads) ──
-- Server actions use the admin/service-role client which bypasses RLS.
-- These policies protect against direct client-side storage access.

drop policy if exists "professors can upload project files" on storage.objects;
create policy "professors can upload project files"
on storage.objects for insert
with check (
  bucket_id = 'projects'
  and exists (
    select 1 from public.professor_profiles pp
    where pp.user_id = auth.uid()
      and name like pp.id::text || '/%'
  )
);

drop policy if exists "professors can read own project files" on storage.objects;
create policy "professors can read own project files"
on storage.objects for select
using (
  bucket_id = 'projects'
  and exists (
    select 1 from public.professor_profiles pp
    where pp.user_id = auth.uid()
      and name like pp.id::text || '/%'
  )
);

drop policy if exists "professors can delete own project files" on storage.objects;
create policy "professors can delete own project files"
on storage.objects for delete
using (
  bucket_id = 'projects'
  and exists (
    select 1 from public.professor_profiles pp
    where pp.user_id = auth.uid()
      and name like pp.id::text || '/%'
  )
);

comment on table public.projects is
  'Project source material uploaded by professors. Files live in Supabase Storage bucket "projects".';
