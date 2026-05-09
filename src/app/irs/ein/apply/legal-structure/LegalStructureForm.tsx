"use client";

/**
 * LegalStructureForm — IRS EIN Wizard Step 1 (Phase IRS-W1)
 *
 * Renders the interactive form area for the Legal Structure step.
 * Verbatim class names, ids, name attributes, and aria-labels from the
 * IRS SPA capture (sa.www4.irs.gov/applyein/legalStructure).
 *
 * State management:
 *   - selectedStructure: which top-level radio is checked
 *   - soleProprietorType / partnershipType / corpType / trustType / additionalType:
 *     sub-type radio values for each non-LLC category (Slice 5b)
 *   - membersCount, selectedState, spousesAnswer, qjvElection: LLC-specific
 *   - entityType: final resolved entity type (drives reason-for-applying gate)
 *   - reasonForApplying: reason-for-applying radio selection (Slice 4)
 *   - error: top-level validation error
 *
 * Conditional sections:
 *   1. soleProprietorSection — gate: selectedStructure==="SOLE_PROPRIETOR" (Slice 5b)
 *   2. partnershipSection    — gate: selectedStructure==="PARTNERSHIP" (Slice 5b)
 *   3. corpSection           — gate: selectedStructure==="CORPORATION" (Slice 5b)
 *   4. LLC section (members + state + CP-state expansions) — Slices 1–3
 *   5. trustSection          — gate: selectedStructure==="ALL_OTHERS_TRUST" (Slice 5b)
 *   6. additionalTypeSection — gate: selectedStructure==="OTHER_NON_PROFIT" (Slice 5b)
 *   7. Reason for applying   — gate: entityType!=="" (all structures, Slice 4 + 5b)
 *      ESTATE: entityType resolves immediately to "ESTATE" on top-level selection
 *      (no sub-type panel for ESTATE — unique among non-LLC top-level choices)
 *
 * All text verbatim from irs-captures/json/ein__legalStructure.json per HR#1.
 * §4 phone substitution applied: IRS phones → (954) 426-6424.
 *
 * Continue button → calls submitLegalStructure() server action via
 * a hidden <form> element + requestSubmit().
 * Back button → window.history.back()
 * Cancel link → href="/irs/ein/apply" (W0 landing)
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { submitLegalStructure } from "./actions";
import ErrorSummary from "@/components/irs/ErrorSummary";

// ── External-link icon SVG (reused on several inline links) ──────────────────
const ExternalIcon = () => (
  <svg
    data-testid="external-icon"
    aria-hidden="true"
    className="external-icon"
    fill="currentColor"
    focusable="false"
    viewBox="0 0 512 512"
    height="14"
    width="14"
  >
    <path d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z" />
  </svg>
);

// ── Helptip icon SVG (question-mark circle) ───────────────────────────────────
const HelptipIconPath = "M9,18 C4.02943725,18 0,13.9705627 0,9 C0,4.02943725 4.02943725,0 9,0 C13.9705627,0 18,4.02943725 18,9 C18,13.9705627 13.9705627,18 9,18 Z M9,17 C13.418278,17 17,13.418278 17,9 C17,4.581722 13.418278,1 9,1 C4.581722,1 1,4.581722 1,9 C1,13.418278 4.581722,17 9,17 Z M10.5533462,12.1315042 L10.5533462,14.3230653 C10.5533462,14.5239584 10.3889794,14.6883256 10.1880863,14.6883256 L7.99652525,14.6883256 C7.79563216,14.6883256 7.63126489,14.5239584 7.63126489,14.3230653 L7.63126489,12.1315042 C7.63126489,11.9306111 7.79563216,11.7662444 7.99652525,11.7662444 L10.1880863,11.7662444 C10.3889794,11.7662444 10.5533462,11.9306111 10.5533462,12.1315042 Z M13.4389016,6.652602 C13.4389016,8.38758764 12.2609374,9.05418764 11.3934449,9.53815691 C10.8546858,9.84862855 10.5168203,10.4787022 10.5168203,10.743516 C10.5168203,10.9444091 10.3615845,11.181828 10.15156,11.181828 L7.95999889,11.181828 C7.7591058,11.181828 7.63126489,10.8713569 7.63126489,10.6704638 L7.63126489,10.2595462 C7.63126489,9.15463418 8.72704544,8.20495745 9.5306178,7.83969709 C10.2337436,7.52009455 10.5259518,7.21875491 10.5259518,6.63433855 C10.5259518,6.12297436 9.8593518,5.66639945 9.11970016,5.66639945 C8.70878253,5.66639945 8.33439071,5.79424036 8.13349762,5.93121273 C7.91434162,6.08644855 7.69518562,6.30560455 7.15642653,6.981336 C7.08337489,7.07265109 6.97379689,7.12743982 6.87335035,7.12743982 C6.79116671,7.12743982 6.71811453,7.10004545 6.64506235,7.05438818 L5.14749562,5.91294982 C4.99226035,5.79424036 4.95573398,5.59334727 5.05618053,5.42898 C6.04238307,3.79444091 7.4303718,3 9.29319889,3 C11.2473405,3 13.4389016,4.56148745 13.4389016,6.652602 Z";

// ── Reason-for-applying options (verbatim from
//    irs-captures/json/ein__legalStructure.json → primaryReasonSection
//    → reasonForApplyingInputControl.choices) ──────────────────────────────
const REASON_OPTIONS = [
  {
    value: "NEW_BUSINESS",
    text:  "Started a new business",
    help:  "If you are beginning a new business.",
  },
  {
    value: "HIRED_EMPLOYEES",
    text:  "Hired employee(s)",
    help:  "If you already have a business and need to hire employees.",
  },
  {
    value: "BANKING_NEEDS",
    text:  "Banking purposes",
    help:  "If the reason for applying for the EIN is strictly to satisfy banking requirements or local law.",
  },
  {
    value: "CHANGING_LEGAL_STRUCTURE",
    text:  "Changed type of organization",
    help:  "If you are changing the type of organization you currently operate, such as changing from a sole proprietor to a partnership, changing from a partnership to a corporation, etc.",
  },
  {
    value: "PURCHASED_BUSINESS",
    text:  "Purchased active business",
    help:  "If you are purchasing a business that is already in operation.",
  },
] as const;

// ── HOA reason-for-applying options (verbatim from
//    ein__legalStructure.json → primaryReasonSection
//    → homeownersReasonInputControl.choices) ──────────────────────────────
const HOMEOWNERS_REASON_OPTIONS = [
  {
    value: "NEW_BUSINESS",
    text:  "Started a new business",
    help:  "If you are beginning a new business.",
  },
  {
    value: "HIRED_EMPLOYEES",
    text:  "Hired employee(s)",
    help:  "If you already have a business and need to hire employees.",
  },
  {
    value: "BANKING_NEEDS",
    text:  "Banking purposes",
    help:  "If the reason for applying for the EIN is strictly to satisfy banking requirements or local law.",
  },
] as const;

// ── Receivership reason-for-applying options (verbatim from
//    ein__legalStructure.json → primaryReasonSection
//    → receivershipReasonInputControl.choices) ────────────────────────────
const RECEIVERSHIP_REASON_OPTIONS = [
  {
    value: "HIRED_EMPLOYEES",
    text:  "Hired employee(s)",
    help:  "If you already have a business and need to hire employees.",
  },
  {
    value: "BANKING_NEEDS",
    text:  "Banking purposes",
    help:  "If the reason for applying for the EIN is strictly to satisfy banking requirements or local law.",
  },
] as const;

// ── Sole Proprietor sub-type options (verbatim from
//    ein__legalStructure.json → soleProprietorSection
//    → soleProprietorStructureInputControl.choices) ─────────────────────────
// IRSLink placeholders substituted with link-text verbatim from .links keys.
const SOLE_PROP_OPTIONS = [
  {
    value: "SOLE_PROPRIETOR",
    text:  "Sole Proprietor",
    help:  "A sole proprietorship is a business that has only one owner and is not incorporated or registered with the state as a limited liability company (LLC). A sole proprietor can be a self-employed individual or an independent contractor. Sole proprietors (self-employed individuals) report all business income and expenses on their individual tax returns (Form 1040, U.S. Individual Income Tax Return, Schedule C, E, or F). A sole proprietor may or may not have employees.",
  },
  {
    value: "HOUSEHOLD_EMPLOYER",
    text:  "Household Employer",
    help:  "You are a household employer if you have hired someone to do household work and that worker is your employee. Household employees include: babysitters, nannies, au pairs, cleaning people, housekeepers, maids, drivers, health aides, private nurses, caretakers, yard workers, and similar domestic workers.",
  },
] as const;

// ── Partnership sub-type options (verbatim from
//    ein__legalStructure.json → partnershipSection
//    → partnershipStructureInputControl.choices) ────────────────────────────
const PARTNERSHIP_OPTIONS = [
  {
    value: "PARTNERSHIP",
    text:  "Partnership",
    help:  "A partnership is a relationship existing between two or more persons or groups who join together to carry on a trade or business. Each partner contributes money, property, labor, or skill, and expects to share in the profits and losses of the business.",
  },
  {
    value: "JOINT_VENTURE",
    text:  "Joint Venture",
    help:  "A joint venture is a partnership formed between two or more business entities. These businesses share risk or expertise on a specific project or group of projects.",
  },
] as const;

// ── Corporation sub-type options (verbatim from
//    ein__legalStructure.json → corpSection
//    → corpStructureInputControl.choices) ──────────────────────────────────
const CORP_OPTIONS = [
  {
    value: "CORPORATION",
    text:  "Corporation",
    help:  "A corporation is a person or group of people who establish a legal entity by filing articles of incorporation with the state's secretary of state granting it certain legal powers, rights, privileges, and liabilities.",
  },
  {
    value: "SCORP",
    text:  "S Corporation",
    help:  "The income of an S corporation generally is taxed to the shareholders of the corporation rather than to the corporation itself. However, an S corporation may still owe tax on certain income.",
  },
  {
    value: "PERSONAL_SERVICE_CORPORATION",
    text:  "Personal Service Corporation",
    help:  "A personal service corporation involves services in the fields of health, law, engineering, architecture, accounting, actuarial science, performing arts, or consulting.",
  },
  {
    value: "REIT",
    text:  "Real Estate Investment Trust (REIT)",
    help:  "A REIT is an investment vehicle established for the benefit of a group of real estate investors.",
  },
  {
    value: "RIC",
    text:  "Regulated Investment Conduit (RIC)",
    help:  "A RIC is a regulated investment company that applies to any domestic corporation that meets certain criteria.",
  },
  {
    value: "SETTLEMENT_FUND",
    text:  "Settlement Fund (under IRC Sec 468B)",
    help:  "A settlement fund is established for the principal purpose of settling and paying claims against the electing taxpayer under Internal Revenue Code (IRC) Section 468B.",
  },
] as const;

// ── Trust sub-type options (verbatim from
//    ein__legalStructure.json → trustSection
//    → trustEntityInputControl.choices) ────────────────────────────────────
// No per-choice additionalText in the JSON — text only.
const TRUST_OPTIONS = [
  { value: "BANKRUPTCY",                     text: "Bankruptcy Estate (Individual)" },
  { value: "CHARITABLE_LEAD_ANNUITY_TRUST",  text: "Charitable Lead Annuity Trust" },
  { value: "CHARITABLE_LEAD_UNITRUST",        text: "Charitable Lead Unitrust" },
  { value: "CHARITABLE_REMAINDER_ANNUITY_TRUST", text: "Charitable Remainder Annuity Trust" },
  { value: "CHARITABLE_REMAINDER_UNITRUST",   text: "Charitable Remainder Unitrust" },
  { value: "CONSERVATORSHIP",                 text: "Conservatorship" },
  { value: "CUSTODIANSHIP",                   text: "Custodianship" },
  { value: "ESCROW",                          text: "Escrow" },
  { value: "FNMA",                            text: "FNMA (Fannie Mae)" },
  { value: "GNMA",                            text: "GNMA (Ginnie Mae)" },
  { value: "GUARDIANSHIP",                    text: "Guardianship" },
  { value: "IRREVOCABLE_TRUST",               text: "Irrevocable Trust" },
  { value: "POOLED_INCOME_FUND",              text: "Pooled Income Fund" },
  { value: "FUNERAL_TRUST",                   text: "Qualified Funeral Trust" },
  { value: "RECEIVERSHIP",                    text: "Receivership" },
  { value: "REVOCABLE_TRUST",                 text: "Revocable Trust" },
  { value: "SETTLEMENT_FUND",                 text: "Settlement Fund (under IRC Sec 468B)" },
  { value: "ALL_OTHERS_TRUST",                text: "Trust (All Others)" },
] as const;

// ── Additional Type options (verbatim from
//    ein__legalStructure.json → additionalTypeSection
//    → additionalEntityInputControl.choices) ────────────────────────────────
// No per-choice additionalText — text only.
const ADDITIONAL_TYPE_OPTIONS = [
  { value: "BANKRUPTCY",                   text: "Bankruptcy Estate (Individual)" },
  { value: "BLOCK_OR_TENANT_ASSOCIATION",  text: "Block/Tenant Association" },
  { value: "CHURCH",                       text: "Church" },
  { value: "CHURCH_CONTROLLED_ORGANIZATION", text: "Church-Controlled Organization" },
  { value: "COMMUNITY_OR_VOLUNTEER_GROUP", text: "Community or Volunteer Group" },
  { value: "EMPLOYER_OR_FISCAL_AGENT",     text: "Employer/Fiscal Agent (under IRC Sec 3504)" },
  { value: "EMPLOYER_PLAN",                text: "Employer Plan (401K, Money Purchase Plan, etc.)" },
  { value: "FARMERS_COOP",                 text: "Farmer's Cooperative" },
  { value: "FEDERAL_GOVT_OR_MILITARY",     text: "Government, Federal/Military" },
  { value: "INDIAN_TRIBAL",                text: "Government, Indian Tribal Governments" },
  { value: "STATE_OR_LOCAL_ORGANIZATION",  text: "Government, State/Local" },
  { value: "HOA",                          text: "Homeowners/Condo Association" },
  { value: "HOUSEHOLD_EMPLOYER",           text: "Household Employer" },
  { value: "IRA",                          text: "IRA" },
  { value: "MEMORIAL_SCHOLARSHIP",         text: "Memorial or Scholarship Fund" },
  { value: "PLAN_ADMINISTRATOR",           text: "Plan Administrator" },
  { value: "POLITICAL_ORGANIZATION",       text: "Political Organization" },
  { value: "PTA_OR_PTO_SCHOOL_ORG",        text: "PTA/PTO or School Organization" },
  { value: "REMIC",                        text: "REMIC" },
  { value: "SOCIAL_SAVINGS_CLUB",          text: "Social or Savings Club" },
  { value: "SPORTS_TEAM",                  text: "Sports Teams (community)" },
  { value: "WITHHOLDING_AGENT",            text: "Withholding Agent" },
  { value: "OTHER_NON_PROFIT",             text: "Other Non-Profit/Tax-Exempt Organizations" },
] as const;

// ── Entity-name lookup for {{entityName}} substitution in reason-for-applying
//    header "Why is the {{entityName}} requesting an EIN?" ──────────────────
// Sources: additionalDetailsConfig.ts entityName values (all committed Slice 3)
// for W4a parity; LLC names match IRS SPA literal.
const ENTITY_NAMES: Record<string, string> = {
  // LLC paths
  SINGLE_MEMBER_LLC:              "Limited Liability Company (LLC)",
  MULTI_MEMBER_LLC:               "Limited Liability Company (LLC)",
  // Sole proprietor paths
  SOLE_PROPRIETOR:                "Sole Proprietor",
  HOUSEHOLD_EMPLOYER:             "Household Employer",
  // Partnership paths
  PARTNERSHIP:                    "Partnership",
  JOINT_VENTURE:                  "Joint Venture",
  // Corporation paths
  CORPORATION:                    "Corporation",
  SCORP:                          "S Corporation",
  PERSONAL_SERVICE_CORPORATION:   "Personal Service Corporation",
  REIT:                           "Real Estate Investment Trust (REIT)",
  RIC:                            "Regulated Investment Conduit (RIC)",
  SETTLEMENT_FUND:                "Settlement Fund",
  // Estate
  ESTATE:                         "Estate",
  // Trust paths
  BANKRUPTCY:                     "Bankruptcy Estate (Individual)",
  CHARITABLE_LEAD_ANNUITY_TRUST:  "Charitable Lead Annuity Trust",
  CHARITABLE_LEAD_UNITRUST:       "Charitable Lead Unitrust",
  CHARITABLE_REMAINDER_ANNUITY_TRUST: "Charitable Remainder Annuity Trust",
  CHARITABLE_REMAINDER_UNITRUST:  "Charitable Remainder Unitrust",
  CONSERVATORSHIP:                "Conservatorship",
  CUSTODIANSHIP:                  "Custodianship",
  ESCROW:                         "Escrow",
  FNMA:                           "FNMA (Fannie Mae)",
  GNMA:                           "GNMA (Ginnie Mae)",
  GUARDIANSHIP:                   "Guardianship",
  IRREVOCABLE_TRUST:              "Irrevocable Trust",
  POOLED_INCOME_FUND:             "Pooled Income Fund",
  FUNERAL_TRUST:                  "Qualified Funeral Trust",
  RECEIVERSHIP:                   "Receivership",
  REVOCABLE_TRUST:                "Revocable Trust",
  ALL_OTHERS_TRUST:               "Trust (All Others)",
  // Additional type paths
  BLOCK_OR_TENANT_ASSOCIATION:    "Block/Tenant Association",
  CHURCH:                         "Church",
  CHURCH_CONTROLLED_ORGANIZATION: "Church-Controlled Organization",
  COMMUNITY_OR_VOLUNTEER_GROUP:   "Community or Volunteer Group",
  EMPLOYER_OR_FISCAL_AGENT:       "Employer/Fiscal Agent",
  EMPLOYER_PLAN:                  "Employer Plan",
  FARMERS_COOP:                   "Farmer's Cooperative",
  FEDERAL_GOVT_OR_MILITARY:       "Government, Federal/Military",
  INDIAN_TRIBAL:                  "Government, Indian Tribal Governments",
  STATE_OR_LOCAL_ORGANIZATION:    "Government, State/Local",
  HOA:                            "Homeowners/Condo Association",
  IRA:                            "IRA",
  MEMORIAL_SCHOLARSHIP:           "Memorial or Scholarship Fund",
  PLAN_ADMINISTRATOR:             "Plan Administrator",
  POLITICAL_ORGANIZATION:         "Political Organization",
  PTA_OR_PTO_SCHOOL_ORG:          "PTA/PTO or School Organization",
  REMIC:                          "REMIC",
  SOCIAL_SAVINGS_CLUB:            "Social or Savings Club",
  SPORTS_TEAM:                    "Sports Teams (community)",
  WITHHOLDING_AGENT:              "Withholding Agent",
  OTHER_NON_PROFIT:               "Other Non-Profit/Tax-Exempt Organizations",
};

// ── Community-property state checker (verbatim switch from bundle `nr` function) ──
function isCommunityPropertyState(state: string): boolean {
  switch (state) {
    case "AZ":
    case "CA":
    case "ID":
    case "LA":
    case "NV":
    case "NM":
    case "TX":
    case "WA":
    case "WI":
      return true;
    default:
      return false;
  }
}

// ── Radio options (verbatim labels, values, helper text from capture) ─────────
const RADIO_OPTIONS = [
  {
    value: "SOLE_PROPRIETOR",
    id:    "SOLE_PROPRIETORlegalStructureInputid",
    label: "Sole Proprietor",
    help:  "Includes individuals who are in business for themselves and household employers.",
  },
  {
    value: "PARTNERSHIP",
    id:    "PARTNERSHIPlegalStructureInputid",
    label: "Partnerships",
    help:  "Includes partnerships and joint ventures.",
  },
  {
    value: "CORPORATION",
    id:    "CORPORATIONlegalStructureInputid",
    label: "Corporations",
    help:  "Includes S corporations, personal service corporations, real estate investment trusts (REIT), regulated investment conduits (RIC), and settlement funds.",
  },
  {
    value: "LLC",
    id:    "LLClegalStructureInputid",
    label: "Limited Liability Company (LLC)",
    help:  "A limited liability company (LLC) is a structure allowed by state statute and is formed by filing articles of organization with the state.",
  },
  {
    value: "ESTATE",
    id:    "ESTATElegalStructureInputid",
    label: "Estate",
    help:  "An estate is a legal entity created as a result of a person's death.",
  },
  {
    value: "ALL_OTHERS_TRUST",
    id:    "ALL_OTHERS_TRUSTlegalStructureInputid",
    label: "Trusts",
    help:  "All types of trusts including conservatorships, custodianships, guardianships, irrevocable trusts, revocable trusts, and receiverships.",
  },
  {
    value: "OTHER_NON_PROFIT",
    id:    "OTHER_NON_PROFITlegalStructureInputid",
    label: "View Additional Types, Including Tax-Exempt and Governmental Organizations",
    help:  "If none of the above fit what you are establishing , there are several others to choose from.",
  },
] as const;

// ── State / territory options (verbatim order + labels from capture) ──────────
const STATE_OPTIONS = [
  ["AK", "Alaska (AK) "],
  ["AL", "Alabama (AL) "],
  ["AR", "Arkansas (AR) "],
  ["AZ", "Arizona (AZ) "],
  ["CA", "California (CA) "],
  ["CO", "Colorado (CO) "],
  ["CT", "Connecticut (CT) "],
  ["DE", "Delaware (DE) "],
  ["DC", "District of Columbia (DC) "],
  ["FL", "Florida (FL) "],
  ["GA", "Georgia (GA) "],
  ["HI", "Hawaii (HI) "],
  ["ID", "Idaho (ID) "],
  ["IL", "Illinois (IL) "],
  ["IN", "Indiana (IN) "],
  ["IA", "Iowa (IA) "],
  ["KS", "Kansas (KS) "],
  ["KY", "Kentucky (KY) "],
  ["LA", "Louisiana (LA) "],
  ["ME", "Maine (ME) "],
  ["MD", "Maryland (MD) "],
  ["MA", "Massachusetts (MA) "],
  ["MI", "Michigan (MI) "],
  ["MN", "Minnesota (MN) "],
  ["MS", "Mississippi (MS) "],
  ["MO", "Missouri (MO) "],
  ["MT", "Montana (MT) "],
  ["NE", "Nebraska (NE) "],
  ["NV", "Nevada (NV) "],
  ["NH", "New Hampshire (NH) "],
  ["NJ", "New Jersey (NJ) "],
  ["NM", "New Mexico (NM) "],
  ["NY", "New York (NY) "],
  ["NC", "North Carolina (NC) "],
  ["ND", "North Dakota (ND) "],
  ["OH", "Ohio (OH) "],
  ["OK", "Oklahoma (OK) "],
  ["OR", "Oregon (OR) "],
  ["PA", "Pennsylvania (PA) "],
  ["RI", "Rhode Island (RI) "],
  ["SC", "South Carolina (SC) "],
  ["SD", "South Dakota (SD) "],
  ["TN", "Tennessee (TN) "],
  ["TX", "Texas (TX) "],
  ["UT", "Utah (UT) "],
  ["VT", "Vermont (VT) "],
  ["VA", "Virginia (VA) "],
  ["WA", "Washington (WA) "],
  ["WV", "West Virginia (WV) "],
  ["WI", "Wisconsin (WI) "],
  ["WY", "Wyoming (WY) "],
  ["AS", "American Samoa (AS) "],
  ["FM", "Micronesia, Federated States (FM) "],
  ["GU", "Guam (GU) "],
  ["MH", "Marshall Islands (MH) "],
  ["MP", "Northern Mariana Island (MP) "],
  ["PR", "Puerto Rico (PR) "],
  ["VI", "Virgin Islands (US) (VI) "],
  ["AA", "Armed Forces Americas (AA) "],
  ["AP", "Armed Forces Pacific (AP) "],
  ["AE", "Armed Forces Others (AE) "],
  ["AE", "Armed Forces Africa (AE) "],
  ["AE", "Armed Forces Canada (AE) "],
  ["AE", "Armed Forces Europe (AE) "],
  ["AE", "Armed Forces Middle East (AE) "],
] as const;

export default function LegalStructureForm() {
  // ── Top-level structure selection ──────────────────────────────────────────
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  const [error, setError] = useState("");

  // ── LLC-specific state ─────────────────────────────────────────────────────
  const [membersCount, setMembersCount] = useState("1");
  const [membersError, setMembersError] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [stateError, setStateError] = useState("");
  const [spousesAnswer, setSpousesAnswer] = useState("");
  const [marriedError, setMarriedError] = useState("");
  const [qjvElection, setQjvElection] = useState("");
  const [qjvError, setQjvError] = useState("");

  // ── Non-LLC sub-type state (Slice 5b) ─────────────────────────────────────
  const [soleProprietorType, setSoleProprietorType] = useState("");
  const [soleProprietorTypeError, setSoleProprietorTypeError] = useState("");
  const [partnershipType, setPartnershipType] = useState("");
  const [partnershipTypeError, setPartnershipTypeError] = useState("");
  const [corpType, setCorpType] = useState("");
  const [corpTypeError, setCorpTypeError] = useState("");
  const [trustType, setTrustType] = useState("");
  const [trustTypeError, setTrustTypeError] = useState("");
  const [additionalType, setAdditionalType] = useState("");
  const [additionalTypeError, setAdditionalTypeError] = useState("");

  // ── Resolved entity type — drives reason-for-applying gate ────────────────
  // For ESTATE: resolves immediately to "ESTATE" on top-level radio selection.
  // For LLC: resolves via members+state+QJV logic.
  // For all others: resolves to the sub-type radio selection value.
  const [entityType, setEntityType] = useState("");

  // ── Reason for applying ───────────────────────────────────────────────────
  const [reasonForApplying, setReasonForApplying] = useState("");
  const [reasonError, setReasonError] = useState("");

  // ── Page-level error summary (Slice 11) ───────────────────────────────────
  // Set on Continue click only; cleared when Continue succeeds (isValid).
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  // ── Portal target — null during SSR, set after mount ──────────────────────
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById("w1-form-portal");
    if (el) setPortalTarget(el);
  }, []);

  // Reset reason-for-applying whenever entityType clears (user editing above)
  useEffect(() => {
    if (entityType === "") {
      setReasonForApplying("");
      setReasonError("");
    }
  }, [entityType]);

  const formRef = useRef<HTMLFormElement>(null);

  // ── Helper: reset all sub-type state when top-level selection changes ──────
  const resetSubTypes = () => {
    setSoleProprietorType("");
    setSoleProprietorTypeError("");
    setPartnershipType("");
    setPartnershipTypeError("");
    setCorpType("");
    setCorpTypeError("");
    setTrustType("");
    setTrustTypeError("");
    setAdditionalType("");
    setAdditionalTypeError("");
    // LLC-specific resets
    setSpousesAnswer("");
    setMarriedError("");
    setQjvElection("");
    setQjvError("");
    setMembersError("");
    setStateError("");
    setReasonForApplying("");
    setReasonError("");
  };

  // ── da: member count onChange (verbatim port of bundle `da` handler) ──────────
  const handleMembersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMembersCount(value);
    if (value === "1" && selectedState !== "")
      setEntityType("SINGLE_MEMBER_LLC");
    else if (selectedState === "" || value === "")
      setEntityType("");
    else if (value === "2" && !isCommunityPropertyState(selectedState))
      setEntityType("MULTI_MEMBER_LLC");
    else if (value === "2" && isCommunityPropertyState(selectedState))
      setEntityType(qjvElection !== "" ? qjvElection : "");
    else if (value !== "2" && selectedState !== "")
      setEntityType("MULTI_MEMBER_LLC");
  };

  // ── Si: state onChange (verbatim port of bundle `Si` handler) ────────────────
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedState(value);
    if (membersCount === "1")
      setEntityType("SINGLE_MEMBER_LLC");
    else if (membersCount === "2" && !isCommunityPropertyState(value)) {
      setEntityType("MULTI_MEMBER_LLC");
      setSpousesAnswer("");
      setQjvElection("");
    } else if (membersCount === "2" && isCommunityPropertyState(value))
      setEntityType(qjvElection !== "" ? qjvElection : "");
    else if (membersCount !== "" && value !== "")
      setEntityType("MULTI_MEMBER_LLC");
  };

  // ── Yi: husband/wife onChange (verbatim port of bundle `Yi` handler) ─────────
  const handleSpousesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpousesAnswer(e.target.value);
    if (e.target.value === "no")
      setEntityType("MULTI_MEMBER_LLC");
    else
      setEntityType("");
  };

  // ── Xr: QJV election onChange (verbatim port of bundle `Xr` handler) ─────────
  const handleQjvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQjvElection(e.target.value);
    setEntityType(e.target.value);
  };

  // ── handleContinue: validation ────────────────────────────────────────────
  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    let isValid = true;

    // Check 1: top-level structure selected
    if (!selectedStructure) {
      setError("Please select a type of legal structure.");
      isValid = false;
    } else {
      setError("");
    }

    // Check 2: LLC-specific sub-fields
    if (selectedStructure === "LLC") {
      if (membersCount === "") {
        isValid = false;
        setMembersError("LLC Members: Enter a valid number");
      } else {
        setMembersError("");
      }
      if (selectedState === "") {
        isValid = false;
        setStateError("State: Selection is required.");
      } else {
        setStateError("");
      }
      if (membersCount === "2" && isCommunityPropertyState(selectedState) && spousesAnswer === "") {
        isValid = false;
        setMarriedError("Married: Selection is required.");
      } else {
        setMarriedError("");
      }
      if (entityType === "" && spousesAnswer === "yes" && qjvElection === "") {
        isValid = false;
        setQjvError("Which LCC: Selection is required. Please complete LLC questions.");
      } else {
        setQjvError("");
      }
    }

    // Check 3: non-LLC sub-type required
    // Error text verbatim from ein__legalStructure.json inputErrorMessages
    if (selectedStructure === "SOLE_PROPRIETOR" && soleProprietorType === "") {
      isValid = false;
      setSoleProprietorTypeError("Sole Proprietor Type: Selection is required.");
    } else {
      setSoleProprietorTypeError("");
    }
    if (selectedStructure === "PARTNERSHIP" && partnershipType === "") {
      isValid = false;
      setPartnershipTypeError("Partnership Type: Selection is required.");
    } else {
      setPartnershipTypeError("");
    }
    if (selectedStructure === "CORPORATION" && corpType === "") {
      isValid = false;
      setCorpTypeError("Corporation Type: Selection is required.");
    } else {
      setCorpTypeError("");
    }
    if (selectedStructure === "ALL_OTHERS_TRUST" && trustType === "") {
      isValid = false;
      setTrustTypeError("Trust Type: Selection is required.");
    } else {
      setTrustTypeError("");
    }
    if (selectedStructure === "OTHER_NON_PROFIT" && additionalType === "") {
      isValid = false;
      setAdditionalTypeError("Additional Type: Selection is required.");
    } else {
      setAdditionalTypeError("");
    }

    // Check 4: reason for applying — applies to ALL structures once entityType resolves
    // Verbatim error from primaryReasonSection.reasonForApplyingInputControl
    if (entityType !== "" && reasonForApplying === "") {
      isValid = false;
      setReasonError("Reason For Applying: Selection is required.");
    } else if (entityType !== "") {
      setReasonError("");
    }

    // Collect all active per-field errors for the page-level summary
    const errs: string[] = [
      error,
      membersError,
      stateError,
      marriedError,
      qjvError,
      soleProprietorTypeError,
      partnershipTypeError,
      corpTypeError,
      trustTypeError,
      additionalTypeError,
      reasonError,
    ].filter(Boolean);
    setFieldErrors(errs);

    if (!isValid) return;
    formRef.current?.requestSubmit();
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.back();
  };

  // Don't render during SSR (portal target doesn't exist yet)
  if (!portalTarget) return null;

  // Resolved entity-name for reason-for-applying header
  const resolvedEntityName = ENTITY_NAMES[entityType] ?? entityType;

  // Resolved reason-for-applying control id + options per entityType (Slice 5c)
  // HOA → homeownersReasonInputControl (3 choices)
  // RECEIVERSHIP → receivershipReasonInputControl (2 choices)
  // all others → standard reasonForApplyingInputControl (5 choices)
  const reasonControlId =
    entityType === "HOA"          ? "homeownersReasonInputControl"
    : entityType === "RECEIVERSHIP" ? "receivershipReasonInputControl"
    : "reasonForApplyingInputControl";
  const reasonOptions =
    entityType === "HOA"          ? HOMEOWNERS_REASON_OPTIONS
    : entityType === "RECEIVERSHIP" ? RECEIVERSHIP_REASON_OPTIONS
    : REASON_OPTIONS;

  return createPortal(
    <>
      {/* Hidden form for server action submission */}
      <form ref={formRef} action={submitLegalStructure} style={{ display: "none" }}>
        <input type="hidden" name="legal_structure" value={selectedStructure ?? ""} />
        {selectedStructure === "LLC" && (
          <>
            <input type="hidden" name="members_of_llc" value={membersCount} />
            <input type="hidden" name="state" value={selectedState} />
            <input type="hidden" name="spouses_as_members" value={spousesAnswer} />
            <input type="hidden" name="qjv_election" value={qjvElection} />
            {entityType !== "" && (
              <input type="hidden" name="reason_for_applying" value={reasonForApplying} />
            )}
          </>
        )}
        {/* Non-LLC: entity_type and reason persist directly */}
        {selectedStructure !== null && selectedStructure !== "LLC" && entityType !== "" && (
          <>
            <input type="hidden" name="entity_type" value={entityType} />
            <input type="hidden" name="reason_for_applying" value={reasonForApplying} />
          </>
        )}
      </form>

      {/* ── Page-level error summary (Slice 11) ──────────────────────────────────── */}
      <ErrorSummary fieldErrors={fieldErrors} />

      {/* ── Radio input section ──────────────────────────────────────────── */}
      <div className="radioInput _bottomMargin18_1lntm_13 ">
        <div className="inputInstruction _bottomMargin8_bppll_6 ">
          <label htmlFor="legalStructureInput">
            Choose type of legal structure
            <span className="_required_bppll_1" role="asterisk">*</span>
            <span className="_fixHelptipStyling_bppll_24 false">
              <span className="_helptipContent_1c7yk_2">
                <span className="helptip-group">
                  <h3 className="helptip-button__button-wrapper">
                    <button
                      aria-expanded="false"
                      aria-label="Types of Legal Structures help topic"
                      className="helptip-button"
                      type="button"
                    >
                      <span className="undefined " style={{ marginLeft: 0 }}>
                        <span aria-hidden="true" style={{ marginLeft: 5 }}>
                          <svg
                            className="helptip-icon"
                            id="typesOfLegalStructures"
                            data-testid="helptip-icon"
                            focusable="false"
                            height="16px"
                            width="16px"
                            viewBox="0 0 18 18"
                          >
                            <path
                              className="helptip-icon-path"
                              data-testid="helptip-closed"
                              d={HelptipIconPath}
                            />
                          </svg>
                        </span>
                      </span>
                    </button>
                  </h3>
                </span>
              </span>
            </span>
          </label>
        </div>

        <fieldset
          className="radio-group _fixRadioMargin_1lntm_21 undefined"
          data-testid="radio-group"
        >
          <legend data-testid="legend" className="sr-only">
            {" "}Choose type of legal structure{" "}
          </legend>

          {RADIO_OPTIONS.map((opt) => (
            <div key={opt.value}>
              <div
                className={
                  selectedStructure === opt.value
                    ? "radio-button radio-button--checked"
                    : "radio-button"
                }
              >
                <input
                  tabIndex={0}
                  type="radio"
                  className="radio-button__input"
                  data-testid={`${opt.value}legalStructureInputid`}
                  id={opt.id}
                  name="legalStructureInput"
                  aria-required="false"
                  value={opt.value}
                  checked={selectedStructure === opt.value}
                  onChange={() => {
                    setSelectedStructure(opt.value);
                    resetSubTypes();
                    // ESTATE is the only top-level choice with no sub-type panel —
                    // entityType resolves immediately. All other non-LLC structures
                    // remain unresolved until their sub-type radio is selected.
                    if (opt.value === "ESTATE") {
                      setEntityType("ESTATE");
                    } else {
                      setEntityType("");
                    }
                  }}
                />
                <label className="input-label " htmlFor={opt.id}>
                  {opt.label}
                </label>
              </div>
              <p className="_choiceAdditionalText_1lntm_34">{opt.help}</p>
            </div>
          ))}
        </fieldset>

        <p className="input-error-message" aria-live="polite">
          {error}
        </p>
      </div>

      {/* ── soleProprietorSection (Slice 5b) ────────────────────────────────
           Gate: selectedStructure === "SOLE_PROPRIETOR"
           Verbatim from ein__legalStructure.json → soleProprietorSection:
             instructions3.title / additionalText
             soleProprietorStructureInputControl.id / fieldName / choices
             inputErrorMessages[0].text (id: solePropStructureInputControl_error1) */}
      {selectedStructure === "SOLE_PROPRIETOR" && (
        <>
          <section className="_bottomMargin16_2vtt5_57">
            <div>
              <h3>You have chosen Sole Proprietor</h3>
              <p>
                Sole proprietor includes individuals who are in business for themselves, or
                household employers. Read the descriptions below and choose the type for which
                you are applying.
              </p>
            </div>
          </section>

          <div className="radioInput _bottomMargin18_1lntm_13 ">
            <div className="inputInstruction _bottomMargin8_bppll_6 ">
              <label htmlFor="soleProprietorStructureInputControl">
                Choose the type of legal structure
                <span className="_required_bppll_1" role="asterisk">*</span>
              </label>
            </div>
            <fieldset
              className="radio-group _fixRadioMargin_1lntm_21 undefined"
              data-testid="radio-group"
            >
              <legend data-testid="legend" className="sr-only">
                {" "}Choose the type of legal structure{" "}
              </legend>
              {SOLE_PROP_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <div
                    className={
                      soleProprietorType === opt.value
                        ? "radio-button radio-button--checked"
                        : "radio-button"
                    }
                  >
                    <input
                      tabIndex={0}
                      type="radio"
                      className="radio-button__input"
                      id={`soleProprietorStructureInputControl_${opt.value}`}
                      name="soleProprietorStructureInputControl"
                      aria-required="true"
                      value={opt.value}
                      checked={soleProprietorType === opt.value}
                      onChange={() => {
                        setSoleProprietorType(opt.value);
                        setSoleProprietorTypeError("");
                        setEntityType(opt.value);
                        setReasonForApplying("");
                        setReasonError("");
                      }}
                    />
                    <label
                      className="input-label "
                      htmlFor={`soleProprietorStructureInputControl_${opt.value}`}
                    >
                      {opt.text}
                    </label>
                  </div>
                  <p className="_choiceAdditionalText_1lntm_34">{opt.help}</p>
                </div>
              ))}
            </fieldset>
            <p className="input-error-message" aria-live="polite">
              {soleProprietorTypeError}
            </p>
          </div>
        </>
      )}

      {/* ── partnershipSection (Slice 5b) ────────────────────────────────────
           Gate: selectedStructure === "PARTNERSHIP"
           Verbatim from ein__legalStructure.json → partnershipSection:
             instructions3.title / additionalText
             partnershipStructureInputControl.id / fieldName / choices
             inputErrorMessages[0].text (id: partnershipStructureInputControl_error1) */}
      {selectedStructure === "PARTNERSHIP" && (
        <>
          <section className="_bottomMargin16_2vtt5_57">
            <div>
              <h3>You have chosen Partnerships</h3>
              <p>Read the descriptions below and choose the type for which you are applying</p>
            </div>
          </section>

          <div className="radioInput _bottomMargin18_1lntm_13 ">
            <div className="inputInstruction _bottomMargin8_bppll_6 ">
              <label htmlFor="partnershipStructureInputControl">
                Choose the type of legal structure
                <span className="_required_bppll_1" role="asterisk">*</span>
              </label>
            </div>
            <fieldset
              className="radio-group _fixRadioMargin_1lntm_21 undefined"
              data-testid="radio-group"
            >
              <legend data-testid="legend" className="sr-only">
                {" "}Choose the type of legal structure{" "}
              </legend>
              {PARTNERSHIP_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <div
                    className={
                      partnershipType === opt.value
                        ? "radio-button radio-button--checked"
                        : "radio-button"
                    }
                  >
                    <input
                      tabIndex={0}
                      type="radio"
                      className="radio-button__input"
                      id={`partnershipStructureInputControl_${opt.value}`}
                      name="partnershipStructureInputControl"
                      aria-required="true"
                      value={opt.value}
                      checked={partnershipType === opt.value}
                      onChange={() => {
                        setPartnershipType(opt.value);
                        setPartnershipTypeError("");
                        setEntityType(opt.value);
                        setReasonForApplying("");
                        setReasonError("");
                      }}
                    />
                    <label
                      className="input-label "
                      htmlFor={`partnershipStructureInputControl_${opt.value}`}
                    >
                      {opt.text}
                    </label>
                  </div>
                  <p className="_choiceAdditionalText_1lntm_34">{opt.help}</p>
                </div>
              ))}
            </fieldset>
            <p className="input-error-message" aria-live="polite">
              {partnershipTypeError}
            </p>
          </div>
        </>
      )}

      {/* ── corpSection (Slice 5b) ───────────────────────────────────────────
           Gate: selectedStructure === "CORPORATION"
           Verbatim from ein__legalStructure.json → corpSection:
             instructions3.title / additionalText
             corpStructureInputControl.id / fieldName / 6 choices
             inputErrorMessages[0].text (id: corpStructureInputControl_error1) */}
      {selectedStructure === "CORPORATION" && (
        <>
          <section className="_bottomMargin16_2vtt5_57">
            <div>
              <h3>You have chosen Corporations</h3>
              <p>Read the descriptions below and choose the type for which you are applying.</p>
            </div>
          </section>

          <div className="radioInput _bottomMargin18_1lntm_13 ">
            <div className="inputInstruction _bottomMargin8_bppll_6 ">
              <label htmlFor="corpStructureInputControl">
                Choose the type of legal structure
                <span className="_required_bppll_1" role="asterisk">*</span>
              </label>
            </div>
            <fieldset
              className="radio-group _fixRadioMargin_1lntm_21 undefined"
              data-testid="radio-group"
            >
              <legend data-testid="legend" className="sr-only">
                {" "}Choose the type of legal structure{" "}
              </legend>
              {CORP_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <div
                    className={
                      corpType === opt.value
                        ? "radio-button radio-button--checked"
                        : "radio-button"
                    }
                  >
                    <input
                      tabIndex={0}
                      type="radio"
                      className="radio-button__input"
                      id={`corpStructureInputControl_${opt.value}`}
                      name="corpStructureInputControl"
                      aria-required="true"
                      value={opt.value}
                      checked={corpType === opt.value}
                      onChange={() => {
                        setCorpType(opt.value);
                        setCorpTypeError("");
                        setEntityType(opt.value);
                        setReasonForApplying("");
                        setReasonError("");
                      }}
                    />
                    <label
                      className="input-label "
                      htmlFor={`corpStructureInputControl_${opt.value}`}
                    >
                      {opt.text}
                    </label>
                  </div>
                  <p className="_choiceAdditionalText_1lntm_34">{opt.help}</p>
                </div>
              ))}
            </fieldset>
            <p className="input-error-message" aria-live="polite">
              {corpTypeError}
            </p>
          </div>
        </>
      )}

      {/* ── LLC conditional section (visible only when LLC is selected) ───── */}
      {selectedStructure === "LLC" && (
        <>
          {/* Blue info panel */}
          <div className="_fixSectionAlert_2vtt5_34  _verticalMargin32_2vtt5_98">
            <div tabIndex={-1} className="section-alert section-alert--blue">
              <div aria-hidden="true" className="section-alert__icon">
                <svg
                  className="info-icon"
                  fill="#1B1B1B"
                  focusable="false"
                  height="24px"
                  width="24px"
                  viewBox="0 0 512 512"
                >
                  <path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z" />
                </svg>
              </div>
              <div className="section-alert__content">
                <h3
                  className="section-alert__title section-alert__title-weighted"
                  tabIndex={-1}
                >
                  Confirm your selection of LLC as the type of structure applying for an EIN
                </h3>
                <p className="_bottomMargin0_2vtt5_47">
                  <b>What it is ...</b>
                </p>
                <p></p>
                <ul>
                  <li>A limited liability company (LLC) is a structure allowed by state statute.</li>
                  <li>An LLC is formed by filing articles of organization with the state&apos;s secretary of state office.</li>
                  <li>An LLC must be unique in its state. There can be no more than one active LLC with the same name in the same state.</li>
                  <li>For federal tax purposes, an LLC may be treated as a partnership or a corporation, or be disregarded as an entity separate from its owner.</li>
                  <li>
                    An LLC can have two or more{" "}
                    <a
                      href="https://sa.www4.irs.gov/applyein/glossary#member"
                      aria-label="members. open in a new window"
                      target="_blank"
                      className="link link--blue link--no-padding"
                    >
                      members<ExternalIcon />
                    </a>{" "}
                    (multi-member) or one member (single-member).
                  </li>
                  <li>An LLC can have an unlimited number of members.</li>
                  <li>An LLC&apos;s members may include individuals, corporations, other LLCs, or foreign entities.</li>
                </ul>
                <p></p>
                <p className="_bottomMargin0_2vtt5_47">
                  <b>What it is not ...</b>
                </p>
                <p></p>
                <ul>
                  <li>
                    LLCs are not{" "}
                    <a
                      href="https://sa.www4.irs.gov/applyein/glossary#incorporated"
                      aria-label="incorporated. open in a new window"
                      target="_blank"
                      className="link link--blue link--no-padding"
                    >
                      incorporated<ExternalIcon />
                    </a>{" "}
                    and do not file{" "}
                    <a
                      href="https://sa.www4.irs.gov/applyein/glossary#articlesOfIncorporation"
                      aria-label="articles of incorporation. open in a new window"
                      target="_blank"
                      className="link link--blue link--no-padding"
                    >
                      articles of incorporation<ExternalIcon />
                    </a>
                  </li>
                </ul>
                <p></p>
                <b>
                  If you need to change your type of structure, we recommend that you do so now
                </b>
                , otherwise you will have to start over and re-enter your information. Additional
                help may be found by reviewing{" "}
                <a
                  href="https://sa.www4.irs.gov/applyein/glossary#allOrganizationsType"
                  aria-label="all types of organizations and structures. open in a new window"
                  target="_blank"
                  className="link link--blue link--no-padding"
                >
                  all types of organizations and structures<ExternalIcon />
                </a>{" "}
                before making your selection.
              </div>
            </div>
          </div>

          {/* "Tell us more about the members" section */}
          <section className="_bottomMargin16_2vtt5_57">
            <div>
              <h3>Tell us more about the members of the Limited Liability Company (LLC)</h3>
              <p></p>
            </div>
          </section>

          {/* Members count text input */}
          <div className="textInput _bottomMargin24_mw6ug_13 ">
            <div className="inputInstruction _bottomMargin8_bppll_6 ">
              <label htmlFor="membersOfLlcInput">
                How many member(s) are in the LLC?
                <span className="_required_bppll_1" role="asterisk">*</span>
                <span className="_fixHelptipStyling_bppll_24 false">
                  <span className="_helptipContent_1c7yk_2">
                    <span className="helptip-group">
                      <h3 className="helptip-button__button-wrapper">
                        <button
                          aria-expanded="false"
                          aria-label="Member help topic"
                          className="helptip-button"
                          type="button"
                        >
                          <span className="undefined " style={{ marginLeft: 0 }}>
                            <span aria-hidden="true" style={{ marginLeft: 5 }}>
                              <svg
                                className="helptip-icon"
                                id="memberHelp"
                                data-testid="helptip-icon"
                                focusable="false"
                                height="16px"
                                width="16px"
                                viewBox="0 0 18 18"
                              >
                                <path
                                  className="helptip-icon-path"
                                  data-testid="helptip-closed"
                                  d={HelptipIconPath}
                                />
                              </svg>
                            </span>
                          </span>
                        </button>
                      </h3>
                    </span>
                  </span>
                </span>
              </label>
            </div>
            <div className="undefined _removeInlineErrorMargin_mw6ug_17">
              <div>
                <input
                  aria-label="How many member(s) are in the LLC?, Required"
                  id="membersOfLlcInput"
                  name="membersOfLlcInput"
                  type="text"
                  className="input-text null "
                  placeholder=""
                  autoComplete="off"
                  autoCorrect="off"
                  required
                  aria-required="true"
                  value={membersCount}
                  onChange={handleMembersChange}
                />
                <p className="input-error-message" aria-live="polite">{membersError}</p>
              </div>
            </div>
          </div>

          {/* State / territory dropdown */}
          <div className="dropdownInput _bottomMargin24_1pbi9_26 ">
            <div className="inputInstruction _bottomMargin8_bppll_6 ">
              <label htmlFor="stateInputControl">
                Please select the state/territory where the business is physically located
                <span className="_required_bppll_1" role="asterisk">*</span>
                <span className="_fixHelptipStyling_bppll_24 false">
                  <span className="_helptipContent_1c7yk_2">
                    <span className="helptip-group">
                      <h3 className="helptip-button__button-wrapper">
                        <button
                          aria-expanded="false"
                          aria-label="Community Property States help topic"
                          className="helptip-button"
                          type="button"
                        >
                          <span className="undefined " style={{ marginLeft: 0 }}>
                            <span aria-hidden="true" style={{ marginLeft: 5 }}>
                              <svg
                                className="helptip-icon"
                                id="communityPropertyStateHelp"
                                data-testid="helptip-icon"
                                focusable="false"
                                height="16px"
                                width="16px"
                                viewBox="0 0 18 18"
                              >
                                <path
                                  className="helptip-icon-path"
                                  data-testid="helptip-closed"
                                  d={HelptipIconPath}
                                />
                              </svg>
                            </span>
                          </span>
                        </button>
                      </h3>
                    </span>
                  </span>
                </span>
              </label>
            </div>
            <select
              id="stateInputControl"
              className="single-select single-select--no-error _removeSelectMargin_1pbi9_1"
              name="stateInputControl"
              value={selectedState}
              onChange={handleStateChange}
            >
              <option value="" disabled hidden>
                Select an Option
              </option>
              {STATE_OPTIONS.map(([value, label], idx) => (
                <option key={`${value}-${idx}`} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="input-error-message" aria-live="polite">{stateError}</p>
          </div>

          {/* ── Married section: count==="2" && CP state ─────────────────────────
               marriedInstructions title + marriedInputControl verbatim from
               irs-captures/json/ein__legalStructure.json llcTellUsMoreSection */}
          {membersCount === "2" && isCommunityPropertyState(selectedState) && (
            <>
              <section className="_bottomMargin16_2vtt5_57">
                <div>
                  <h3>You are in a community property state. Tell us more about the two-member Limited Liability Company (LLC)</h3>
                  <p></p>
                </div>
              </section>

              <div className="radioInput _bottomMargin18_1lntm_13 ">
                <div className="inputInstruction _bottomMargin8_bppll_6 ">
                  <label htmlFor="marriedInputControl">
                    Are the members husband and wife?
                    <span className="_required_bppll_1" role="asterisk">*</span>
                  </label>
                </div>
                <fieldset
                  className="radio-group _fixRadioMargin_1lntm_21 undefined"
                  data-testid="radio-group"
                >
                  <legend data-testid="legend" className="sr-only"> Are the members husband and wife? </legend>
                  <div>
                    <div
                      className={
                        spousesAnswer === "yes"
                          ? "radio-button radio-button--checked"
                          : "radio-button"
                      }
                    >
                      <input
                        tabIndex={0}
                        type="radio"
                        className="radio-button__input"
                        id="marriedInputControl_yes"
                        name="marriedInputControl"
                        aria-required="true"
                        value="yes"
                        checked={spousesAnswer === "yes"}
                        onChange={handleSpousesChange}
                      />
                      <label className="input-label " htmlFor="marriedInputControl_yes">
                        Yes
                      </label>
                    </div>
                  </div>
                  <div>
                    <div
                      className={
                        spousesAnswer === "no"
                          ? "radio-button radio-button--checked"
                          : "radio-button"
                      }
                    >
                      <input
                        tabIndex={0}
                        type="radio"
                        className="radio-button__input"
                        id="marriedInputControl_no"
                        name="marriedInputControl"
                        aria-required="true"
                        value="no"
                        checked={spousesAnswer === "no"}
                        onChange={handleSpousesChange}
                      />
                      <label className="input-label " htmlFor="marriedInputControl_no">
                        No
                      </label>
                    </div>
                  </div>
                </fieldset>
                <p className="input-error-message" aria-live="polite">{marriedError}</p>
              </div>
            </>
          )}

          {/* ── QJV section: count==="2" && CP state && spouses==="yes" ──────────
               whichLlcInstructions title/additionalText/links + whichLlcInputControl
               verbatim from irs-captures/json/ein__legalStructure.json
               inputName="whichLlcInput" per bundle Ki call Ki(b.whichLlcInputControl,"whichLlcInput")
               error text verbatim incl. "LCC" typo from whichLlcInputControl_error1 */}
          {membersCount === "2" && isCommunityPropertyState(selectedState) && spousesAnswer === "yes" && (
            <>
              <section className="_bottomMargin16_2vtt5_57">
                <div>
                  <h3>You are husband and wife residing in a community property state and the only two members of a Limited Liability Company (LLC)</h3>
                  <p>
                    Under Revenue Procedure 2002-69, you have the option of treating the LLC as a{" "}
                    <a
                      href="https://sa.www4.irs.gov/applyein/glossary#multiMemberLLC"
                      aria-label="multi-member LLC"
                      className="link link--blue link--no-padding"
                    >
                      multi-member LLC
                    </a>{" "}
                    or as a{" "}
                    <a
                      href="https://sa.www4.irs.gov/applyein/glossary#singleMemberLLC"
                      aria-label="single-member LLC"
                      className="link link--blue link--no-padding"
                    >
                      single-member LLC
                    </a>
                  </p>
                </div>
              </section>

              <div className="radioInput _bottomMargin18_1lntm_13 ">
                <div className="inputInstruction _bottomMargin8_bppll_6 ">
                  <label htmlFor="whichLlcInput">
                    Please choose how you want to be classified
                    <span className="_required_bppll_1" role="asterisk">*</span>
                  </label>
                </div>
                <fieldset
                  className="radio-group _fixRadioMargin_1lntm_21 undefined"
                  data-testid="radio-group"
                >
                  <legend data-testid="legend" className="sr-only"> Please choose how you want to be classified </legend>
                  <div>
                    <div
                      className={
                        qjvElection === "MULTI_MEMBER_LLC"
                          ? "radio-button radio-button--checked"
                          : "radio-button"
                      }
                    >
                      <input
                        tabIndex={0}
                        type="radio"
                        className="radio-button__input"
                        id="whichLlcInput_MULTI_MEMBER_LLC"
                        name="whichLlcInput"
                        aria-required="true"
                        value="MULTI_MEMBER_LLC"
                        checked={qjvElection === "MULTI_MEMBER_LLC"}
                        onChange={handleQjvChange}
                      />
                      <label className="input-label " htmlFor="whichLlcInput_MULTI_MEMBER_LLC">
                        Multi-member LLC
                      </label>
                    </div>
                  </div>
                  <div>
                    <div
                      className={
                        qjvElection === "SINGLE_MEMBER_LLC"
                          ? "radio-button radio-button--checked"
                          : "radio-button"
                      }
                    >
                      <input
                        tabIndex={0}
                        type="radio"
                        className="radio-button__input"
                        id="whichLlcInput_SINGLE_MEMBER_LLC"
                        name="whichLlcInput"
                        aria-required="true"
                        value="SINGLE_MEMBER_LLC"
                        checked={qjvElection === "SINGLE_MEMBER_LLC"}
                        onChange={handleQjvChange}
                      />
                      <label className="input-label " htmlFor="whichLlcInput_SINGLE_MEMBER_LLC">
                        Single-member LLC
                      </label>
                    </div>
                  </div>
                </fieldset>
                <p className="input-error-message" aria-live="polite">{qjvError}</p>
              </div>
            </>
          )}
        </>
      )}

      {/* ── trustSection (Slice 5b) ──────────────────────────────────────────
           Gate: selectedStructure === "ALL_OTHERS_TRUST"
           Verbatim from ein__legalStructure.json → trustSection:
             instructions3.title / additionalText (IRSLink1 = "Type of trust")
             trustEntityInputControl.id / fieldName / 18 choices (text only)
             inputErrorMessages[0].text (id: trustEntityInputControl_error1) */}
      {selectedStructure === "ALL_OTHERS_TRUST" && (
        <>
          <section className="_bottomMargin16_2vtt5_57">
            <div>
              <h3>Identify the type of Trust</h3>
              <p>
                You must identify one type of trust you are applying for. If you don&apos;t see
                your trust type, select &quot;Trust (All Others)&quot;
              </p>
            </div>
          </section>

          <div className="radioInput _bottomMargin18_1lntm_13 ">
            <div className="inputInstruction _bottomMargin8_bppll_6 ">
              <label htmlFor="trustEntityInputControl">
                Choose the type of legal structure
                <span className="_required_bppll_1" role="asterisk">*</span>
              </label>
            </div>
            <fieldset
              className="radio-group _fixRadioMargin_1lntm_21 undefined"
              data-testid="radio-group"
            >
              <legend data-testid="legend" className="sr-only">
                {" "}Choose the type of legal structure{" "}
              </legend>
              {TRUST_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <div
                    className={
                      trustType === opt.value
                        ? "radio-button radio-button--checked"
                        : "radio-button"
                    }
                  >
                    <input
                      tabIndex={0}
                      type="radio"
                      className="radio-button__input"
                      id={`trustEntityInputControl_${opt.value}`}
                      name="trustEntityInputControl"
                      aria-required="true"
                      value={opt.value}
                      checked={trustType === opt.value}
                      onChange={() => {
                        setTrustType(opt.value);
                        setTrustTypeError("");
                        setEntityType(opt.value);
                        setReasonForApplying("");
                        setReasonError("");
                      }}
                    />
                    <label
                      className="input-label "
                      htmlFor={`trustEntityInputControl_${opt.value}`}
                    >
                      {opt.text}
                    </label>
                  </div>
                </div>
              ))}
            </fieldset>
            <p className="input-error-message" aria-live="polite">
              {trustTypeError}
            </p>
          </div>
        </>
      )}

      {/* ── additionalTypeSection (Slice 5b) ────────────────────────────────
           Gate: selectedStructure === "OTHER_NON_PROFIT"
           Verbatim from ein__legalStructure.json → additionalTypeSection:
             instructions3.title / additionalText (§4 phone: 1-800-829-4933 → (954) 426-6424)
             additionalEntityInputControl.id / fieldName / 23 choices (text only)
             inputErrorMessages[0].text (id: additionalEntityInputControl_error1) */}
      {selectedStructure === "OTHER_NON_PROFIT" && (
        <>
          <section className="_bottomMargin16_2vtt5_57">
            <div>
              <h3>Additional Types</h3>
              <p>
                In order to obtain an EIN from the IRS, you must know what type of structure or
                organization you are setting up. If you need additional assistance, consult an
                accountant or other tax professional before applying for your EIN, or call the
                IRS at (954) 426-6424.
              </p>
            </div>
          </section>

          <div className="radioInput _bottomMargin18_1lntm_13 ">
            <div className="inputInstruction _bottomMargin8_bppll_6 ">
              <label htmlFor="additionalEntityInputControl">
                Choose the type of legal structure
                <span className="_required_bppll_1" role="asterisk">*</span>
              </label>
            </div>
            <fieldset
              className="radio-group _fixRadioMargin_1lntm_21 undefined"
              data-testid="radio-group"
            >
              <legend data-testid="legend" className="sr-only">
                {" "}Choose the type of legal structure{" "}
              </legend>
              {ADDITIONAL_TYPE_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <div
                    className={
                      additionalType === opt.value
                        ? "radio-button radio-button--checked"
                        : "radio-button"
                    }
                  >
                    <input
                      tabIndex={0}
                      type="radio"
                      className="radio-button__input"
                      id={`additionalEntityInputControl_${opt.value}`}
                      name="additionalEntityInputControl"
                      aria-required="true"
                      value={opt.value}
                      checked={additionalType === opt.value}
                      onChange={() => {
                        setAdditionalType(opt.value);
                        setAdditionalTypeError("");
                        setEntityType(opt.value);
                        setReasonForApplying("");
                        setReasonError("");
                      }}
                    />
                    <label
                      className="input-label "
                      htmlFor={`additionalEntityInputControl_${opt.value}`}
                    >
                      {opt.text}
                    </label>
                  </div>
                </div>
              ))}
            </fieldset>
            <p className="input-error-message" aria-live="polite">
              {additionalTypeError}
            </p>
          </div>
        </>
      )}

      {/* ── Reason for applying section (Slice 4 + extended Slice 5b) ──────────
           Gate: entityType !== "" (applies to ALL structures)
           ESTATE: entityType resolves to "ESTATE" immediately on top-level selection;
             reason section shows without any sub-type panel above.
           All others: reason shows after sub-type radio resolves entityType.

           Section header verbatim from:
             ein__legalStructure.json → primaryReasonSection.instructions3
             {{entityName}} resolved from ENTITY_NAMES[entityType] lookup.

           Radio choices verbatim from:
             primaryReasonSection.reasonForApplyingInputControl.choices

           Error verbatim from:
             primaryReasonSection.reasonForApplyingInputControl
             .inputErrorMessages[0].text ────────────────────────────────── */}
      {entityType !== "" && (
        <>
          <section className="_bottomMargin16_2vtt5_57">
            <div>
              <h3>Why is the {resolvedEntityName} requesting an EIN?</h3>
              <p>
                If your main reason for applying is not on the list, please select the option you
                feel is closest to your main reason. If more than one reason applies to you,
                choose the best or main reason.{" "}
              </p>
            </div>
          </section>

          <div className="radioInput _bottomMargin18_1lntm_13 ">
            <div className="inputInstruction _bottomMargin8_bppll_6 ">
              {/* label htmlFor resolves to the active control id per entityType (Slice 5c) */}
              <label htmlFor={reasonControlId}>
                Choose one reason that best describes why you are applying for an EIN
                <span className="_required_bppll_1" role="asterisk">*</span>
              </label>
            </div>

            <fieldset
              className="radio-group _fixRadioMargin_1lntm_21 undefined"
              data-testid="radio-group"
            >
              <legend data-testid="legend" className="sr-only">
                {" "}Choose one reason that best describes why you are applying for an EIN{" "}
              </legend>

              {/* Slice 5c: reasonOptions resolves to HOA (3), RECEIVERSHIP (2), or
                   standard (5) variant per entityType. reasonControlId drives id/name.
                   All share name=reason_for_applying via hidden input — no actions.ts change.
                   Choice text + additionalText verbatim from ein__legalStructure.json:
                   homeownersReasonInputControl / receivershipReasonInputControl /
                   reasonForApplyingInputControl. */}
              {reasonOptions.map((opt) => (
                <div key={opt.value}>
                  <div
                    className={
                      reasonForApplying === opt.value
                        ? "radio-button radio-button--checked"
                        : "radio-button"
                    }
                  >
                    <input
                      tabIndex={0}
                      type="radio"
                      className="radio-button__input"
                      id={`${reasonControlId}_${opt.value}`}
                      name={reasonControlId}
                      aria-required="true"
                      value={opt.value}
                      checked={reasonForApplying === opt.value}
                      onChange={() => {
                        setReasonForApplying(opt.value);
                        setReasonError("");
                      }}
                    />
                    <label
                      className="input-label "
                      htmlFor={`${reasonControlId}_${opt.value}`}
                    >
                      {opt.text}
                    </label>
                  </div>
                  <p className="_choiceAdditionalText_1lntm_34">{opt.help}</p>
                </div>
              ))}
            </fieldset>

            <p className="input-error-message" aria-live="polite">
              {reasonError}
            </p>
          </div>
        </>
      )}

      {/* ── Navigation buttons ──────────────────────────────────────────────── */}
      {/* Verbatim class names + aria-labels from capture. Both are <a role="button">
          in the original IRS SPA — we preserve role="button" and tabIndex.
          duplicate id="anchor-ui-0" on both Back and Continue is verbatim (IRS bug). */}
      <div className="_verticalMargin40_2vtt5_103">
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a
          href="#"
          className="irs-button irs-button--active inverted _fixButtonContrast_2vtt5_24 _fixButtonCapitals_2vtt5_28 buttonStyle _rightMargin8_2vtt5_108 "
          tabIndex={0}
          role="button"
          id="anchor-ui-0"
          aria-label="Back"
          onClick={handleBack}
        >
          Back
        </a>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a
          href="#"
          className="irs-button irs-button--active _fixButtonContrast_2vtt5_24 _fixButtonCapitals_2vtt5_28 buttonStyle"
          tabIndex={0}
          role="button"
          id="anchor-ui-0"
          aria-label="Continue"
          onClick={handleContinue}
        >
          Continue
        </a>
        <br />
        <br />
        <a
          href="/irs/ein/apply"
          aria-label="Cancel link, click enter to go to Apply for EIN Page"
          target="_self"
          className="link link--blue link--no-padding"
        >
          Cancel
        </a>
      </div>
    </>,
    portalTarget,
  );
}
