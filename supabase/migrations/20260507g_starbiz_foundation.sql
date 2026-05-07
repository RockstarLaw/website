-- StarBiz foundation: 4 tables supporting all 7 Florida filing types
-- + starbiz-documents storage bucket RLS.
-- Date: 2026-05-07
-- Filing types: LLC, Corporation, Non-Profit Corp, LP, Fictitious Name, Annual Report, State Trademark

-- ─── entities ─────────────────────────────────────────────────────────────────

create table if not exists public.entities (
  id                       uuid primary key default gen_random_uuid(),
  document_number          text unique,          -- generated on submission (Slice 2)
  entity_type              text not null
                             check (entity_type in (
                               'llc', 'corp', 'nonprofit_corp', 'lp', 'dba', 'trademark'
                             )),
  name                     text not null,
  status                   text not null default 'active'
                             check (status in (
                               'active', 'inactive', 'dissolved',
                               'admin_dissolved', 'withdrawn', 'expired'
                             )),
  filed_at                 timestamptz default timezone('utc', now()),
  filed_by_user_id         uuid references auth.users(id) on delete set null,
  type_specific_data       jsonb not null default '{}'::jsonb,
  fei_ein                  text,
  effective_date           date,
  expiration_date          date,
  registered_agent_name    text,
  registered_agent_address jsonb,
  principal_address        jsonb,
  mailing_address          jsonb,
  governance_structure     text,     -- 'member-managed','manager-managed','board-of-directors'
  shares_authorized        bigint,   -- corps, non-profits
  par_value                numeric(12,4),
  purpose                  text,     -- non-profits
  created_at               timestamptz not null default timezone('utc', now()),
  updated_at               timestamptz not null default timezone('utc', now())
);

create or replace trigger set_updated_at_entities
before update on public.entities
for each row execute function public.set_updated_at();

-- ─── entity_officers ──────────────────────────────────────────────────────────

create table if not exists public.entity_officers (
  id                uuid primary key default gen_random_uuid(),
  entity_id         uuid not null references public.entities(id) on delete cascade,
  role              text not null
                      check (role in (
                        'member', 'manager', 'director', 'officer', 'president',
                        'vp', 'secretary', 'treasurer', 'general_partner',
                        'limited_partner', 'registered_agent'
                      )),
  name              text not null,
  title             text,
  address           jsonb,
  ownership_percent numeric(5,2),
  shares_held       bigint,
  effective_from    date,
  effective_to      date    -- null = currently serving
);

-- ─── entity_filings ───────────────────────────────────────────────────────────

create table if not exists public.entity_filings (
  id               uuid primary key default gen_random_uuid(),
  entity_id        uuid not null references public.entities(id) on delete cascade,
  filing_type      text not null
                     check (filing_type in (
                       'formation', 'amendment', 'annual_report', 'dissolution',
                       'reinstatement', 'merger', 'conversion', 'withdrawal',
                       'trademark_renewal'
                     )),
  filed_at         timestamptz not null default timezone('utc', now()),
  filed_by_user_id uuid references auth.users(id) on delete set null,
  filing_year      integer,        -- for annual reports
  fee_paid_cents   integer,        -- simulated fee
  effective_date   date,
  filing_data      jsonb not null default '{}'::jsonb
);

-- ─── filing_documents ─────────────────────────────────────────────────────────

create table if not exists public.filing_documents (
  id                uuid primary key default gen_random_uuid(),
  filing_id         uuid not null references public.entity_filings(id) on delete cascade,
  document_kind     text not null
                      check (document_kind in (
                        'articles_of_organization', 'articles_of_incorporation',
                        'certificate_of_status', 'annual_report', 'dba_certificate',
                        'trademark_registration', 'dissolution_certificate',
                        'amendment_certificate'
                      )),
  storage_path      text not null,
  generated_at      timestamptz not null default timezone('utc', now()),
  document_metadata jsonb not null default '{}'::jsonb
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_entities_name
  on public.entities(name);
create index if not exists idx_entities_document_number
  on public.entities(document_number);
create index if not exists idx_entities_type_status
  on public.entities(entity_type, status);
create index if not exists idx_entities_filed_by
  on public.entities(filed_by_user_id);
create index if not exists idx_entity_officers_entity_id
  on public.entity_officers(entity_id);
create index if not exists idx_entity_filings_entity_id
  on public.entity_filings(entity_id);
create index if not exists idx_filing_documents_filing_id
  on public.filing_documents(filing_id);

-- ─── RLS — entities ───────────────────────────────────────────────────────────

alter table public.entities enable row level security;

drop policy if exists "authenticated users can read entities" on public.entities;
create policy "authenticated users can read entities"
on public.entities for select
using (auth.uid() is not null);

drop policy if exists "authenticated users can file entities" on public.entities;
create policy "authenticated users can file entities"
on public.entities for insert
with check (auth.uid() is not null);

-- Edits only by the original filer (draft corrections before submission window)
drop policy if exists "filer can update their entity" on public.entities;
create policy "filer can update their entity"
on public.entities for update
using (filed_by_user_id = auth.uid())
with check (filed_by_user_id = auth.uid());

-- ─── RLS — entity_officers ────────────────────────────────────────────────────

alter table public.entity_officers enable row level security;

drop policy if exists "authenticated users can read officers" on public.entity_officers;
create policy "authenticated users can read officers"
on public.entity_officers for select
using (auth.uid() is not null);

drop policy if exists "entity filer can manage officers" on public.entity_officers;
create policy "entity filer can manage officers"
on public.entity_officers for all
using (
  exists (
    select 1 from public.entities e
    where e.id = entity_officers.entity_id
      and e.filed_by_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.entities e
    where e.id = entity_officers.entity_id
      and e.filed_by_user_id = auth.uid()
  )
);

-- ─── RLS — entity_filings ─────────────────────────────────────────────────────

alter table public.entity_filings enable row level security;

drop policy if exists "authenticated users can read filings" on public.entity_filings;
create policy "authenticated users can read filings"
on public.entity_filings for select
using (auth.uid() is not null);

drop policy if exists "entity filer can create filings" on public.entity_filings;
create policy "entity filer can create filings"
on public.entity_filings for insert
with check (
  exists (
    select 1 from public.entities e
    where e.id = entity_filings.entity_id
      and e.filed_by_user_id = auth.uid()
  )
);

-- ─── RLS — filing_documents ───────────────────────────────────────────────────

alter table public.filing_documents enable row level security;

drop policy if exists "authenticated users can read filing documents" on public.filing_documents;
create policy "authenticated users can read filing documents"
on public.filing_documents for select
using (auth.uid() is not null);

drop policy if exists "entity filer can create filing documents" on public.filing_documents;
create policy "entity filer can create filing documents"
on public.filing_documents for insert
with check (
  exists (
    select 1 from public.entity_filings ef
    join public.entities e on e.id = ef.entity_id
    where ef.id = filing_documents.filing_id
      and e.filed_by_user_id = auth.uid()
  )
);

-- ─── Storage RLS — starbiz-documents bucket ───────────────────────────────────
-- Public corpus: any authenticated user can read.
-- Admin client handles all writes from server actions (bypasses RLS);
-- these policies are belt-and-suspenders for future client-side access.

drop policy if exists "authenticated users can read starbiz documents" on storage.objects;
create policy "authenticated users can read starbiz documents"
on storage.objects for select
using (
  bucket_id = 'starbiz-documents'
  and auth.uid() is not null
);

drop policy if exists "authenticated users can upload starbiz documents" on storage.objects;
create policy "authenticated users can upload starbiz documents"
on storage.objects for insert
with check (
  bucket_id = 'starbiz-documents'
  and auth.uid() is not null
);

-- ─── Comments ─────────────────────────────────────────────────────────────────

comment on table public.entities is
  'StarBiz master entity records. Supports 7 filing types via entity_type enum + JSONB type_specific_data.';
comment on table public.entity_officers is
  'Officers, members, managers, partners, and registered agents for StarBiz entities.';
comment on table public.entity_filings is
  'Filing events against entities (formation, amendment, annual report, dissolution, etc.).';
comment on table public.filing_documents is
  'Generated PDF documents for StarBiz filings, stored in the starbiz-documents bucket.';
