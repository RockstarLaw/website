-- StarBiz: create_llc_entity timezone fix.
-- Date: 2026-05-07
-- Bug: default effective_date was computed via current_date in UTC, so filings
--      late in the day (ET) recorded an effective_date one calendar day ahead
--      of the ET filing date. Fix: resolve the default in America/New_York.
-- Existing rows are left as-is (data, not code). Function body otherwise
-- unchanged from 20260507h_llc_formation.sql.

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
begin
  -- 1. Compute normalized name (UPPER, collapse whitespace, strip trailing punctuation)
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

  -- Effective date: blank / null → today in America/New_York (parody is FL-based).
  v_now_local := (now() at time zone 'America/New_York')::date;
  v_effective_date := case
    when p_form->>'effectiveDate' is null or p_form->>'effectiveDate' = ''
    then v_now_local
    else (p_form->>'effectiveDate')::date
  end;

  -- 3. Insert entity row (unique name constraint catches duplicates)
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

  -- 4. Insert officer rows
  for v_officer in select * from jsonb_array_elements(p_form->'officers')
  loop
    if trim(coalesce(v_officer->>'name', '')) <> '' then
      insert into public.entity_officers (
        entity_id, role, name, title, address, ownership_percent
      ) values (
        v_entity_id,
        case when p_form->>'managementStructure' = 'member-managed'
             then 'member' else 'manager' end,
        v_officer->>'name',
        nullif(trim(coalesce(v_officer->>'title', '')), ''),
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
