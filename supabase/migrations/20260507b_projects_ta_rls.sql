-- Slice B: additive TA SELECT access to projects and storage.
-- Date: 2026-05-07
-- Existing professor full-access policy preserved. These policies are additive (OR logic).

-- ─── projects table: TA SELECT ────────────────────────────────────────────────

drop policy if exists "TAs can read projects of professors they TA for"
  on public.projects;
create policy "TAs can read projects of professors they TA for"
on public.projects for select
using (
  exists (
    select 1
    from public.course_tas ct
    join public.professor_courses pc on pc.id = ct.professor_course_id
    join public.student_profiles sp on sp.id = ct.user_id
    where sp.user_id = auth.uid()
      and ct.status = 'accepted'
      and pc.professor_id = projects.professor_id
  )
);

-- ─── storage.objects: TA SELECT ───────────────────────────────────────────────
-- Path scheme: {professor_id}/{timestamp}-{filename}
-- TA can SELECT objects whose path prefix matches a professor they TA for.

drop policy if exists "TAs can read own assigned project files" on storage.objects;
create policy "TAs can read own assigned project files"
on storage.objects for select
using (
  bucket_id = 'projects'
  and exists (
    select 1
    from public.course_tas ct
    join public.professor_courses pc on pc.id = ct.professor_course_id
    join public.professor_profiles pp on pp.id = pc.professor_id
    join public.student_profiles sp on sp.id = ct.user_id
    where sp.user_id = auth.uid()
      and ct.status = 'accepted'
      and name like pp.id::text || '/%'
  )
);
