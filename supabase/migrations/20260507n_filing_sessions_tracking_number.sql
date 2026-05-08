-- StarBiz: add tracking_number column to filing_sessions.
-- Date: 2026-05-07 (Retrofit R4 recovery)
--
-- The tracking number is a display-only identifier shown on the filing-info
-- interstitial (corefile.exe) and payment page (corenrtn.exe). It is generated
-- on first visit to the filing-info page from the first 12 chars of the session
-- UUID (uppercase, hyphens stripped). The real sequential document number is
-- assigned at receipt time (R6) when the entity is created in the entities table.

ALTER TABLE public.filing_sessions
  ADD COLUMN IF NOT EXISTS tracking_number text;

CREATE INDEX IF NOT EXISTS filing_sessions_tracking_number_idx
  ON public.filing_sessions (tracking_number)
  WHERE tracking_number IS NOT NULL;

COMMENT ON COLUMN public.filing_sessions.tracking_number IS
  'Display-only tracking number shown on filing-info and payment pages. '
  'Derived from session UUID on first visit; real doc number assigned at receipt (R6).';
