-- Add area_of_law multi-select field to projects table.
-- Date: 2026-05-07

alter table public.projects
  add column if not exists area_of_law text[] not null default '{}';

comment on column public.projects.area_of_law is
  'Multi-select tags for the legal subject matter this project teaches.';
