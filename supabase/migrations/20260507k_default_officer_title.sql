-- StarBiz: default authorized-rep title at the data layer.
-- Date: 2026-05-07
-- When the user-supplied officer title is null/empty, the function now writes
-- a Sunbiz-faithful default (MGRM for member-managed; MGR/AMBR for
-- manager-managed). Detail page and PDF both read entity_officers.title
-- directly with no per-renderer fallback, keeping the two surfaces in sync.
-- Also backfills existing rows.

create or replace function public.create_llc_entity(
  p_user_id uuid,
  p_form    jsonb
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_seq              integer;
  v_prefix           text;
  v_document_number  text;
  v_entity_id        uuid;
  v_filing_id        uuid;
  v_name             text;
  v_name_normalized  text;
  v_officer          jsonb;
  v_now_local        date;
  v_effective_date   date;
  v_constraint_name  text;
  v_mgmt             text;
  v_role             text;
  v_supplied_title   text;
  v_resolved_title   text;
begin
  -- 1. Compute normalized name
  v_name := trim(p_form->>'name');
  v_name_normalized := upper(
    regexp_replace(
      regexp_replace(trim(p_form->>'name'), '\s+', ' ', 'g'),
      '[.,!]+$', '', 'g'
    )
  );

  -- 2. Generate document number atomically
  v_prefix := 'L' || right(extract(year from now())::text, 2);

  insert into public.filing_sequences (prefix, current_val)
  values (v_prefix, 1)
  on conflict (prefix) do update
    set current_val = filing_sequences.current_val + 1
  returning current_val into v_seq;

  v_document_number := v_prefix || lpad(v_seq::text, 8, '0');

  -- Effective date: blank/null → today in America/New_York.
  v_now_local := (now() at time zone 'America/New_York')::date;
  v_effective_date := case
    when p_form->>'effectiveDate' is null or p_form->>'effectiveDate' = ''
    then v_now_local
    else (p_form->>'effectiveDate')::date
  end;

  -- 3. Insert entity row
  begin
    insert into public.entities (
      document_number, entity_type, name, name_normalized, status,
      filed_by_user_id, filed_at, created_at, updated_at,
      governance_structure, effective_date, fei_ein,
      principal_address, mailing_address,
      registered_agent_name, registered_agent_address,
      type_specific_data
    ) values (
      v_document_number,
      'llc',
      v_name,
      v_name_normalized,
      'active',
      p_user_id,
      now(), now(), now(),
      p_form->>'managementStructure',
      v_effective_date,
      nullif(p_form->>'feiEin', ''),
      p_form->'principalAddress',
      p_form->'mailingAddress',
      p_form->>'raName',
      p_form->'raAddress',
      jsonb_build_object(
        'purpose',                   coalesce(nullif(p_form->>'purpose', ''), 'any lawful purpose'),
        'organizer',                 p_form->'organizer',
        'registered_agent_email',    nullif(p_form->>'raEmail', ''),
        'registered_agent_accepted', (p_form->>'raAccepted')::boolean,
        'fee_acknowledged',          (p_form->>'feeAcknowledged')::boolean,
        'fee_cents',                 12500
      )
    ) returning id into v_entity_id;

  exception
    when unique_violation then
      get stacked diagnostics v_constraint_name = constraint_name;
      if v_constraint_name = 'entities_name_normalized_unique' then
        raise exception 'NAME_TAKEN'
          using errcode = 'P0001',
                hint    = 'An entity with this normalized name already exists.';
      end if;
      raise;
  end;

  -- 4. Insert officer rows with default title resolution
  v_mgmt := p_form->>'managementStructure';
  for v_officer in select * from jsonb_array_elements(p_form->'officers')
  loop
    if trim(coalesce(v_officer->>'name', '')) <> '' then
      v_role := case when v_mgmt = 'member-managed' then 'member' else 'manager' end;
      v_supplied_title := nullif(trim(coalesce(v_officer->>'title', '')), '');
      v_resolved_title := coalesce(
        v_supplied_title,
        case
          when v_mgmt = 'member-managed' then 'MGRM'
          when v_mgmt = 'manager-managed' and v_role = 'manager' then 'MGR'
          when v_mgmt = 'manager-managed' then 'AMBR'
          else upper(v_role)
        end
      );

      insert into public.entity_officers (
        entity_id, role, name, title, address, ownership_percent
      ) values (
        v_entity_id,
        v_role,
        v_officer->>'name',
        v_resolved_title,
        jsonb_build_object(
          'street', v_officer->>'street',
          'city',   v_officer->>'city',
          'state',  v_officer->>'state',
          'zip',    v_officer->>'zip'
        ),
        case when v_officer->>'ownershipPct' is null or v_officer->>'ownershipPct' = ''
             then null
             else (v_officer->>'ownershipPct')::numeric end
      );
    end if;
  end loop;

  -- 5. Insert formation filing event
  insert into public.entity_filings (
    entity_id, filing_type, filed_at, filed_by_user_id,
    fee_paid_cents, effective_date, filing_data
  ) values (
    v_entity_id,
    'formation',
    now(),
    p_user_id,
    12500,
    v_effective_date,
    p_form
  ) returning id into v_filing_id;

  -- 6. Return identifiers
  return jsonb_build_object(
    'document_number', v_document_number,
    'entity_id',       v_entity_id,
    'filing_id',       v_filing_id
  );
end;
$$;

-- ─── Backfill ────────────────────────────────────────────────────────────────
-- Populates title on existing rows where it's null/empty, using the same
-- resolution logic as the function. Idempotent (only touches blank rows).

update public.entity_officers o
set title = case
  when e.governance_structure = 'member-managed' then 'MGRM'
  when e.governance_structure = 'manager-managed' and o.role = 'manager' then 'MGR'
  when e.governance_structure = 'manager-managed' then 'AMBR'
  else upper(o.role)
end
from public.entities e
where e.id = o.entity_id
  and (o.title is null or trim(o.title) = '');
