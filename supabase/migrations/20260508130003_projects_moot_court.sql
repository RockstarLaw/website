-- Project Shop: add moot_court special flag.
-- Date: 2026-05-08
--
-- Mirrors the existing real_world / world_rank_qualifying boolean pattern.
-- Surfaces in the Specials section of the Project Shop filter rail and as a
-- marker chip on cards / detail pages.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS moot_court boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.projects.moot_court IS
  'TRUE when this project is structured as a moot court competition. Used by the Specials filter rail toggle and the marker chip row.';
