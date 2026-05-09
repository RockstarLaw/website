/**
 * IRS EIN Wizard — Additional Details step entity-type configuration
 *
 * Source: irs-captures/js/index-ChwXuGQH.js
 *
 * Every value is a JSON schema key reference (e.g. legalNameKey: "legalName5InputControl"),
 * never a literal label string. Labels live in irs-captures/json/ein__additionalDetails.json.
 *
 * Gating functions extracted verbatim from the bundle:
 *   ya  — legalName field key selector
 *   fs  — startDate label key selector
 *   bo  — DBA field gate          (false = not shown)
 *   To  — legalName read-only gate (false = read-only; true = editable input)
 *   cs  — employees question variant gate
 *   li  — trucking/gambling/ATF section gate
 *   us  — closing month gate
 *   ds  — household employees subfield gate
 *   ma  — W2 submission gate (used in persistence, not just rendering)
 *
 * SLICE 1 SCOPE: SINGLE_MEMBER_LLC only.
 * Other entity types deferred to Slice 3 pending pixel-confirmed HTML captures.
 */

export type AdditionalDetailsEntityConfig = {
  // ── Section 1: Tell us about the org ──────────────────────────────────────
  /** schema key for legal name field def (ya function) */
  legalNameKey: string;
  /** false = read-only display, true = editable TextInput (To function) */
  legalNameEditable: boolean;
  /** whether to render the DBA field (bo function) */
  showDba: boolean;
  /** schema key for dba field def */
  dbaKey: "dbaNameInputControl" | "dba2NameInputControl";
  /** schema key for county field def */
  countyKey: "countyInputControl" | "estateCountyInputControl";
  /** schema key for state-location dropdown field def */
  stateLocationKey: "stateLocationInputControl" | "estateStateLocationInputControl";
  /** schema key for state articles filed dropdown, or null if not shown */
  stateArticlesKey: "stateArticlesOrganizationFiledInputControl" | "stateArticlesIncorporationFiledInputControl" | null;
  /** schema key for the start-date label (fieldName + additionalText) */
  startDateLabelKey: "defaultStartDate" | "withholdingTaxStartDate" | "estateStartDate" | "corpStartDate" | "trustStartDate" | "businessStartDate" | "bankruptcyStartDate";
  /** whether to render the closing month dropdown (us function) */
  showClosingMonth: boolean;
  /** entity-specific unique field key, or null if none (special field gate) */
  specialFieldKey: string | null;
  /** HTML inputName for the special field */
  specialFieldInputName: string | null;

  // ── Section 2: Tell us more about the org ─────────────────────────────────
  /** whether to show trucking/gambling/excise/ATF radios (li function) */
  showTruckingGamblingAtf: boolean;
  /** schema key for employees question, or null if not shown (REMIC) */
  employeesQuestionKey: "provideW2FormInputControl" | "haveEmployeesInputControl" | null;
  /** helptip key for employees question, or null if no helptip (haveEmployees variant) */
  employeesHelptipKey: "provideW2FormHelp" | null;

  // ── Section 3 (W4b): Describe your employees ──────────────────────────────
  /** whether to show household employees count subfield (ds function) */
  showHouseholdEmployees: boolean;

  // ── Template substitution ─────────────────────────────────────────────────
  /** substituted into {{entityName}} in field labels */
  entityName: string;
  /** substituted into {{tellUsAboutOrgLabel}} in section header */
  tellUsAboutOrgLabel: string;
};

export const ENTITY_CONFIG: Partial<Record<string, AdditionalDetailsEntityConfig>> = {
  /**
   * SINGLE_MEMBER_LLC
   *
   * ya(SINGLE_MEMBER_LLC) → "legalName5InputControl"
   * To(SINGLE_MEMBER_LLC) → true  (editable)
   * bo(SINGLE_MEMBER_LLC) → true  (DBA shown)
   * ESTATE? → false  → county/stateLocation use standard keys
   * isLlcType → true → stateArticles = Organization variant
   * fs(SINGLE_MEMBER_LLC) → defaultStartDate (not in any special branch)
   * us(SINGLE_MEMBER_LLC) → false (not in closing month set)
   * specialField → none
   * li(SINGLE_MEMBER_LLC) → true (not in trucking exclusion set)
   * cs(SINGLE_MEMBER_LLC) → true (provideW2Form variant)
   * ds(SINGLE_MEMBER_LLC) → false (not in household employees set)
   *
   * entityName / tellUsAboutOrgLabel: sourced from Additional Details 1 HTML capture
   */
  SINGLE_MEMBER_LLC: {
    legalNameKey:          "legalName5InputControl",
    legalNameEditable:     true,
    showDba:               true,
    dbaKey:                "dbaNameInputControl",
    countyKey:             "countyInputControl",
    stateLocationKey:      "stateLocationInputControl",
    stateArticlesKey:      "stateArticlesOrganizationFiledInputControl",
    startDateLabelKey:     "defaultStartDate",
    showClosingMonth:      false,
    specialFieldKey:       null,
    specialFieldInputName: null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:  "provideW2FormInputControl",
    employeesHelptipKey:   "provideW2FormHelp",
    showHouseholdEmployees: false,
    entityName:            "Single Member Limited Liability Company (LLC)",
    tellUsAboutOrgLabel:   "Limited Liability Company (LLC)",
  },

  /**
   * MULTI_MEMBER_LLC
   *
   * ya(MULTI_MEMBER_LLC) → "legalName6InputControl"
   * To(MULTI_MEMBER_LLC) → true  (editable)
   * bo(MULTI_MEMBER_LLC) → true  (DBA shown)
   * isLlcType            → true  → stateArticles = Organization variant
   * fs(MULTI_MEMBER_LLC) → defaultStartDate (falls through all fs branches to default)
   * us(MULTI_MEMBER_LLC) → false (not in closing month set)
   * specialField         → none
   * li(MULTI_MEMBER_LLC) → true  (not in trucking/gambling/ATF exclusion set)
   * cs(MULTI_MEMBER_LLC) → true  (provideW2Form variant — same as SMLLC)
   * ds(MULTI_MEMBER_LLC) → false (not in household employees set)
   *
   * entityName:          verbatim from irs-captures/json/ein__glossary.json
   *                        → glossaryTerms.multiMemberLLC.title
   * tellUsAboutOrgLabel: same as SMLLC (both are LLC type)
   *
   * Key structural delta vs SMLLC:
   *   legalNameKey → "legalName6InputControl" (forbidden endings: 'Corp','Inc' only; no 'PA')
   *   All other fields — identical config to SMLLC.
   */
  MULTI_MEMBER_LLC: {
    legalNameKey:            "legalName6InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        "stateArticlesOrganizationFiledInputControl",
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Multi-Member Limited Liability Company (LLC)",
    tellUsAboutOrgLabel:     "Limited Liability Company (LLC)",
  },
};
