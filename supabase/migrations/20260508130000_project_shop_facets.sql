-- Project Shop: faceted-search dimensions (industries + courses + tags)
-- Date: 2026-05-08
--
-- Adds three new filter dimensions on top of the existing area_of_law field:
--   1. industries text[] — multi-select from a managed list (~20 items)
--      e.g., "Footwear & Sneakers", "Music", "Film & TV"
--   2. tags text[] — free-form keywords, no validation
--      e.g., "nike", "negotiation roleplay", "sneaker culture"
--   3. project_courses junction — many-to-many link to existing courses
--      table, supports autocomplete tagging by course name
--
-- Catalog filter rail will expose all three as independent filter sections,
-- each multi-select. A project is tagged across all four dimensions
-- (Areas of Law / Industries / Courses / Tags); each dimension is
-- independently filterable.

-- ─── 1. New columns on projects ───────────────────────────────────────────────

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS tags       text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.projects.industries IS
  'Multi-select industry / subject-matter tags. Validated against the INDUSTRIES constant in src/lib/projects/industries.ts. Examples: "Footwear & Sneakers", "Music", "Film & TV".';

COMMENT ON COLUMN public.projects.tags IS
  'Free-form keyword tags. No validation. Used for ad-hoc search dimensions the canonical lists do not cover.';

-- GIN indexes for array contains/overlaps queries
CREATE INDEX IF NOT EXISTS idx_projects_industries ON public.projects USING gin (industries);
CREATE INDEX IF NOT EXISTS idx_projects_tags       ON public.projects USING gin (tags);

-- ─── 2. project_courses junction (many-to-many to courses table) ─────────────

CREATE TABLE IF NOT EXISTS public.project_courses (
  project_id uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  course_id  uuid        NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  added_at   timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (project_id, course_id)
);

COMMENT ON TABLE public.project_courses IS
  'Junction linking projects to specific law school courses (from public.courses). Supports autocomplete tagging — author types a course name and the system matches against the courses table.';

CREATE INDEX IF NOT EXISTS idx_project_courses_project_id ON public.project_courses (project_id);
CREATE INDEX IF NOT EXISTS idx_project_courses_course_id  ON public.project_courses (course_id);

-- ─── 3. RLS — project_courses junction ───────────────────────────────────────

ALTER TABLE public.project_courses ENABLE ROW LEVEL SECURITY;

-- Browse: any authenticated professor can read all course tags
DROP POLICY IF EXISTS "professors can browse all project_courses" ON public.project_courses;
CREATE POLICY "professors can browse all project_courses"
  ON public.project_courses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professor_profiles pp
      WHERE pp.user_id = auth.uid()
    )
  );

-- Anonymous browse — Project Shop pages are public per §2A clarification
DROP POLICY IF EXISTS "anonymous can browse all project_courses" ON public.project_courses;
CREATE POLICY "anonymous can browse all project_courses"
  ON public.project_courses
  FOR SELECT
  USING (true);

-- Authors can manage their own project's course tags
DROP POLICY IF EXISTS "authors can manage their project_courses" ON public.project_courses;
CREATE POLICY "authors can manage their project_courses"
  ON public.project_courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      INNER JOIN public.professor_profiles pp ON pp.id = p.professor_id
      WHERE p.id = project_courses.project_id
        AND pp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      INNER JOIN public.professor_profiles pp ON pp.id = p.professor_id
      WHERE p.id = project_courses.project_id
        AND pp.user_id = auth.uid()
    )
  );

-- ─── 4. Anonymous browse on projects (catalog is public) ─────────────────────
-- Update existing browse RLS to ALSO allow anonymous viewers (the §2A
-- clarification said Project Shop pages are public — anonymous visitors
-- browse without signing in)

DROP POLICY IF EXISTS "anonymous can browse all projects" ON public.projects;
CREATE POLICY "anonymous can browse all projects"
  ON public.projects
  FOR SELECT
  USING (true);

-- ─── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON POLICY "anonymous can browse all projects" ON public.projects IS
  'Per SESSION_HANDOFF.md §2A — Project Shop catalog/detail/author pages are PUBLIC. Anonymous visitors can browse without signing in. Action gating (Add to MY PROJECTS, downloads) is at the application layer, not RLS.';
