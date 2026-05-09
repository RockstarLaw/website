-- Slice 10: irs-documents Storage bucket + ein_documents table
-- Applied with: supabase db query --linked < supabase/migrations/20260510a_irs_documents.sql
--
-- Creates the private storage bucket for IRS-module PDFs and the tracking
-- table that links each generated letter back to its ein_applications row.
-- Phase 1 ships CP575G only (most common LLC/Corp/Non-profit EIN confirmation).
-- CP575A/B/E variants land in later slices when those entity-type formation flows ship.

-- ── 1. Storage bucket (private, PDF-only, 10 MB ceiling) ─────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'irs-documents',
  'irs-documents',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. ein_documents tracking table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ein_documents (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ein_application_id  uuid        NOT NULL
                                    REFERENCES public.ein_applications(id)
                                    ON DELETE CASCADE,
  document_kind       text        NOT NULL DEFAULT 'cp575g',
  storage_path        text        NOT NULL,
  file_size_bytes     integer     NOT NULL,
  generated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ein_documents_kind_unique
    UNIQUE (ein_application_id, document_kind)
);

COMMENT ON TABLE public.ein_documents IS
  'Tracks generated IRS letter PDFs linked to ein_applications. '
  'Phase 1: cp575g only. Future: cp575a, cp575b, cp575e, letter_147c.';

COMMENT ON COLUMN public.ein_documents.document_kind IS
  'Identifies the letter type: cp575g (Phase 1), cp575a/b/e (Phase 2+), letter_147c (Phase 4+).';

COMMENT ON COLUMN public.ein_documents.storage_path IS
  'Path within irs-documents bucket. Format: ein/<ein_without_dash>/cp575g.pdf';

-- ── 3. RLS on ein_documents ───────────────────────────────────────────────────
ALTER TABLE public.ein_documents ENABLE ROW LEVEL SECURITY;

-- Authenticated users can SELECT rows for their own applications only.
-- Admin client (service role) bypasses RLS — no additional policy needed for server-side writes.
CREATE POLICY "ein_documents: owner read"
  ON public.ein_documents
  FOR SELECT
  USING (
    ein_application_id IN (
      SELECT id
        FROM public.ein_applications
       WHERE user_id = auth.uid()
    )
  );

-- ── 4. Storage RLS: authenticated users can download their own EIN's PDF ──────
-- Path structure inside bucket: ein/<ein_without_dash>/cp575g.pdf
-- The second path segment is the EIN digits without the dash (e.g. "991234567").
-- Policy checks that segment against the calling user's assigned EINs.
CREATE POLICY "irs-documents: owner read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'irs-documents'
    AND (string_to_array(name, '/'))[2] IN (
      SELECT replace(ein_assigned, '-', '')
        FROM public.ein_applications
       WHERE user_id     = auth.uid()
         AND ein_assigned IS NOT NULL
    )
  );
