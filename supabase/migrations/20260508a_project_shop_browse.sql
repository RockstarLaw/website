-- Project Shop: enable cross-professor catalog browse + commerce columns.
-- Date: 2026-05-08
--
-- The Project Shop (/project-shop) lets any authenticated professor browse
-- the full catalog of projects. Existing RLS only allowed authors to read
-- their own projects + TAs to read projects of professors they TA for.
-- This migration adds:
--   1. price + usage_count columns (Path B — scaffold commerce now)
--   2. SELECT RLS policy granting browse access to any authenticated professor
--   3. Indexes for sort columns

-- ─── 1. Commerce columns ──────────────────────────────────────────────────────

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS price        numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_count  integer       NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.projects.price IS
  'List price for cross-professor purchase via Project Shop. Default 0 (Free) until commerce wiring lands.';

COMMENT ON COLUMN public.projects.usage_count IS
  'Counter incremented when another professor adds this project to their library. Drives "Most/Least Used" sort in Project Shop.';

-- ─── 2. Browse RLS — any authenticated professor can read any project ────────
--
-- Combines (OR) with existing SELECT policies:
--   • "professors can manage their own projects" (FOR ALL — covers own SELECT)
--   • "TAs can read projects of professors they TA for"
-- Net effect: a professor sees own + TA-scope + full catalog browse.
-- Students remain blocked (no professor_profiles row → fails this check, and
-- they have no other SELECT policy on projects).

DROP POLICY IF EXISTS "professors can browse all projects" ON public.projects;
CREATE POLICY "professors can browse all projects"
  ON public.projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professor_profiles pp
      WHERE pp.user_id = auth.uid()
    )
  );

-- ─── 3. Sort indexes ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_projects_price        ON public.projects (price);
CREATE INDEX IF NOT EXISTS idx_projects_usage_count  ON public.projects (usage_count);
CREATE INDEX IF NOT EXISTS idx_projects_popularity   ON public.projects (popularity);
CREATE INDEX IF NOT EXISTS idx_projects_created_at   ON public.projects (created_at);
