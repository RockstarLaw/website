-- StarBiz: create_profit_corp_entity stored procedure.
-- Date: 2026-05-07
--
-- Atomic Florida Profit Corporation formation:
--   • Generates P26xxxxxxxx document number from the shared filing_sequences table.
--   • Inserts entity row (entity_type = 'corp').
--   • Inserts director rows (role = 'director'; title defaults to 'DIR').
--   • Inserts officer rows  (role = 'officer';  title defaults to 'OFCR').
--   • Inserts formation filing event.
--   • Returns {document_number, entity_id, filing_id}.
--
-- Raises P0001/NAME_TAKEN on normalized-name collision (same logic as LLC).

create or replace function public.create_profit_corp_entity(
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
  v_now_local        date;
  v_effective_date   date;
  v_constraint_name  text;
  v_director         jsonb;
  v_officer          jsonb;
  v_shares_authorized bigint;
  v_par_value_cents  bigint;
begin
  -- 1. Normalized name
  v_name := trim(p_form->>'name');
  v_name_normalized := upper(
    regexp_replace(
      regexp_replace(trim(p_form->>'name'), '\s+', ' ', 'g'),
      '[.,!]+$', '', 'g'
    )
  );

  -- 2. Generate P26xxxxxxxx document number atomically
  v_prefix := 'P' || right(extract(year from now())::text, 2);

  insert into public.filing_sequences (prefix, current_val)
  values (v_prefix, 1)
  on conflict (prefix) do update
    set current_val = filing_sequences.current_val + 1
  returning current_val into v_seq;

  v_document_number := v_prefix || lpad(v_seq::text, 8, '0');

  -- 3. Effective date (ET local, matching LLC behaviour)
  v_now_local := (now() at time zone 'America/New_York')::date;
  v_effective_date := case
    when p_form->>'effectiveDate' is null or p_form->>'effectiveDate' = ''
    then v_now_local
    else (p_form->>'effectiveDate')::date
  end;

  -- 4. Shares authorized
  v_shares_authorized := (p_form->>'sharesAuthorized')::bigint;

  -- 5. Par value: blank / '0' / null → null (no par value)
  v_par_value_cents := case
    when p_form->>'parValueDollars' is null
      or trim(p_form->>'parValueDollars') = ''
      or trim(p_form->>'parValueDollars') = '0'
    then null
    else round((p_form->>'parValueDollars')::numeric * 100)::bigint
  end;

  -- 6. Insert entity row
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
      'corp',
      v_name,
      v_name_normalized,
      'active',
      p_user_id,
      now(), now(), now(),
      null,                           -- corporations have no member/manager-managed flag
      v_effective_date,
      nullif(trim(coalesce(p_form->>'feiEin', '')), ''),
      p_form->'principalAddress',
      p_form->'mailingAddress',
      p_form->>'raName',
      p_form->'raAddress',
      jsonb_build_object(
        'purpose',                    coalesce(nullif(trim(p_form->>'purpose'), ''), 'any lawful purpose'),
        'shares_authorized',          v_shares_authorized,
        'par_value_cents',            v_par_value_cents,
        'share_class_name',           coalesce(nullif(trim(p_form->>'shareClassName'), ''), 'Common'),
        'incorporator',               p_form->'incorporator',
        'registered_agent_email',     nullif(trim(coalesce(p_form->>'raEmail', '')), ''),
        'registered_agent_accepted',  (p_form->>'raAccepted')::boolean,
        'fee_acknowledged',           (p_form->>'feeAcknowledged')::boolean,
        'fee_cents',                  7000
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

  -- 7. Insert director rows (role = 'director'; blank title → 'DIR')
  for v_director in select * from jsonb_array_elements(p_form->'directors')
  loop
    if trim(coalesce(v_director->>'name', '')) <> '' then
      insert into public.entity_officers (
        entity_id, role, name, title, address, ownership_percent
      ) values (
        v_entity_id,
        'director',
        trim(v_director->>'name'),
        coalesce(nullif(trim(coalesce(v_director->>'title', '')), ''), 'DIR'),
        jsonb_build_object(
          'street', trim(coalesce(v_director->>'street', '')),
          'city',   trim(coalesce(v_director->>'city',   '')),
          'state',  upper(trim(coalesce(v_director->>'state', ''))),
          'zip',    trim(coalesce(v_director->>'zip',    ''))
        ),
        null
      );
    end if;
  end loop;

  -- 8. Insert officer rows (role = 'officer'; blank title → 'OFCR')
  for v_officer in select * from jsonb_array_elements(coalesce(p_form->'officers', '[]'::jsonb))
  loop
    if trim(coalesce(v_officer->>'name', '')) <> '' then
      insert into public.entity_officers (
        entity_id, role, name, title, address, ownership_percent
      ) values (
        v_entity_id,
        'officer',
        trim(v_officer->>'name'),
        coalesce(nullif(trim(coalesce(v_officer->>'title', '')), ''), 'OFCR'),
        jsonb_build_object(
          'street', trim(coalesce(v_officer->>'street', '')),
          'city',   trim(coalesce(v_officer->>'city',   '')),
          'state',  upper(trim(coalesce(v_officer->>'state', ''))),
          'zip',    trim(coalesce(v_officer->>'zip',    ''))
        ),
        null
      );
    end if;
  end loop;

  -- 9. Insert formation filing event
  insert into public.entity_filings (
    entity_id, filing_type, filed_at, filed_by_user_id,
    fee_paid_cents, effective_date, filing_data
  ) values (
    v_entity_id,
    'formation',
    now(),
    p_user_id,
    7000,
    v_effective_date,
    p_form
  ) returning id into v_filing_id;

  -- 10. Return identifiers
  return jsonb_build_object(
    'document_number', v_document_number,
    'entity_id',       v_entity_id,
    'filing_id',       v_filing_id
  );
end;
$$;

grant execute on function public.create_profit_corp_entity(uuid, jsonb) to authenticated;

comment on function public.create_profit_corp_entity is
  'Atomic Florida Profit Corporation formation: generates P26xxxxxxxx document number, inserts entities/directors/officers/filings in one transaction. Raises P0001/NAME_TAKEN on duplicate normalized name.';
