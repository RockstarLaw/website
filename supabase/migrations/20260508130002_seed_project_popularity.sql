-- Project Shop: seed initial popularity / usage_count for featured projects.
-- Date: 2026-05-08
--
-- Per John's instruction, the following six projects are pre-seeded with
-- usage counts so they float to the top of the "Most Popular" / "Most Used"
-- sort orders in the catalog. All other projects remain at 0.
--
-- popularity is set equal to usage_count for now — the two fields are kept
-- in sync until we differentiate (e.g., view-count vs. add-to-library count).
--
-- Idempotent: each UPDATE is keyed by exact title match.

UPDATE public.projects
   SET usage_count = 12, popularity = 12
 WHERE title = 'WHO IS MOON MAN?!!';

UPDATE public.projects
   SET usage_count = 8, popularity = 8
 WHERE title = 'HE STOLE MY JORDANS! NIKE, INC. v. STREET ARTIST KOOL KIY';

UPDATE public.projects
   SET usage_count = 7, popularity = 7
 WHERE title = 'ZOOM SUIT: WORK FOR HIRE AGREEMENTS';

UPDATE public.projects
   SET usage_count = 4, popularity = 4
 WHERE title = 'FRUIT FIGHT 1: The Battle of Valencia';

UPDATE public.projects
   SET usage_count = 4, popularity = 4
 WHERE title = 'NERF NATION ARENA INVESTMENT OPPORTUNITY';

UPDATE public.projects
   SET usage_count = 3, popularity = 3
 WHERE title = $title$THAT'S EATER-TAINMENT: FRANK & DINO's ITALIAN RESTAURANT$title$;
