-- Replace the plain unique constraint on course_tas with a partial unique index.
-- The plain constraint blocked re-inviting a student after revoke/decline.
-- The partial index only enforces uniqueness on active rows (pending + accepted),
-- allowing a new invite after a row is revoked or declined.

alter table public.course_tas
  drop constraint if exists course_tas_professor_course_id_user_id_key;

create unique index if not exists course_tas_active_unique
  on public.course_tas (professor_course_id, user_id)
  where status in ('pending', 'accepted');
