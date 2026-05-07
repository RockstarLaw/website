-- StarBiz: filing_documents metadata columns + entity FK
-- Date: 2026-05-07
-- Adds first-class columns the PDF generation flow inserts into.

alter table public.filing_documents
  add column if not exists entity_id uuid references public.entities(id) on delete cascade,
  add column if not exists original_filename text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint;

create index if not exists idx_filing_documents_entity_kind
  on public.filing_documents(entity_id, document_kind);

comment on column public.filing_documents.entity_id is
  'Denormalized FK to entities for direct lookup from the entity detail page.';
comment on column public.filing_documents.original_filename is
  'Filename portion of storage_path (e.g. articles_of_organization.pdf).';
comment on column public.filing_documents.mime_type is
  'Content type recorded at upload time (e.g. application/pdf).';
comment on column public.filing_documents.file_size_bytes is
  'Size in bytes recorded at upload time. Useful for UI hints and diagnostics.';
