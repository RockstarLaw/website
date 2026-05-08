-- StarBiz: filing_sessions table for multi-page Sunbiz chain.
-- Date: 2026-05-07
--
-- Stores transient form state across the 6-page filing chain:
--   disclaimer → form → review → filing-info → payment → receipt → submitted
--
-- The Receipt page finalizes by writing entities + setting status='submitted'.
-- Sessions are permanent records (no DELETE policy) to satisfy spec §32 audit logging.

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE public.filing_sessions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filing_type    text        NOT NULL,
  -- 'llc' | 'corp' | 'nonprofit' | 'lp' | 'dba' | 'annual' | 'trademark'
  current_step   text        NOT NULL DEFAULT 'disclaimer',
  -- 'disclaimer' | 'form' | 'review' | 'filing-info' | 'payment' | 'receipt' | 'submitted' | 'abandoned'
  status         text        NOT NULL DEFAULT 'in_progress',
  -- 'in_progress' | 'submitted' | 'abandoned'
  form_data      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  -- all entered form values, keyed by Sunbiz-style field name (corp_name, princ_addr1, etc.)
  entity_id      uuid        REFERENCES public.entities(id) ON DELETE SET NULL,
  -- populated when Receipt page finalizes the entity
  started_at     timestamptz NOT NULL DEFAULT now(),
  last_saved_at  timestamptz NOT NULL DEFAULT now(),
  submitted_at   timestamptz
);

COMMENT ON TABLE public.filing_sessions IS
  'Transient multi-page filing state for the Sunbiz chain. One row per in-progress or completed filing attempt. Permanent (no DELETE) per audit-log spec §32.';

COMMENT ON COLUMN public.filing_sessions.filing_type  IS 'Entity type being filed: llc, corp, nonprofit, lp, dba, annual, trademark.';
COMMENT ON COLUMN public.filing_sessions.current_step IS 'Last page the user reached: disclaimer, form, review, filing-info, payment, receipt, submitted, abandoned.';
COMMENT ON COLUMN public.filing_sessions.status       IS 'Lifecycle state: in_progress, submitted, abandoned.';
COMMENT ON COLUMN public.filing_sessions.form_data    IS 'All form values keyed by Sunbiz-style field name (corp_name, princ_addr1, ra_name_last_name, etc.).';
COMMENT ON COLUMN public.filing_sessions.entity_id    IS 'FK to entities row, populated when Receipt page finalizes the filing.';

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX filing_sessions_user_id_idx
  ON public.filing_sessions (user_id);

CREATE INDEX filing_sessions_filing_type_idx
  ON public.filing_sessions (filing_type, status);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.filing_sessions ENABLE ROW LEVEL SECURITY;

-- Users see only their own sessions
CREATE POLICY "filing_sessions_select_own"
  ON public.filing_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users insert sessions as themselves
CREATE POLICY "filing_sessions_insert_own"
  ON public.filing_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users update their own in-progress sessions only
CREATE POLICY "filing_sessions_update_own"
  ON public.filing_sessions
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'in_progress');

-- No DELETE policy — sessions are permanent audit records (spec §32)

-- ─── Trigger: auto-update last_saved_at on every UPDATE ──────────────────────

CREATE OR REPLACE FUNCTION public.touch_filing_session_last_saved()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_saved_at := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.touch_filing_session_last_saved IS
  'Keeps filing_sessions.last_saved_at current on every UPDATE.';

CREATE TRIGGER filing_sessions_touch_last_saved
  BEFORE UPDATE ON public.filing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_filing_session_last_saved();
