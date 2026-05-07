-- RockStar Law: TA slot assignments per professor_course section
-- Date: 2026-05-06
-- 2 free + 2 paid slots max per professor_course (enforced via trigger).
-- Paid slots are schema-ready but blocked at the action layer until Stripe lands.

create table if not exists public.course_tas (
  id                    uuid primary key default gen_random_uuid(),
  professor_course_id   uuid not null references public.professor_courses(id) on delete cascade,
  user_id               uuid not null references public.student_profiles(id) on delete cascade,
  slot_type             text not null check (slot_type in ('free', 'paid')),
  status                text not null default 'pending'
                          check (status in ('pending', 'accepted', 'declined', 'revoked')),
  invited_by_professor  uuid not null references public.professor_profiles(id) on delete cascade,
  invited_at            timestamptz not null default timezone('utc', now()),
  accepted_at           timestamptz,
  declined_at           timestamptz,
  revoked_at            timestamptz,
  -- same student can't be invited twice to the same section
  unique (professor_course_id, user_id)
);

create index if not exists idx_course_tas_professor_course_id
  on public.course_tas(professor_course_id);

create index if not exists idx_course_tas_user_id
  on public.course_tas(user_id);

-- ─── Slot cap trigger ─────────────────────────────────────────────────────────
-- Enforces max 2 active (pending + accepted) rows per (professor_course_id, slot_type).

create or replace function public.check_course_ta_slot_limit()
returns trigger language plpgsql as $$
declare
  active_count integer;
begin
  select count(*) into active_count
  from public.course_tas
  where professor_course_id = NEW.professor_course_id
    and slot_type = NEW.slot_type
    and status in ('pending', 'accepted');
  if active_count >= 2 then
    raise exception 'TA slot limit reached: max 2 % slots per course section', NEW.slot_type;
  end if;
  return NEW;
end;
$$;

create or replace trigger enforce_course_ta_slot_limit
before insert on public.course_tas
for each row execute function public.check_course_ta_slot_limit();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.course_tas enable row level security;

-- Professor: full access on their own professor_courses rows
drop policy if exists "professors can manage course tas" on public.course_tas;
create policy "professors can manage course tas"
on public.course_tas for all
using (
  exists (
    select 1 from public.professor_courses pc
    join public.professor_profiles pp on pp.id = pc.professor_id
    where pc.id = course_tas.professor_course_id
      and pp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.professor_courses pc
    join public.professor_profiles pp on pp.id = pc.professor_id
    where pc.id = course_tas.professor_course_id
      and pp.user_id = auth.uid()
  )
);

-- Invited student: read their own rows
drop policy if exists "students can read their own ta rows" on public.course_tas;
create policy "students can read their own ta rows"
on public.course_tas for select
using (
  exists (
    select 1 from public.student_profiles sp
    where sp.id = course_tas.user_id
      and sp.user_id = auth.uid()
  )
);

comment on table public.course_tas is
  'TA slot assignments per professor_course section. Max 2 free + 2 paid slots (trigger-enforced).';
