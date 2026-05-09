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
 * Slice 5: all non-LLC entity types added (SOLE_PROPRIETOR through GNMA).
 * entity_type → county/stateLocation ESTATE variant decoded from bundle `ga`/`yo` validators.
 * entityName / tellUsAboutOrgLabel: gap-fill per SS-4 instructions + IRS Pub 1635
 *   (shared:entityTypes namespace not captured; prose IRS sources are valid per HR#1).
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

  // ─────────────────────────────────────────────────────────────────────────
  // NON-LLC ENTITY TYPES  (Slice 5)
  // All gating function values decoded verbatim from bundle (ya/To/bo/us/ma/li/cs/ds/fs).
  // entityName / tellUsAboutOrgLabel: IRS SS-4 instructions + IRS Pub 1635 gap-fill.
  // specialFieldKey / specialFieldInputName: null throughout (Slice 5b scope).
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * SOLE_PROPRIETOR
   * ya→legalName1  To→false(read-only)  bo→true  us→false  li→true
   * cs→true(provideW2)  ds→true(household)  ma→true  fs→default
   */
  SOLE_PROPRIETOR: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       false,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  true,
    entityName:              "Sole Proprietor",
    tellUsAboutOrgLabel:     "Sole Proprietor",
  },

  /**
   * HOUSEHOLD_EMPLOYER
   * ya→legalName1  To→false  bo→false  us→false  li→true
   * ma→false(employees section hidden)  ds→true  fs→default
   */
  HOUSEHOLD_EMPLOYER: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       false,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    null,
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Household Employer",
    tellUsAboutOrgLabel:     "Household Employer",
  },

  /**
   * PARTNERSHIP
   * ya→legalName4  To→true  bo→true  us→true(closingMonth)  li→true
   * cs→true(provideW2)  ds→false  ma→true  fs→default
   */
  PARTNERSHIP: {
    legalNameKey:            "legalName4InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        true,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Partnership",
    tellUsAboutOrgLabel:     "Partnership",
  },

  /**
   * JOINT_VENTURE
   * ya→legalName4  To→true  bo→true  us→true  li→true
   * cs→true  ds→false  ma→true  fs→default
   */
  JOINT_VENTURE: {
    legalNameKey:            "legalName4InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        true,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Joint Venture",
    tellUsAboutOrgLabel:     "Joint Venture",
  },

  /**
   * CORPORATION
   * ya→legalName2(isCorpType)  To→true  bo→true  us→true(O.CORPORATION specifically)
   * li→true  cs→true  ds→false  ma→true  fs→corpStartDate
   * stateArticles→Incorporation variant (isCorpType)
   */
  CORPORATION: {
    legalNameKey:            "legalName2InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        "stateArticlesIncorporationFiledInputControl",
    startDateLabelKey:       "corpStartDate",
    showClosingMonth:        true,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Corporation",
    tellUsAboutOrgLabel:     "Corporation",
  },

  /**
   * SCORP
   * ya→legalName2  To→true  bo→true  us→false(only O.CORPORATION in us, not SCORP)
   * li→true  cs→true  ds→false  ma→true  fs→corpStartDate
   */
  SCORP: {
    legalNameKey:            "legalName2InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        "stateArticlesIncorporationFiledInputControl",
    startDateLabelKey:       "corpStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "S Corporation",
    tellUsAboutOrgLabel:     "S Corporation",
  },

  /**
   * PERSONAL_SERVICE_CORPORATION
   * ya→legalName2  To→true  bo→true  us→false  li→true
   * cs→true  ds→false  ma→true  fs→corpStartDate
   */
  PERSONAL_SERVICE_CORPORATION: {
    legalNameKey:            "legalName2InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        "stateArticlesIncorporationFiledInputControl",
    startDateLabelKey:       "corpStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Personal Service Corporation",
    tellUsAboutOrgLabel:     "Personal Service Corporation",
  },

  /**
   * REIT
   * ya→legalName3  To→true  bo→true  us→true  li→false  cs→true  ds→false  ma→true  fs→default
   */
  REIT: {
    legalNameKey:            "legalName3InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        true,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Real Estate Investment Trust (REIT)",
    tellUsAboutOrgLabel:     "Real Estate Investment Trust (REIT)",
  },

  /**
   * RIC
   * ya→legalName3  To→true  bo→true  us→true  li→false  cs→true  ds→false  ma→true  fs→default
   */
  RIC: {
    legalNameKey:            "legalName3InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        true,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Regulated Investment Conduit (RIC)",
    tellUsAboutOrgLabel:     "Regulated Investment Conduit (RIC)",
  },

  /**
   * SETTLEMENT_FUND
   * ya→legalName3  To→true  bo→true  us→true  li→false  cs→true  ds→false  ma→true  fs→default
   */
  SETTLEMENT_FUND: {
    legalNameKey:            "legalName3InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        true,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Settlement Fund (under IRC Sec 468B)",
    tellUsAboutOrgLabel:     "Settlement Fund",
  },

  // ── Trust types (isTrustType = true for all 9 below) ─────────────────────
  // ya→legalName7  To→true  bo→false  us→false(trustFilingAsEstateFlag excluded per scope)
  // li→false  cs→false(haveEmployees)  ds→true  ma→true  fs→trustStartDate

  CHARITABLE_LEAD_ANNUITY_TRUST: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "trustStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Charitable Lead Annuity Trust",
    tellUsAboutOrgLabel:     "Trust",
  },

  CHARITABLE_LEAD_UNITRUST: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "trustStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Charitable Lead Unitrust",
    tellUsAboutOrgLabel:     "Trust",
  },

  CHARITABLE_REMAINDER_ANNUITY_TRUST: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "trustStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Charitable Remainder Annuity Trust",
    tellUsAboutOrgLabel:     "Trust",
  },

  CHARITABLE_REMAINDER_UNITRUST: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "trustStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Charitable Remainder Unitrust",
    tellUsAboutOrgLabel:     "Trust",
  },

  FUNERAL_TRUST: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "trustStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Funeral Trust",
    tellUsAboutOrgLabel:     "Trust",
  },

  IRREVOCABLE_TRUST: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "trustStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Irrevocable Trust",
    tellUsAboutOrgLabel:     "Trust",
  },

  REVOCABLE_TRUST: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "trustStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Revocable Trust",
    tellUsAboutOrgLabel:     "Trust",
  },

  ALL_OTHERS_TRUST: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "trustStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Trust",
    tellUsAboutOrgLabel:     "Trust",
  },

  POOLED_INCOME_FUND: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "trustStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Pooled Income Fund",
    tellUsAboutOrgLabel:     "Trust",
  },

  // ── Protected-person types (isProtectedPersonTrustType) ──────────────────
  // ya→legalName1  To→false(read-only)  bo→false  us→false
  // li→false  cs→false(haveEmployees)  ds→true  ma→true  fs→default

  GUARDIANSHIP: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       false,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Guardianship",
    tellUsAboutOrgLabel:     "Guardianship",
  },

  CUSTODIANSHIP: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       false,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Custodianship",
    tellUsAboutOrgLabel:     "Custodianship",
  },

  CONSERVATORSHIP: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       false,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Conservatorship",
    tellUsAboutOrgLabel:     "Conservatorship",
  },

  /**
   * ESTATE
   * ya→legalName1  To→false  bo→false  us→true  li→false
   * cs→false(haveEmployees)  ds→true  ma→true  fs→estateStartDate
   * county/stateLocation use ESTATE-specific keys (bundle ga/yo validators)
   */
  ESTATE: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       false,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "estateCountyInputControl",
    stateLocationKey:        "estateStateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "estateStartDate",
    showClosingMonth:        true,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "haveEmployeesInputControl",
    employeesHelptipKey:     null,
    showHouseholdEmployees:  true,
    entityName:              "Estate",
    tellUsAboutOrgLabel:     "Estate",
  },

  /**
   * RECEIVERSHIP
   * ya→legalName1  To→false  bo→false  us→false  li→false
   * cs→true(provideW2)  ds→false  ma→true  fs→default
   */
  RECEIVERSHIP: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       false,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Receivership",
    tellUsAboutOrgLabel:     "Receivership",
  },

  /**
   * BANKRUPTCY
   * ya→legalName1  To→false  bo→false  us→false  li→false
   * cs→true(provideW2)  ds→true  ma→true  fs→bankruptcyStartDate
   */
  BANKRUPTCY: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       false,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "bankruptcyStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  true,
    entityName:              "Bankruptcy Estate",
    tellUsAboutOrgLabel:     "Bankruptcy Estate",
  },

  /**
   * HOA
   * ya→legalName3  To→true  bo→true  us→true  li→false
   * cs→true  ds→false  ma→true  fs→default
   */
  HOA: {
    legalNameKey:            "legalName3InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        true,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Homeowners Association (HOA)",
    tellUsAboutOrgLabel:     "Homeowners Association",
  },

  /**
   * POLITICAL_ORGANIZATION
   * ya→legalName3  To→true  bo→true  us→true  li→false
   * cs→true  ds→false  ma→true  fs→default
   */
  POLITICAL_ORGANIZATION: {
    legalNameKey:            "legalName3InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        true,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Political Organization",
    tellUsAboutOrgLabel:     "Political Organization",
  },

  /**
   * WITHHOLDING_AGENT
   * ya→legalName1  To→false  bo→false  us→false  li→true
   * ma→false(employees hidden)  ds→false  fs→default
   */
  WITHHOLDING_AGENT: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       false,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    null,
    employeesHelptipKey:     null,
    showHouseholdEmployees:  false,
    entityName:              "Withholding Agent",
    tellUsAboutOrgLabel:     "Withholding Agent",
  },

  /**
   * PLAN_ADMINISTRATOR
   * ya→legalName1  To→true  bo→false  us→false  li→true
   * ma→false  ds→false  fs→default
   */
  PLAN_ADMINISTRATOR: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    null,
    employeesHelptipKey:     null,
    showHouseholdEmployees:  false,
    entityName:              "Plan Administrator",
    tellUsAboutOrgLabel:     "Plan Administrator",
  },

  /**
   * EMPLOYER_OR_FISCAL_AGENT
   * ya→legalName1  To→true  bo→false  us→false  li→true
   * ma→false  ds→false  fs→withholdingTaxStartDate
   */
  EMPLOYER_OR_FISCAL_AGENT: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "withholdingTaxStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    null,
    employeesHelptipKey:     null,
    showHouseholdEmployees:  false,
    entityName:              "Employer/Fiscal Agent",
    tellUsAboutOrgLabel:     "Employer/Fiscal Agent",
  },

  /**
   * IRA
   * ya→legalName1  To→false  bo→false  us→false  li→true
   * ma→false  ds→false  fs→default
   */
  IRA: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       false,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    null,
    employeesHelptipKey:     null,
    showHouseholdEmployees:  false,
    entityName:              "Individual Retirement Arrangement (IRA)",
    tellUsAboutOrgLabel:     "IRA",
  },

  /**
   * EMPLOYER_PLAN
   * ya→legalName7(explicitly)  To→true  bo→true  us→false  li→true
   * ma→false  ds→false  fs→default
   */
  EMPLOYER_PLAN: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    null,
    employeesHelptipKey:     null,
    showHouseholdEmployees:  false,
    entityName:              "Employer/Employee Pension Plan",
    tellUsAboutOrgLabel:     "Employer/Employee Pension Plan",
  },

  /**
   * ESCROW
   * ya→legalName1(default)  To→true  bo→false  us→false  li→false
   * cs→true(provideW2)  ds→false  ma→true  fs→default
   */
  ESCROW: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: false,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Escrow Account",
    tellUsAboutOrgLabel:     "Escrow Account",
  },

  /**
   * REMIC
   * ya→legalName3  To→true  bo→false  us→false  li→true
   * ma→false  ds→false  fs→default
   */
  REMIC: {
    legalNameKey:            "legalName3InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    null,
    employeesHelptipKey:     null,
    showHouseholdEmployees:  false,
    entityName:              "Real Estate Mortgage Investment Conduit (REMIC)",
    tellUsAboutOrgLabel:     "REMIC",
  },

  /**
   * FNMA
   * ya→legalName7(explicitly)  To→true  bo→false  us→false  li→true
   * ma→false  ds→false  fs→default
   */
  FNMA: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    null,
    employeesHelptipKey:     null,
    showHouseholdEmployees:  false,
    entityName:              "Federal National Mortgage Association (FNMA)",
    tellUsAboutOrgLabel:     "FNMA",
  },

  /**
   * GNMA
   * ya→legalName7(explicitly)  To→true  bo→false  us→false  li→true
   * ma→false  ds→false  fs→default
   */
  GNMA: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 false,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    null,
    employeesHelptipKey:     null,
    showHouseholdEmployees:  false,
    entityName:              "Government National Mortgage Association (GNMA)",
    tellUsAboutOrgLabel:     "GNMA",
  },

  // ── isOther types (ke.isOther = true) ─────────────────────────────────────
  // ya→legalName7  To→true  bo→true  us→false  li→true
  // cs→true(provideW2)  ds→false  ma→true  fs→businessStartDate

  SOCIAL_SAVINGS_CLUB: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "businessStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Social Savings Club",
    tellUsAboutOrgLabel:     "Social Savings Club",
  },

  BLOCK_OR_TENANT_ASSOCIATION: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "businessStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Block or Tenant Association",
    tellUsAboutOrgLabel:     "Block or Tenant Association",
  },

  SPORTS_TEAM: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "businessStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Sports Team",
    tellUsAboutOrgLabel:     "Sports Team",
  },

  PTA_OR_PTO_SCHOOL_ORG: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "businessStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "PTA or PTO School Organization",
    tellUsAboutOrgLabel:     "PTA or PTO School Organization",
  },

  COMMUNITY_OR_VOLUNTEER_GROUP: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "businessStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Community or Volunteer Group",
    tellUsAboutOrgLabel:     "Community or Volunteer Group",
  },

  MEMORIAL_SCHOLARSHIP: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "businessStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Memorial Scholarship",
    tellUsAboutOrgLabel:     "Memorial Scholarship",
  },

  // ── Government types (Ht.GOV_TYPES) ──────────────────────────────────────
  // ya→legalName1(default)  To→true  bo→true  us→false  li→true
  // cs→true  ds→false  ma→true  fs→default

  FEDERAL_GOVT_OR_MILITARY: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Federal Government/Military",
    tellUsAboutOrgLabel:     "Federal Government/Military",
  },

  STATE_OR_LOCAL_ORGANIZATION: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "State/Local Government",
    tellUsAboutOrgLabel:     "State/Local Government",
  },

  INDIAN_TRIBAL: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Indian Tribal Government",
    tellUsAboutOrgLabel:     "Indian Tribal Government",
  },

  // ── Farm coop / Church types (Ht.FARM_COOP_OR_CHURCH) ────────────────────
  // ya→legalName1(default)  To→true  bo→true  us→false  li→true
  // cs→true  ds→false  ma→true  fs→default

  FARMERS_COOP: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Farmers\' Cooperative",
    tellUsAboutOrgLabel:     "Farmers\' Cooperative",
  },

  CHURCH: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Church",
    tellUsAboutOrgLabel:     "Church",
  },

  CHURCH_CONTROLLED_ORGANIZATION: {
    legalNameKey:            "legalName1InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Church-Controlled Organization",
    tellUsAboutOrgLabel:     "Church-Controlled Organization",
  },

  /**
   * OTHER_NON_PROFIT
   * ya→legalName7(explicitly)  To→true  bo→true  us→false  li→true
   * cs→true  ds→false  ma→true  fs→default
   */
  OTHER_NON_PROFIT: {
    legalNameKey:            "legalName7InputControl",
    legalNameEditable:       true,
    showDba:                 true,
    dbaKey:                  "dbaNameInputControl",
    countyKey:               "countyInputControl",
    stateLocationKey:        "stateLocationInputControl",
    stateArticlesKey:        null,
    startDateLabelKey:       "defaultStartDate",
    showClosingMonth:        false,
    specialFieldKey:         null,
    specialFieldInputName:   null,
    showTruckingGamblingAtf: true,
    employeesQuestionKey:    "provideW2FormInputControl",
    employeesHelptipKey:     "provideW2FormHelp",
    showHouseholdEmployees:  false,
    entityName:              "Non-Profit Organization",
    tellUsAboutOrgLabel:     "Non-Profit Organization",
  },
};
