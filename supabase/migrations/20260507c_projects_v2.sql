-- Slice A v2: rebuild projects schema with multi-file + catalog metadata + author photo
-- Date: 2026-05-07
-- Safe to drop: no real project data exists yet.

-- ─── 1. Drop old storage policies (professor-id-prefix scheme) ────────────────

drop policy if exists "professors can upload project files" on storage.objects;
drop policy if exists "professors can read own project files" on storage.objects;
drop policy if exists "professors can delete own project files" on storage.objects;
drop policy if exists "TAs can read own assigned project files" on storage.objects;

-- ─── 2. Drop old projects table (cascades RLS policies + future FK children) ──

drop table if exists public.projects cascade;

-- ─── 3. Rename profile_photo_url → photo_path on professor_profiles ───────────
-- No existing queries reference this column; rename is safe.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'professor_profiles'
      and column_name = 'profile_photo_url'
  ) then
    alter table public.professor_profiles rename column profile_photo_url to photo_path;
  end if;
end;
$$;

-- ─── 4. New projects table ────────────────────────────────────────────────────

create table if not exists public.projects (
  id                    uuid primary key default gen_random_uuid(),
  professor_id          uuid not null
                          references public.professor_profiles(id) on delete cascade,
  title                 text not null,
  tagline               text not null,
  pitch                 text not null,
  versus                boolean not null default false,
  drafting              boolean not null default false,
  oral_argument         boolean not null default false,
  solo                  boolean not null default false,
  team                  boolean not null default false,
  creativity            boolean not null default false,
  duration              text not null
                          check (duration in ('1hr','3hr','1wk','2wk','30day','semester')),
  real_world            boolean not null default false,
  world_rank_qualifying boolean not null default false,
  popularity            integer not null default 0,
  image_1_path          text,
  image_2_path          text,
  image_3_path          text,
  created_at            timestamptz not null default timezone('utc', now())
);

create index if not exists idx_projects_professor_id
  on public.projects(professor_id);

-- ─── 5. New project_files table ───────────────────────────────────────────────

create table if not exists public.project_files (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  label             text not null,
  audience_tag      text not null
                      check (audience_tag in
                        ('general','side_a','side_b','team_a','team_b','solo','ta_only')),
  original_filename text not null,
  storage_path      text not null,
  file_size_bytes   bigint not null,
  mime_type         text not null,
  uploaded_at       timestamptz not null default timezone('utc', now())
);

create index if not exists idx_project_files_project_id
  on public.project_files(project_id);

-- ─── 6. RLS — projects ────────────────────────────────────────────────────────

alter table public.projects enable row level security;

drop policy if exists "professors can manage their own projects" on public.projects;
create policy "professors can manage their own projects"
on public.projects for all
using (exists (
  select 1 from public.professor_profiles pp
  where pp.id = projects.professor_id and pp.user_id = auth.uid()
))
with check (exists (
  select 1 from public.professor_profiles pp
  where pp.id = projects.professor_id and pp.user_id = auth.uid()
));

drop policy if exists "TAs can read projects of professors they TA for" on public.projects;
create policy "TAs can read projects of professors they TA for"
on public.projects for select
using (exists (
  select 1
  from public.course_tas ct
  inner join public.professor_courses pc on pc.id = ct.professor_course_id
  inner join public.student_profiles sp on sp.id = ct.user_id
  where sp.user_id = auth.uid()
    and ct.status = 'accepted'
    and pc.professor_id = projects.professor_id
));

-- ─── 7. RLS — project_files ───────────────────────────────────────────────────

alter table public.project_files enable row level security;

drop policy if exists "professors can manage their project files" on public.project_files;
create policy "professors can manage their project files"
on public.project_files for all
using (exists (
  select 1 from public.projects p
  inner join public.professor_profiles pp on pp.id = p.professor_id
  where p.id = project_files.project_id and pp.user_id = auth.uid()
))
with check (exists (
  select 1 from public.projects p
  inner join public.professor_profiles pp on pp.id = p.professor_id
  where p.id = project_files.project_id and pp.user_id = auth.uid()
));

-- TAs see all audience tags (operator access, not student access)
drop policy if exists "TAs can read project files of professors they TA for" on public.project_files;
create policy "TAs can read project files of professors they TA for"
on public.project_files for select
using (exists (
  select 1
  from public.projects p
  inner join public.professor_courses pc on pc.professor_id = p.professor_id
  inner join public.course_tas ct on ct.professor_course_id = pc.id
  inner join public.student_profiles sp on sp.id = ct.user_id
  where p.id = project_files.project_id
    and sp.user_id = auth.uid()
    and ct.status = 'accepted'
));

-- ─── 8. Storage RLS — projects bucket (project-id prefix) ────────────────────

drop policy if exists "professors can insert project files" on storage.objects;
create policy "professors can insert project files"
on storage.objects for insert
with check (
  bucket_id = 'projects'
  and exists (
    select 1 from public.projects p
    inner join public.professor_profiles pp on pp.id = p.professor_id
    where pp.user_id = auth.uid()
      and name like p.id::text || '/%'
  )
);

drop policy if exists "professors can select project files" on storage.objects;
create policy "professors can select project files"
on storage.objects for select
using (
  bucket_id = 'projects'
  and exists (
    select 1 from public.projects p
    inner join public.professor_profiles pp on pp.id = p.professor_id
    where pp.user_id = auth.uid()
      and name like p.id::text || '/%'
  )
);

drop policy if exists "professors can delete project files" on storage.objects;
create policy "professors can delete project files"
on storage.objects for delete
using (
  bucket_id = 'projects'
  and exists (
    select 1 from public.projects p
    inner join public.professor_profiles pp on pp.id = p.professor_id
    where pp.user_id = auth.uid()
      and name like p.id::text || '/%'
  )
);

drop policy if exists "TAs can read own assigned project files" on storage.objects;
create policy "TAs can read own assigned project files"
on storage.objects for select
using (
  bucket_id = 'projects'
  and exists (
    select 1
    from public.projects p
    inner join public.professor_courses pc on pc.professor_id = p.professor_id
    inner join public.course_tas ct on ct.professor_course_id = pc.id
    inner join public.student_profiles sp on sp.id = ct.user_id
    where sp.user_id = auth.uid()
      and ct.status = 'accepted'
      and name like p.id::text || '/%'
  )
);

-- ─── 9. Storage RLS — professor-photos bucket (public bucket) ────────────────
-- Bucket is public; no SELECT policy needed. INSERT + DELETE scoped to own photos.

drop policy if exists "professors can upload their own photo" on storage.objects;
create policy "professors can upload their own photo"
on storage.objects for insert
with check (
  bucket_id = 'professor-photos'
  and exists (
    select 1 from public.professor_profiles pp
    where pp.user_id = auth.uid()
      and name like pp.id::text || '/%'
  )
);

drop policy if exists "professors can delete their own photo" on storage.objects;
create policy "professors can delete their own photo"
on storage.objects for delete
using (
  bucket_id = 'professor-photos'
  and exists (
    select 1 from public.professor_profiles pp
    where pp.user_id = auth.uid()
      and name like pp.id::text || '/%'
  )
);

-- ─── Comments ─────────────────────────────────────────────────────────────────

comment on table public.projects is
  'Project catalog entries. Multi-file, audience-tagged. Catalog metadata for Project Shop.';
comment on table public.project_files is
  'Files attached to a project. audience_tag gates student-side visibility; TAs see all.';
