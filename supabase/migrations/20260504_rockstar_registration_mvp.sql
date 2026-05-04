-- Rockstar Law main registration / onboarding MVP schema
-- Date: 2026-05-04
-- Scope: student, professor, school, roster, and matching foundation only

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  primary_role text not null check (primary_role in ('student', 'professor', 'school_admin', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  status text not null check (status in ('registered', 'placeholder', 'pending_review', 'rejected')),
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  domains jsonb not null default '[]'::jsonb,
  website_url text,
  admin_contact_name text,
  admin_contact_email text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  approved_by_admin_id uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  middle_name text,
  last_name text not null,
  preferred_name text,
  title text,
  university_email text not null,
  additional_emails jsonb not null default '[]'::jsonb,
  mobile_phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  university_id uuid not null references public.schools(id) on delete restrict,
  university_name_snapshot text not null,
  university_address_snapshot jsonb not null,
  law_school_year text,
  enrollment_status text,
  undergraduate_institution text,
  profile_photo_url text,
  onboarding_status text not null default 'started' check (onboarding_status in ('started', 'incomplete', 'complete', 'needs_review')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.professor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  title text,
  email text not null,
  mobile_phone text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  university_id uuid not null references public.schools(id) on delete restrict,
  university_name_snapshot text not null,
  university_address_snapshot jsonb not null,
  profile_photo_url text,
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  onboarding_status text not null default 'started' check (onboarding_status in ('started', 'incomplete', 'complete', 'needs_review')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  course_name text not null,
  course_number text,
  course_category text,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive', 'placeholder')),
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.professor_courses (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.professor_profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  custom_course_name text,
  term text,
  section_name text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rosters (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.professor_profiles(id) on delete cascade,
  professor_course_id uuid references public.professor_courses(id) on delete set null,
  school_id uuid not null references public.schools(id) on delete cascade,
  roster_name text not null,
  term text,
  section_name text,
  upload_source text not null check (upload_source in ('csv', 'manual')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.roster_entries (
  id uuid primary key default gen_random_uuid(),
  roster_id uuid not null references public.rosters(id) on delete cascade,
  first_name text not null,
  middle_name text,
  last_name text not null,
  full_name_raw text not null,
  email text,
  student_id_external text,
  status text not null default 'active' check (status in ('active', 'dropped', 'inactive')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.student_professor_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  professor_id uuid not null references public.professor_profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'rejected', 'inactive')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (student_id, professor_id, school_id)
);

create table if not exists public.roster_matches (
  id uuid primary key default gen_random_uuid(),
  roster_entry_id uuid not null references public.roster_entries(id) on delete cascade,
  student_id uuid references public.student_profiles(id) on delete cascade,
  professor_id uuid not null references public.professor_profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  match_status text not null check (match_status in ('auto_matched', 'needs_review', 'confirmed', 'rejected', 'no_match')),
  confidence_score numeric(5,2),
  match_reason text,
  matched_by text not null default 'system' check (matched_by in ('system', 'professor', 'admin')),
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_schools_status on public.schools(status);
create index if not exists idx_student_profiles_university_id on public.student_profiles(university_id);
create index if not exists idx_professor_profiles_university_id on public.professor_profiles(university_id);
create index if not exists idx_courses_school_id on public.courses(school_id);
create index if not exists idx_rosters_professor_id on public.rosters(professor_id);
create index if not exists idx_roster_entries_roster_id on public.roster_entries(roster_id);
create index if not exists idx_student_professor_links_student_id on public.student_professor_links(student_id);
create index if not exists idx_roster_matches_roster_entry_id on public.roster_matches(roster_entry_id);
create index if not exists idx_roster_matches_match_status on public.roster_matches(match_status);

create or replace trigger set_updated_at_app_users
before update on public.app_users
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_schools
before update on public.schools
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_student_profiles
before update on public.student_profiles
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_professor_profiles
before update on public.professor_profiles
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_courses
before update on public.courses
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_professor_courses
before update on public.professor_courses
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_rosters
before update on public.rosters
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_roster_entries
before update on public.roster_entries
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_student_professor_links
before update on public.student_professor_links
for each row execute function public.set_updated_at();

create or replace trigger set_updated_at_roster_matches
before update on public.roster_matches
for each row execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.schools enable row level security;
alter table public.student_profiles enable row level security;
alter table public.professor_profiles enable row level security;
alter table public.courses enable row level security;
alter table public.professor_courses enable row level security;
alter table public.rosters enable row level security;
alter table public.roster_entries enable row level security;
alter table public.student_professor_links enable row level security;
alter table public.roster_matches enable row level security;

drop policy if exists "authenticated users can read schools" on public.schools;
create policy "authenticated users can read schools"
on public.schools for select
using (auth.role() = 'authenticated');

drop policy if exists "authenticated users can read courses" on public.courses;
create policy "authenticated users can read courses"
on public.courses for select
using (auth.role() = 'authenticated');

drop policy if exists "users can read own app user row" on public.app_users;
create policy "users can read own app user row"
on public.app_users for select
using (auth.uid() = user_id);

drop policy if exists "users can read own student profile" on public.student_profiles;
create policy "users can read own student profile"
on public.student_profiles for select
using (auth.uid() = user_id);

drop policy if exists "users can read own professor profile" on public.professor_profiles;
create policy "users can read own professor profile"
on public.professor_profiles for select
using (auth.uid() = user_id);

comment on table public.app_users is 'App-level role anchor for Rockstar Law main registration MVP.';
comment on table public.schools is 'University/law school records for the main onboarding system.';
comment on table public.roster_matches is 'Student-to-roster match records for professor/admin review.';
