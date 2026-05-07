-- Allow students to accept or decline their own pending TA invitations.
-- USING: only their own rows, only when currently pending.
-- WITH CHECK: new status must be accepted or declined — no other transitions.

drop policy if exists "students can update own pending ta invitation" on public.course_tas;
create policy "students can update own pending ta invitation"
on public.course_tas
for update
using (
  exists (
    select 1 from public.student_profiles sp
    where sp.id = course_tas.user_id
      and sp.user_id = auth.uid()
  )
  and course_tas.status = 'pending'
)
with check (
  status in ('accepted', 'declined')
);
