-- DASH-1: Constrain student_profiles.law_school_year and enrollment_status
-- to the new enum value sets.
--
-- Approach: CHECK constraints rather than Postgres ENUM types — keeps the
-- columns flexibly text-typed but rejects bad values at insert time. NULL is
-- still permitted on both columns (backward compat with rows that predate the
-- registration form requiring these fields), but new inserts are validated
-- in the application layer (Zod + required selects) so writes from the
-- registration flow always carry valid values.
--
-- Year value set (per John, 2026-05-09):
--   1L, 1L Rising, 2L, 2L Rising, 3L, 3L Rising, 4L, 4L Rising
-- Enrollment value set:
--   full_time, part_time
--
-- Backfill: the prior LAW_SCHOOL_YEARS list included "4L (part-time)" —
-- map any existing rows with that value to "4L" (the part-time signal now
-- lives in enrollment_status). Prior ENROLLMENT_STATUSES used title-case
-- "Full-Time"/"Part-Time" — map to the underscore form. Also covers a
-- handful of dirty values discovered in the dev DB at apply time:
-- "1l" (lowercase) and "Full time" (space, no hyphen).

-- ── Backfill old values to new format ─────────────────────────────────────
update public.student_profiles
   set law_school_year = '1L'
 where law_school_year = '1l';

update public.student_profiles
   set law_school_year = '4L'
 where law_school_year = '4L (part-time)';

update public.student_profiles
   set enrollment_status = 'full_time'
 where enrollment_status in ('Full-Time', 'Full-time', 'Full time');

update public.student_profiles
   set enrollment_status = 'part_time'
 where enrollment_status in ('Part-Time', 'Part-time', 'Part time');

-- ── Drop existing constraints if they exist (idempotent re-run) ───────────
alter table public.student_profiles
  drop constraint if exists student_profiles_law_school_year_check;

alter table public.student_profiles
  drop constraint if exists student_profiles_enrollment_status_check;

-- ── Add CHECK constraints (NULL allowed for backward compat) ──────────────
alter table public.student_profiles
  add constraint student_profiles_law_school_year_check
  check (
    law_school_year is null
    or law_school_year in (
      '1L', '1L Rising',
      '2L', '2L Rising',
      '3L', '3L Rising',
      '4L', '4L Rising'
    )
  );

alter table public.student_profiles
  add constraint student_profiles_enrollment_status_check
  check (
    enrollment_status is null
    or enrollment_status in ('full_time', 'part_time')
  );
