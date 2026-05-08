-- Project Shop: professor_project_library junction + RLS for library file access.
-- Date: 2026-05-08
--
-- Adds the "downloaded / library" semantics for the Project Shop. When a
-- professor clicks "Add to My Projects" on a project they didn't author,
-- a row is inserted here. The MY PROJECTS dashboard widget reads from both
-- public.projects (authored) and this junction (library) to compose the
-- professor's full set.
--
-- Library entries are pointers, not copies. A library-holder reads the
-- same images / files the author owns, gated by new RLS rules below.

-- ─── 1. Junction table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.professor_project_library (
  professor_id  uuid        NOT NULL REFERENCES public.professor_profiles(id) ON DELETE CASCADE,
  project_id    uuid        NOT NULL REFERENCES public.projects(id)           ON DELETE CASCADE,
  added_at      timestamptz NOT NULL DEFAULT timezone('utc', now()),
  status        text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'archived')),
  launched_at   timestamptz,
  PRIMARY KEY (professor_id, project_id)
);

COMMENT ON TABLE public.professor_project_library IS
  'Library entries — projects a professor has added (downloaded) from the Project Shop. Pointer to public.projects, not a copy.';
COMMENT ON COLUMN public.professor_project_library.status IS
  'active = visible in MY PROJECTS. archived = hidden from main view but kept for history.';
COMMENT ON COLUMN public.professor_project_library.launched_at IS
  'When the library-holder first launched this project for a course. Null if never launched.';

CREATE INDEX IF NOT EXISTS idx_ppl_professor_id   ON public.professor_project_library (professor_id);
CREATE INDEX IF NOT EXISTS idx_ppl_project_id     ON public.professor_project_library (project_id);
CREATE INDEX IF NOT EXISTS idx_ppl_status_active  ON public.professor_project_library (professor_id) WHERE status = 'active';

-- ─── 2. RLS on the junction itself ───────────────────────────────────────────

ALTER TABLE public.professor_project_library ENABLE ROW LEVEL SECURITY;

-- Professors see only their own library
DROP POLICY IF EXISTS "professors can read their own library" ON public.professor_project_library;
CREATE POLICY "professors can read their own library"
  ON public.professor_project_library
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professor_profiles pp
      WHERE pp.id = professor_project_library.professor_id
        AND pp.user_id = auth.uid()
    )
  );

-- Professors insert library entries for themselves only
DROP POLICY IF EXISTS "professors can add to their own library" ON public.professor_project_library;
CREATE POLICY "professors can add to their own library"
  ON public.professor_project_library
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professor_profiles pp
      WHERE pp.id = professor_project_library.professor_id
        AND pp.user_id = auth.uid()
    )
  );

-- Professors delete (remove from library) their own entries only
DROP POLICY IF EXISTS "professors can remove from their own library" ON public.professor_project_library;
CREATE POLICY "professors can remove from their own library"
  ON public.professor_project_library
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.professor_profiles pp
      WHERE pp.id = professor_project_library.professor_id
        AND pp.user_id = auth.uid()
    )
  );

-- Professors update their own entries (e.g., launched_at, status)
DROP POLICY IF EXISTS "professors can update their own library entries" ON public.professor_project_library;
CREATE POLICY "professors can update their own library entries"
  ON public.professor_project_library
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.professor_profiles pp
      WHERE pp.id = professor_project_library.professor_id
        AND pp.user_id = auth.uid()
    )
  );

-- ─── 3. RLS — library-holders can read project_files for projects they hold ──

DROP POLICY IF EXISTS "library holders can read project files" ON public.project_files;
CREATE POLICY "library holders can read project files"
  ON public.project_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.professor_project_library ppl
      INNER JOIN public.professor_profiles pp ON pp.id = ppl.professor_id
      WHERE ppl.project_id = project_files.project_id
        AND ppl.status = 'active'
        AND pp.user_id = auth.uid()
    )
  );

-- ─── 4. Storage RLS — library-holders can read files in projects bucket ──────

DROP POLICY IF EXISTS "library holders can read project storage files" ON storage.objects;
CREATE POLICY "library holders can read project storage files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'projects'
    AND EXISTS (
      SELECT 1
      FROM public.professor_project_library ppl
      INNER JOIN public.professor_profiles pp ON pp.id = ppl.professor_id
      WHERE ppl.status = 'active'
        AND pp.user_id = auth.uid()
        AND name LIKE ppl.project_id::text || '/%'
    )
  );

-- ─── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON POLICY "library holders can read project files"
  ON public.project_files IS
  'Grants SELECT access to project_files rows for any professor whose library contains the project (status=active). Combines OR with the existing author + TA SELECT policies.';

COMMENT ON POLICY "library holders can read project storage files"
  ON storage.objects IS
  'Grants SELECT access to projects-bucket storage objects for any library-holder of the corresponding project_id. Path prefix gating: <project_id>/...';
