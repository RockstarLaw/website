-- DEV/TEST SEED: Enable all 6 modules on all existing courses.
-- Real enablement will be professor-driven through the course management UI.
-- Date: 2026-05-06
-- This cross-product seeds every course with every module for dashboard verification.

insert into public.course_modules (course_id, module_id, enabled_via)
select c.id, m.id, 'auto'
from public.courses c
cross join public.modules m
on conflict (course_id, module_id) do nothing;
