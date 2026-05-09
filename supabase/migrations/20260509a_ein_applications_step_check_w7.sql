-- IRS EIN Wizard: fix current_step CHECK constraint to cover all step values
-- used across Slices 1-8.
--
-- Date: 2026-05-09. Slice 9 pre-condition (Option A per John Taddeo).
--
-- Problem: the original constraint in 20260508c_ein_applications.sql was
-- drafted before the real wizard step-names were discovered from the bundle.
-- It contained stale values ('additional_details_2', 'review') and was missing
-- values actively written by the existing actions.ts files:
--
--   W2 identity/actions.ts       → writes 'address'             ✅ already covered
--   W3 address/actions.ts        → writes 'additional_details_1' ✅ already covered
--   W4 additional-details/actions.ts → writes 'activity_and_services' ❌ MISSING
--   W5 activity-and-services/actions.ts → writes 'review_and_submit'  ❌ MISSING
--   W6 review-and-submit/actions.ts    → writes 'ein_assignment'       ❌ MISSING
--
-- Full authoritative set (from codebase audit 2026-05-09):
--   'landing'              – initial state on row creation
--   'legal_structure'      – W1 step name
--   'identity'             – W2 step name
--   'address'              – W3 step name
--   'additional_details_1' – W4 step name (written by W3 advance)
--   'additional_details_2' – kept for backward compatibility (original constraint)
--   'activity_and_services'– W5 step name (written by W4 advance)
--   'review'               – kept for backward compatibility (original constraint)
--   'review_and_submit'    – W6 step name (written by W5 advance)
--   'ein_assignment'       – W7 step name (written by W6 submit)
--   'submitted'            – terminal step value (written by W6 submit)
--   'abandoned'            – terminal step value
--
-- Strategy: dynamically find the existing CHECK constraint on current_step by
-- inspecting pg_constraint, drop it, and add a new one with the full list.
-- This avoids hard-coding the auto-generated constraint name.

DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname
    INTO v_constraint
    FROM pg_constraint
   WHERE conrelid = 'public.ein_applications'::regclass
     AND contype  = 'c'
     AND pg_get_constraintdef(oid) LIKE '%current_step%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.ein_applications DROP CONSTRAINT '
            || quote_ident(v_constraint);
  END IF;
END $$;

ALTER TABLE public.ein_applications
  ADD CONSTRAINT ein_applications_current_step_check
  CHECK (current_step IN (
    'landing',
    'legal_structure',
    'identity',
    'address',
    'additional_details_1',
    'additional_details_2',
    'activity_and_services',
    'review',
    'review_and_submit',
    'ein_assignment',
    'submitted',
    'abandoned'
  ));

-- Update the column comment to reflect the correct step sequence.
COMMENT ON COLUMN public.ein_applications.current_step IS
  'Last wizard step the user reached: landing → legal_structure → identity → '
  'address → additional_details_1 → activity_and_services → review_and_submit → '
  'ein_assignment → submitted. Also accepts: additional_details_2, review (legacy), '
  'abandoned (terminal).';
