-- RockStar Law: modules catalog and course_modules join table
-- Date: 2026-05-06
-- Scope: module catalog, course-module enablement, seed inserts, RLS, indexes

-- ─── 1. modules catalog ───────────────────────────────────────────────────────

create table if not exists public.modules (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  display_name text not null,
  jurisdiction text not null,
  icon_path    text not null,
  module_url   text not null,
  category     text not null check (category in ('federal', 'state', 'county', 'international')),
  created_at   timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now())
);

-- ─── 2. course_modules join table ─────────────────────────────────────────────
-- Toggle table: a module is either enabled for a course or it isn't.
-- No updated_at — rows are inserted or deleted, never updated.

create table if not exists public.course_modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  module_id   uuid not null references public.modules(id) on delete cascade,
  enabled_via text not null check (enabled_via in ('auto', 'manual')),
  created_at  timestamptz not null default timezone('utc', now()),
  unique (course_id, module_id)
);

-- ─── 3. Indexes ───────────────────────────────────────────────────────────────

create index if not exists idx_modules_slug
  on public.modules(slug);

create index if not exists idx_modules_category
  on public.modules(category);

create index if not exists idx_course_modules_course_id
  on public.course_modules(course_id);

create index if not exists idx_course_modules_module_id
  on public.course_modules(module_id);

-- ─── 4. updated_at trigger (modules only) ────────────────────────────────────
-- Reuses set_updated_at() already defined in the MVP migration.

create or replace trigger set_updated_at_modules
before update on public.modules
for each row execute function public.set_updated_at();

-- ─── 5. RLS — modules ─────────────────────────────────────────────────────────

alter table public.modules enable row level security;

drop policy if exists "authenticated users can read modules" on public.modules;
create policy "authenticated users can read modules"
on public.modules for select
using (auth.role() = 'authenticated');

-- Write access is admin-only (service role). No public insert/update/delete policy.

-- ─── 6. RLS — course_modules ──────────────────────────────────────────────────
-- Read: any authenticated user (consistent with courses and modules; tighten later).
-- Write: professor who teaches the course only.
-- TODO (future hardening slice): tighten read to enrolled students + professor only.

alter table public.course_modules enable row level security;

drop policy if exists "authenticated users can read course_modules" on public.course_modules;
create policy "authenticated users can read course_modules"
on public.course_modules for select
using (auth.role() = 'authenticated');

drop policy if exists "professors can insert their course modules" on public.course_modules;
create policy "professors can insert their course modules"
on public.course_modules for insert
with check (
  exists (
    select 1
    from public.professor_courses pc
    join public.professor_profiles pp on pp.id = pc.professor_id
    where pc.course_id = course_modules.course_id
      and pp.user_id = auth.uid()
  )
);

drop policy if exists "professors can delete their course modules" on public.course_modules;
create policy "professors can delete their course modules"
on public.course_modules for delete
using (
  exists (
    select 1
    from public.professor_courses pc
    join public.professor_profiles pp on pp.id = pc.professor_id
    where pc.course_id = course_modules.course_id
      and pp.user_id = auth.uid()
  )
);

-- ─── 7. Seed the modules catalog ─────────────────────────────────────────────
-- Idempotent — on conflict (slug) do nothing.

insert into public.modules (slug, display_name, jurisdiction, icon_path, module_url, category)
values
  (
    'florida_starbiz',
    'Florida StarBiz',
    'florida',
    '/images/modules/icon_florida_starbiz.png',
    'https://placeholder.rockstar.law/florida-starbiz',
    'state'
  ),
  (
    'federal_uspto',
    'USPTO',
    'federal',
    '/images/modules/icon_federal_uspto.png',
    'https://placeholder.rockstar.law/federal-uspto',
    'federal'
  ),
  (
    'federal_copyright_office',
    'U.S. Copyright Office',
    'federal',
    '/images/modules/icon_federal_copyright_office.png',
    'https://placeholder.rockstar.law/federal-copyright-office',
    'federal'
  ),
  (
    'federal_sec',
    'Securities and Exchange Commission',
    'federal',
    '/images/modules/icon_federal_sec.png',
    'https://placeholder.rockstar.law/federal-sec',
    'federal'
  ),
  (
    'federal_irs',
    'Internal Revenue Service',
    'federal',
    '/images/modules/icon_federal_irs.png',
    'https://placeholder.rockstar.law/federal-irs',
    'federal'
  ),
  (
    'broward_county_courts',
    'Broward County Courts',
    'broward_county',
    '/images/modules/icon_broward_county_courts.png',
    'https://placeholder.rockstar.law/broward-county-courts',
    'county'
  )
on conflict (slug) do nothing;

-- ─── 8. Table comments ────────────────────────────────────────────────────────

comment on table public.modules is 'Catalog of RockStar Law simulation modules.';
comment on table public.course_modules is 'Join table: modules enabled for a specific course.';
