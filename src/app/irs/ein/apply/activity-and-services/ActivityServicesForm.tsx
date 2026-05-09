"use client";

/**
 * ActivityServicesForm — IRS EIN Wizard Step 5 (Slice 7)
 *
 * Renders the interactive form area for the Activity & Services step.
 * Portals into #w5-form-portal inside wizard-step-5.html.
 *
 * ── Content sources (HR#1) ───────────────────────────────────────────────────
 *
 * Primary choice labels + descriptions:
 *   Verbatim from captured HTML:
 *   IRS_Website/9_EIN WIZARD.../5_Activity_and_Services/
 *   "IRS Apply for an Employer Identification Number (EIN) online.html"
 *
 * Sub-activity choice labels:
 *   Verbatim from irs-captures/json/ein__reviewAndSubmit.json → principalService map.
 *   Keys with no principalService entry (e.g. construction "3"/"4" sub-choices,
 *   wholesale prompts, health care yes/no prompt) are gap-filled per HR#1 clause 2
 *   (prose-walkthrough). Marked with [gap-fill] in comments.
 *
 * Sub-section headers:
 *   Verbatim where captured (Other sub-section: from HTML capture screenshots).
 *   Not captured for other primaries — gap-filled per HR#1 clause 2.
 *   Marked with [gap-fill] in comments.
 *
 * Conditional rendering logic:
 *   Mirrors mf() renderer in irs-captures/js/index-ChwXuGQH.js verbatim.
 *
 * ── Sections ─────────────────────────────────────────────────────────────────
 *
 * Section 1: What does your business or organization do?
 *   businessCategoryInputControl — primary radio (15 choices)
 *
 * Section 2: Conditional sub-activity section per primary selection
 *   One of 15 sub-section renders, each with its own radio/text inputs.
 *   WAREHOUSING: no sub-section (direct value).
 *
 * Navigation:
 *   Back    → /irs/ein/apply/additional-details
 *   Continue → submitActivityServices() server action
 *   Cancel  → modal (Su() in bundle)
 *
 * Button classes: verbatim from Activity & Services capture (same CSS module as W4):
 *   Back:     irs-button irs-button--active _fixButtonContrast_1w9ml_81 _fixButtonCapitals_1w9ml_85 buttonStyle _rightMargin8_1w9ml_177
 *   Continue: irs-button irs-button--active inverted _fixButtonContrast_1w9ml_81 _fixButtonCapitals_1w9ml_85 buttonStyle
 */

import { useEffect, useRef, useState } from "react";
import ErrorSummary from "@/components/irs/ErrorSummary";
import { createPortal }                 from "react-dom";
import { submitActivityServices }       from "./actions";

export type ActivityServicesPrefill = {
  primaryActivity?:       string;
  otherPrincipalActivity?: string;
  principalService?:      string;
  otherPrincipalService?: string;
};

// ── Verbatim primary choice list ──────────────────────────────────────────────
// Source: captured HTML — "IRS Apply for an Employer Identification Number (EIN) online.html"
// in IRS_Website/9_EIN WIZARD.../5_Activity_and_Services/
const PRIMARY_CHOICES = [
  {
    value: "ACCOMMODATIONS",
    label: "Accommodations",
    description: "Casino hotel, hotel, or motel",
  },
  {
    value: "CONSTRUCTION",
    label: "Construction",
    description:
      "Building houses/residential structures, building industrial/commercial structures, specialty trade contractors, remodelers, heavy construction contractors, land subdivision contractors, or site preparation contractors",
  },
  {
    value: "FINANCE",
    label: "Finance",
    description:
      "Banks, sales financing, credit card issuing, mortgage company, mortgage company/broker, securities broker, investment advice, or trust administration",
  },
  {
    value: "FOOD_SERVICE",
    label: "Food Service",
    description:
      "Retail fast food, restaurant, bar, coffee shop, catering, or mobile food service",
  },
  {
    value: "HEALTH_CARE",
    label: "Health Care",
    description: "Doctor, mental health specialist, hospital, or outpatient care center",
  },
  {
    value: "INSURANCE",
    label: "Insurance",
    description: "Insurance company or broker",
  },
  {
    value: "MANUFACTURING",
    label: "Manufacturing",
    description:
      "Mechanical, physical, or chemical transformation of materials/substances/components into new products, including the assembly of components",
  },
  {
    value: "REAL_ESTATE",
    label: "Real Estate",
    description:
      "Renting or leasing real estate, managing real estate, real estate agent/broker, selling, buying, or renting real estate for others",
  },
  {
    value: "RENTAL_LEASING",
    label: "Rental & Leasing",
    description: "Rent/lease automobiles, consumer goods, commercial goods, or industrial goods",
  },
  {
    value: "RETAIL",
    label: "Retail",
    description:
      "Retail store, internet sales (exclusively), direct sales (catalogue, mail-order, door to door), auction house, or selling goods on auction sites",
  },
  {
    value: "SOCIAL_ASSISTANCE",
    label: "Social Assistance",
    description:
      "Youth services, residential care facility, services for the disabled, or community food/housing/relief services",
  },
  {
    value: "TRANSPORTATION",
    label: "Transportation",
    description:
      "Air transportation, rail transportation, water transportation, trucking, passenger transportation, support activity for transportation, or delivery/courier service",
  },
  {
    value: "WAREHOUSING",
    label: "Warehousing",
    description:
      "Operating warehousing or storage facilities for general merchandise, refrigerated goods, or other warehouse products; establishments that provide facilities to store goods but do not sell the goods they handle",
  },
  {
    value: "WHOLESALE",
    label: "Wholesale",
    description:
      "Wholesale agent/broker, importer, exporter, manufacturers\u2019 representative, merchant, distributor, or jobber",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "",
  },
] as const;

// ── Sub-activity choice lists ─────────────────────────────────────────────────
// Labels verbatim from irs-captures/json/ein__reviewAndSubmit.json → principalService map.
// [gap-fill] labels noted where no literal artifact covers the choice text.

// ACCOMMODATIONS — from principalService map
const ACCOMMODATIONS_CHOICES = [
  { value: "CASINO", label: "Casino hotel" },   // principalService.CASINO
  { value: "HOTEL",  label: "Hotel" },           // principalService.HOTEL
  { value: "MOTEL",  label: "Motel" },           // principalService.MOTEL
  { value: "OTHER",  label: "Other" },           // [gap-fill: standard "Other" choice]
];

// CONSTRUCTION first radio — yes/no about specialty trade work
// [gap-fill: text per HR#1 clause 2 — bundle values OTHER/NO, walkthrough context]
const CONSTRUCTION_FIRST_CHOICES = [
  { value: "OTHER", label: "Yes" }, // "OTHER" = specialty/subcontractor answer
  { value: "NO",    label: "No" },
];
// CONSTRUCTION third radio (when first = NO) — type of construction
const CONSTRUCTION_THIRD_CHOICES = [
  { value: "RESIDENTIAL_CONSTRUCTION", label: "Residential Construction" }, // reviewAndSubmit.principalService
  { value: "RESIDENTIAL_REMODELING",   label: "Residential Remodeling" },   // reviewAndSubmit.principalService
  { value: "3", label: "Other commercial or industrial" },  // [gap-fill: no literal; value "3" from bundle]
  { value: "4", label: "Other (describe below)" },          // [gap-fill: no literal; value "4" from bundle]
];

// FINANCE — from principalService map
const FINANCE_CHOICES = [
  { value: "COMMODITIES_BROKER", label: "Commodity Broker" },          // principalService
  { value: "CREDIT_CARD_ISSUER", label: "Credit card issuer" },        // principalService
  { value: "INVESTMENT_ADVICE",  label: "Investment advice" },         // principalService
  { value: "INVESTMENT_CLUB",    label: "Investment club" },           // principalService
  { value: "INVESTMENT_HOLDING", label: "Investment holding" },        // principalService
  { value: "MORGAGE_BROKER",     label: "Mortgage broker" },           // principalService (IRS spelling)
  { value: "MORGAGE_COMPANY",    label: "Mortgage company" },          // principalService (IRS spelling)
  { value: "PORTFOLIO_MANAGEMENT",label: "Portfolio management" },     // principalService
  { value: "SALES_FINANCING",    label: "Sales financing" },           // principalService
  { value: "SECURITIES_BROKER",  label: "Security Broker" },          // principalService
  { value: "TRUST_ADMIN",        label: "Trust Administration" },      // principalService
  { value: "VENTURE_CAPITAL",    label: "Venture capital company" },   // principalService
  { value: "OTHER",              label: "Other" },                     // [gap-fill]
];

// FOOD SERVICE — from principalService map
const FOOD_CHOICES = [
  { value: "BAR",                label: "Bar" },                        // principalService
  { value: "BAR_RESTAURANT",     label: "Bar and Restaurant" },         // principalService
  { value: "CATERING",           label: "Catering" },                   // principalService
  { value: "COFFEE_SHOP",        label: "Coffee shop" },                // principalService
  { value: "FAST_FOOD",          label: "Retail fast food" },           // principalService
  { value: "RESTAURANT",         label: "Full service restaurant" },    // principalService
  { value: "ICE_CREAM_SHOP",     label: "Ice cream shop" },             // principalService
  { value: "MOBILE_FOOD_SERVICES",label: "Mobile food service" },      // principalService
  { value: "OTHER",              label: "Other" },                      // [gap-fill]
];

// HEALTH CARE — first yes/no radio
// [gap-fill: prompt text from HR#1 clause 2 walkthrough]
const HEALTH_CARE_FIRST_CHOICES = [
  { value: "yes", label: "Yes" },
  { value: "no",  label: "No" },
];
// Health Care — yes path (licensed providers) — from principalService map
const HEALTH_CARE_YES_CHOICES = [
  { value: "MEDICAL_DOCTOR",         label: "Medical doctor" },          // principalService
  { value: "PSYCHIATRIST",           label: "Psychiatrist" },            // principalService
  { value: "CHIROPRACTOR",           label: "Chiropractor" },            // principalService
  { value: "DENTIST",                label: "Dentist" },                 // principalService
  { value: "HMO_MEDICAL_CENTER",     label: "HMO medical center" },      // principalService
  { value: "HOSPITAL",               label: "Hospital" },                // principalService
  { value: "KIDNEY_DIALYSIS_CENTER", label: "Kidney dialysis center" },  // principalService
  { value: "OPTOMETRIST",            label: "Optometrist" },             // principalService
  { value: "OUTPATIENT_CARE_CENTER", label: "Outpatient care center" },  // principalService
  { value: "PODIATRIST",             label: "Podiatrist" },              // principalService
  { value: "PSYCHOLOGIST",           label: "Psychologist" },            // principalService
  { value: "OTHER",                  label: "Other" },                   // [gap-fill]
];
// Health Care — no path (facility types) — from principalService map
const HEALTH_CARE_NO_CHOICES = [
  { value: "NURSING_HOME",    label: "Nursing home" },     // principalService
  { value: "SHELTER",         label: "Shelter" },          // principalService
  { value: "YOUTH_SERVICES",  label: "Youth services" },   // principalService
  { value: "10",              label: "Other (describe below)" }, // [gap-fill: bundle value "10"]
  { value: "11",              label: "Other (specify)" },  // [gap-fill: bundle value "11"]
];

// INSURANCE — from principalService map
const INSURANCE_CHOICES = [
  { value: "CARRIER", label: "Insurance Carrier" }, // principalService
  { value: "AGENT",   label: "Insurance Agent" },   // principalService
  { value: "OTHER",   label: "Other" },             // [gap-fill]
];

// REAL ESTATE — sub-type radio
// [gap-fill: RENTAL_PROPERTY / CAPITAL_PROVIDER / OTHER per bundle]
const REAL_ESTATE_CHOICES = [
  { value: "RENTAL_PROPERTY",   label: "Rental property" },         // [gap-fill]
  { value: "CAPITAL_PROVIDER",  label: "Capital provider" },        // [gap-fill]
  { value: "OTHER",             label: "Other" },                   // [gap-fill]
];
// Real Estate — rental sub-choices — from principalService map
const REAL_ESTATE_RENTAL_CHOICES = [
  { value: "RESIDENTIAL_REAL_ESTATE_RENTALS", label: "Residential real estate rentals" }, // principalService
  { value: "REAL_ESTATE_COMMERCIAL_RENTING",  label: "Real estate commercial renting" },  // principalService
  { value: "REAL_ESTATE_PROPERTY_MANAGEMENT", label: "Real estate property management" }, // principalService
  { value: "REAL_ESTATE_AGENT",               label: "Real estate agent" },               // principalService
  { value: "OTHER",                           label: "Other" },                           // [gap-fill]
];

// RENTAL & LEASING — primary sub-radio
// [gap-fill: REAL_ESTATE / OTHER per bundle rentalLeasingActivitiesFirstInputControl]
const RENTAL_LEASING_CHOICES = [
  { value: "REAL_ESTATE", label: "Real estate" },   // [gap-fill]
  { value: "OTHER",       label: "Other goods" },   // [gap-fill]
];
// Rental & Leasing → Real Estate → third radio (reuses real-estate rental sub-choices)
// Same REAL_ESTATE_RENTAL_CHOICES list

// RETAIL — sub-radio
const RETAIL_CHOICES = [
  { value: "STOREFRONT",   label: "Storefront" },      // [gap-fill: bundle value]
  { value: "DIRECT_SALES", label: "Direct sales" },    // [gap-fill: bundle value]
  { value: "INTERNET",     label: "Internet Sales" },  // principalService.INTERNET
  { value: "AUCTION_HOUSE",label: "Auction House" },   // principalService.AUCTION_HOUSE
  { value: "OTHER",        label: "Other" },           // [gap-fill]
];

// SOCIAL ASSISTANCE — from principalService map
const SOCIAL_CHOICES = [
  { value: "NURSING_HOME",   label: "Nursing home" },   // principalService
  { value: "SHELTER",        label: "Shelter" },        // principalService
  { value: "YOUTH_SERVICES", label: "Youth services" }, // principalService
  { value: "OTHER",          label: "Other" },          // [gap-fill]
];

// TRANSPORTATION — first radio (type of transportation)
const TRANSPORTATION_FIRST_CHOICES = [
  { value: "CARGO",     label: "Cargo" },              // [gap-fill: bundle value]
  { value: "PASSENGER", label: "Passenger" },          // [gap-fill: bundle value]
  { value: "OTHER",     label: "Support activity" },   // [gap-fill: bundle value "OTHER" = support]
];
// Transportation — Cargo sub-choices — from principalService map
const TRANSPORT_CARGO_CHOICES = [
  { value: "AIR_TRANSPORTATION",   label: "Air transportation" },   // principalService
  { value: "RAIL_TRANSPORTATION",  label: "Rail transportation" },  // principalService
  { value: "WATER_TRANSPORTATION", label: "Water transportation" }, // principalService
  { value: "TRUCKING",             label: "Trucking" },             // principalService
  { value: "OTHER",                label: "Other" },                // [gap-fill]
];
// Transportation — Passenger sub-choices — from principalService map
const TRANSPORT_PASSENGER_CHOICES = [
  { value: "LIMOUSINE_SERVICE", label: "Limousine service" }, // principalService
  { value: "SHUTTLE_BUS",       label: "Shuttle bus" },       // principalService
  { value: "TAXI_SERVICE",      label: "Taxis service" },     // principalService (IRS spelling)
  { value: "OTHER",             label: "Other" },             // [gap-fill]
];

// WHOLESALE — yes/no radio (are you a wholesale agent/broker?)
// [gap-fill: prompt per HR#1 clause 2 walkthrough]
const WHOLESALE_FIRST_CHOICES = [
  { value: "yes", label: "Yes" },
  { value: "no",  label: "No" },
];
// Wholesale — if no → second yes/no (another wholesale type?)
const WHOLESALE_THIRD_CHOICES = [
  { value: "yes", label: "Yes" },
  { value: "no",  label: "No" },
];

// OTHER primary sub-radio — verbatim from captured HTML screenshot 3
const OTHER_SUB_CHOICES = [
  { value: "CONSULTING",    label: "Consulting" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "ORGANIZATION",  label: "Organization (such as religious, environmental, social or civic, athletic, etc.)" },
  { value: "RENTAL",        label: "Rental" },
  { value: "REPAIR",        label: "Repair" },
  { value: "GOODS_SELLER",  label: "Sell goods" },
  { value: "SERVICE",       label: "Service" },
  { value: "OTHER",         label: "Other" },
];

// OTHER → CONSULTING — yes/no radio
// [gap-fill: per bundle otherConsultYN = yes → type of consulting, no → activity]
const OTHER_CONSULT_YN_CHOICES = [
  { value: "yes", label: "Yes" },
  { value: "no",  label: "No" },
];

// OTHER → ORGANIZATION — sub-radio
// [gap-fill: values and labels from bundle otherOrganizationRadioInput]
const OTHER_ORG_CHOICES = [
  { value: "athletic",    label: "Athletic" },
  { value: "conservation",label: "Conservation" },
  { value: "environmental",label: "Environmental" },
  { value: "fundraising", label: "Fundraising" },
  { value: "hoa",         label: "Homeowners Association" },
  { value: "religious",   label: "Religious" },
  { value: "socialCivic", label: "Social/Civic" },
  { value: "other",       label: "Other" },
];

// OTHER → RENTAL — sub-radio (1=real estate, 2=goods)
// [gap-fill: bundle values "1"/"2"]
const OTHER_RENTAL_CHOICES = [
  { value: "1", label: "Real estate" },
  { value: "2", label: "Goods" },
];

// OTHER → GOODS_SELLER — sub-radio (1=retail, 2=wholesale)
// [gap-fill: bundle values "1"/"2"]
const OTHER_SELL_CHOICES = [
  { value: "1", label: "Retail" },
  { value: "2", label: "Wholesale" },
];

// ── Helper components ─────────────────────────────────────────────────────────

type RadioGroupProps = {
  name: string;
  choices: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  errorMsg?: string;
};

function RadioGroup({ name, choices, value, onChange, required, errorMsg }: RadioGroupProps) {
  return (
    <div className="radioInput _bottomMargin18_1lntm_13 ">
      <fieldset className="radio-group _fixRadioMargin_1lntm_21 undefined" data-testid="radio-group">
        <legend className="sr-only">{name}</legend>
        {choices.map((c) => (
          <div key={c.value}>
            <div className={value === c.value ? "radio-button radio-button--checked" : "radio-button"}>
              <input
                tabIndex={0}
                type="radio"
                className="radio-button__input"
                id={`${c.value}${name}id`}
                name={name}
                value={c.value}
                checked={value === c.value}
                onChange={() => onChange(c.value)}
                aria-required={required}
              />
              <label className="input-label " htmlFor={`${c.value}${name}id`}>
                {c.label}
              </label>
            </div>
          </div>
        ))}
      </fieldset>
      {errorMsg && (
        <p className="input-error-message" aria-live="polite">{errorMsg}</p>
      )}
    </div>
  );
}

type TextInputProps = {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  errorMsg?: string;
};

function TextInputField({ name, label, value, onChange, required, errorMsg }: TextInputProps) {
  return (
    <div className="textInput _bottomMargin24_mw6ug_13 ">
      <div className="inputInstruction _bottomMargin8_bppll_6 ">
        <label htmlFor={`${name}Input`}>
          {label}
          {required && <span className="_required_bppll_1" role="asterisk">*</span>}
        </label>
      </div>
      <div className="undefined _removeInlineErrorMargin_mw6ug_17">
        <div>
          <input
            id={`${name}Input`}
            name={name}
            type="text"
            className={`input-text ${errorMsg ? "input-text--error" : "null"} `}
            placeholder=""
            autoComplete="off"
            autoCorrect="off"
            required={required}
            aria-required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <p className="input-error-message" aria-live="polite">{errorMsg ?? ""}</p>
        </div>
      </div>
    </div>
  );
}

type SectionHeaderProps = { title: string };
function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <h4
      className={`sectionHeader _fontSize20_1w9ml_49 _topMargin24_1w9ml_115 _bottomMargin8_1w9ml_122`}
    >
      {title}
    </h4>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ActivityServicesForm({
  prefill = {},
}: {
  prefill?: ActivityServicesPrefill;
}) {
  const [mounted,  setMounted]  = useState(false);
  const portalRef               = useRef<Element | null>(null);
  const formRef                 = useRef<HTMLFormElement>(null);

  // ── Primary selection ──────────────────────────────────────────────────────
  const [primary, setPrimary] = useState<string>(prefill.primaryActivity ?? "");
  const [primaryErr, setPrimaryErr] = useState("");
  // Page-level error summary (Slice 11) — set on Continue click only
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  // ── Per-primary sub-state ──────────────────────────────────────────────────
  const [accommSub,       setAccommSub]       = useState("");
  const [accommOther,     setAccommOther]      = useState("");

  const [constFirst,      setConstFirst]       = useState("");
  const [constOtherText,  setConstOtherText]   = useState("");
  const [constThird,      setConstThird]       = useState("");
  const [constFourthText, setConstFourthText]  = useState("");
  const [constFifthText,  setConstFifthText]   = useState("");

  const [financeSub,      setFinanceSub]       = useState("");
  const [financeOther,    setFinanceOther]      = useState("");

  const [foodSub,         setFoodSub]          = useState("");
  const [foodOther,       setFoodOther]        = useState("");

  const [healthFirst,     setHealthFirst]      = useState("");
  const [healthYesSub,    setHealthYesSub]     = useState("");
  const [healthYesOther,  setHealthYesOther]   = useState("");
  const [healthNoSub,     setHealthNoSub]      = useState("");
  const [healthNoOther,   setHealthNoOther]    = useState("");

  const [insuranceSub,    setInsuranceSub]     = useState("");
  const [insuranceOther,  setInsuranceOther]   = useState("");

  const [mfgText,         setMfgText]          = useState("");

  const [reSub,           setReSub]            = useState("");
  const [reRentalSub,     setReRentalSub]      = useState("");
  const [reRentalOther,   setReRentalOther]    = useState("");
  const [reOtherText,     setReOtherText]      = useState("");

  const [rentalSub,       setRentalSub]        = useState("");
  const [rentalThird,     setRentalThird]      = useState("");
  const [rentalOtherText, setRentalOtherText]  = useState("");

  const [retailSub,       setRetailSub]        = useState("");
  const [retailStorefront,setRetailStorefront] = useState("");
  const [retailDirect,    setRetailDirect]     = useState("");
  const [retailOther,     setRetailOther]      = useState("");

  const [socialSub,       setSocialSub]        = useState("");
  const [socialOther,     setSocialOther]      = useState("");

  const [transSub,        setTransSub]         = useState("");
  const [transCargoSub,   setTransCargoSub]    = useState("");
  const [transCargoOther, setTransCargoOther]  = useState("");
  const [transPassSub,    setTransPassSub]     = useState("");
  const [transPassOther,  setTransPassOther]   = useState("");
  const [transSupportText,setTransSupportText] = useState("");

  const [wholesaleFirst,  setWholesaleFirst]   = useState("");
  const [wholesaleAgText, setWholesaleAgText]  = useState("");
  const [wholesaleThird,  setWholesaleThird]   = useState("");
  const [wholesaleFourth, setWholesaleFourth]  = useState("");

  const [otherSub,        setOtherSub]         = useState("");
  const [otherConsultYN,  setOtherConsultYN]   = useState("");
  const [otherConsultType,setOtherConsultType] = useState("");
  const [otherConsultActivity, setOtherConsultActivity] = useState("");
  const [otherMfgText,    setOtherMfgText]     = useState("");
  const [otherOrgSub,     setOtherOrgSub]      = useState("");
  const [otherOrgOther,   setOtherOrgOther]    = useState("");
  const [otherRentalSub,  setOtherRentalSub]   = useState("");
  const [otherRentalReSub,setOtherRentalReSub] = useState("");
  const [otherRentalGoods,setOtherRentalGoods] = useState("");
  const [otherRepairText, setOtherRepairText]  = useState("");
  const [otherSellSub,    setOtherSellSub]     = useState("");
  const [otherServiceText,setOtherServiceText] = useState("");
  const [otherOtherText,  setOtherOtherText]   = useState("");

  // Mount + portal setup
  useEffect(() => {
    portalRef.current = document.getElementById("w5-form-portal");
    setMounted(true);
  }, []);

  // Reset sub-state when primary changes
  const handlePrimaryChange = (val: string) => {
    setPrimary(val);
    setPrimaryErr("");
    // Reset all sub-state so stale values don't leak into the form submission
    setAccommSub(""); setAccommOther("");
    setConstFirst(""); setConstOtherText(""); setConstThird(""); setConstFourthText(""); setConstFifthText("");
    setFinanceSub(""); setFinanceOther("");
    setFoodSub(""); setFoodOther("");
    setHealthFirst(""); setHealthYesSub(""); setHealthYesOther(""); setHealthNoSub(""); setHealthNoOther("");
    setInsuranceSub(""); setInsuranceOther("");
    setMfgText("");
    setReSub(""); setReRentalSub(""); setReRentalOther(""); setReOtherText("");
    setRentalSub(""); setRentalThird(""); setRentalOtherText("");
    setRetailSub(""); setRetailStorefront(""); setRetailDirect(""); setRetailOther("");
    setSocialSub(""); setSocialOther("");
    setTransSub(""); setTransCargoSub(""); setTransCargoOther(""); setTransPassSub(""); setTransPassOther(""); setTransSupportText("");
    setWholesaleFirst(""); setWholesaleAgText(""); setWholesaleThird(""); setWholesaleFourth("");
    setOtherSub(""); setOtherConsultYN(""); setOtherConsultType(""); setOtherConsultActivity("");
    setOtherMfgText(""); setOtherOrgSub(""); setOtherOrgOther(""); setOtherRentalSub("");
    setOtherRentalReSub(""); setOtherRentalGoods(""); setOtherRepairText(""); setOtherSellSub("");
    setOtherServiceText(""); setOtherOtherText("");
  };

  // ── Client-side validate before submit ────────────────────────────────────
  const handleContinue = () => {
    if (!primary) {
      const msg = "Please select a category.";
      setPrimaryErr(msg);
      setFieldErrors([msg]);
      return;
    }
    setFieldErrors([]);
    formRef.current?.requestSubmit();
  };

  // ── Sub-section render helpers ─────────────────────────────────────────────

  function renderAccommodations() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="What type of accommodation business do you operate?" />
        <RadioGroup
          name="accommSub"
          choices={ACCOMMODATIONS_CHOICES}
          value={accommSub}
          onChange={setAccommSub}
          required
        />
        {accommSub === "OTHER" && (
          <TextInputField
            name="accommOther"
            label="Describe the type of accommodation"
            value={accommOther}
            onChange={setAccommOther}
            required
          />
        )}
      </>
    );
  }

  function renderConstruction() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="Are you a specialty trade contractor?" />
        <RadioGroup
          name="constFirst"
          choices={CONSTRUCTION_FIRST_CHOICES}
          value={constFirst}
          onChange={(v) => { setConstFirst(v); setConstThird(""); setConstFourthText(""); setConstFifthText(""); }}
          required
        />
        {constFirst === "OTHER" && (
          <TextInputField
            name="constOtherText"
            label="Describe your specialty trade"
            value={constOtherText}
            onChange={setConstOtherText}
            required
          />
        )}
        {constFirst === "NO" && (
          <>
            {/* [gap-fill: third radio header per HR#1 clause 2] */}
            <SectionHeader title="What type of construction do you perform?" />
            <RadioGroup
              name="constThird"
              choices={CONSTRUCTION_THIRD_CHOICES}
              value={constThird}
              onChange={(v) => { setConstThird(v); setConstFourthText(""); setConstFifthText(""); }}
              required
            />
            {constThird === "3" && (
              <TextInputField
                name="constFourthText"
                label="Describe your commercial or industrial construction"
                value={constFourthText}
                onChange={setConstFourthText}
                required
              />
            )}
            {constThird === "4" && (
              <TextInputField
                name="constFifthText"
                label="Describe your construction activity"
                value={constFifthText}
                onChange={setConstFifthText}
                required
              />
            )}
          </>
        )}
        {/* Hidden inputs to pass through construction state for CAPITAL_PROVIDER real-estate sub-flow */}
        <input type="hidden" name="constFirst"      value={constFirst} />
        <input type="hidden" name="constOtherText"  value={constOtherText} />
        <input type="hidden" name="constThird"      value={constThird} />
        <input type="hidden" name="constFourthText" value={constFourthText} />
        <input type="hidden" name="constFifthText"  value={constFifthText} />
      </>
    );
  }

  function renderFinance() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="What type of finance activity does your business perform?" />
        <RadioGroup
          name="financeSub"
          choices={FINANCE_CHOICES}
          value={financeSub}
          onChange={(v) => { setFinanceSub(v); setFinanceOther(""); }}
          required
        />
        {financeSub === "OTHER" && (
          <TextInputField
            name="financeOther"
            label="Describe the finance activity"
            value={financeOther}
            onChange={setFinanceOther}
            required
          />
        )}
      </>
    );
  }

  function renderFoodService() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="What type of food service business do you operate?" />
        <RadioGroup
          name="foodSub"
          choices={FOOD_CHOICES}
          value={foodSub}
          onChange={(v) => { setFoodSub(v); setFoodOther(""); }}
          required
        />
        {foodSub === "OTHER" && (
          <TextInputField
            name="foodOther"
            label="Describe the food service"
            value={foodOther}
            onChange={setFoodOther}
            required
          />
        )}
      </>
    );
  }

  function renderHealthCare() {
    return (
      <>
        {/* [gap-fill: prompt per HR#1 clause 2 — bundle healthCareActivitiesFirstInputControl yes/no] */}
        <SectionHeader title="Is this a licensed health care provider?" />
        <RadioGroup
          name="healthFirst"
          choices={HEALTH_CARE_FIRST_CHOICES}
          value={healthFirst}
          onChange={(v) => {
            setHealthFirst(v);
            setHealthYesSub(""); setHealthYesOther("");
            setHealthNoSub(""); setHealthNoOther("");
          }}
          required
        />
        {healthFirst === "yes" && (
          <>
            {/* [gap-fill: sub-section header per HR#1 clause 2] */}
            <SectionHeader title="What type of health care provider?" />
            <RadioGroup
              name="healthYesSub"
              choices={HEALTH_CARE_YES_CHOICES}
              value={healthYesSub}
              onChange={(v) => { setHealthYesSub(v); setHealthYesOther(""); }}
              required
            />
            {healthYesSub === "OTHER" && (
              <TextInputField
                name="healthYesOther"
                label="Describe the health care service"
                value={healthYesOther}
                onChange={setHealthYesOther}
                required
              />
            )}
          </>
        )}
        {healthFirst === "no" && (
          <>
            {/* [gap-fill: sub-section header per HR#1 clause 2] */}
            <SectionHeader title="What type of health care facility?" />
            <RadioGroup
              name="healthNoSub"
              choices={HEALTH_CARE_NO_CHOICES}
              value={healthNoSub}
              onChange={(v) => { setHealthNoSub(v); setHealthNoOther(""); }}
              required
            />
            {(healthNoSub === "10" || healthNoSub === "11") && (
              <TextInputField
                name="healthNoOther"
                label="Describe the health care facility"
                value={healthNoOther}
                onChange={setHealthNoOther}
                required
              />
            )}
          </>
        )}
      </>
    );
  }

  function renderInsurance() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="What type of insurance business do you operate?" />
        <RadioGroup
          name="insuranceSub"
          choices={INSURANCE_CHOICES}
          value={insuranceSub}
          onChange={(v) => { setInsuranceSub(v); setInsuranceOther(""); }}
          required
        />
        {insuranceSub === "OTHER" && (
          <TextInputField
            name="insuranceOther"
            label="Describe the insurance activity"
            value={insuranceOther}
            onChange={setInsuranceOther}
            required
          />
        )}
      </>
    );
  }

  function renderManufacturing() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="Describe the products your business manufactures" />
        <TextInputField
          name="mfgText"
          label="Product or manufacturing activity"
          value={mfgText}
          onChange={setMfgText}
          required
        />
      </>
    );
  }

  function renderRealEstate() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="What type of real estate activity does your business perform?" />
        <RadioGroup
          name="reSub"
          choices={REAL_ESTATE_CHOICES}
          value={reSub}
          onChange={(v) => {
            setReSub(v);
            setReRentalSub(""); setReRentalOther(""); setReOtherText("");
          }}
          required
        />
        {reSub === "RENTAL_PROPERTY" && (
          <>
            {/* [gap-fill: sub-section header per HR#1 clause 2] */}
            <SectionHeader title="What type of rental property?" />
            <RadioGroup
              name="reRentalSub"
              choices={REAL_ESTATE_RENTAL_CHOICES}
              value={reRentalSub}
              onChange={(v) => { setReRentalSub(v); setReRentalOther(""); }}
              required
            />
            {reRentalSub === "OTHER" && (
              <TextInputField
                name="reRentalOther"
                label="Describe the real estate rental activity"
                value={reRentalOther}
                onChange={setReRentalOther}
                required
              />
            )}
          </>
        )}
        {reSub === "CAPITAL_PROVIDER" && renderConstruction()}
        {reSub === "OTHER" && (
          <TextInputField
            name="reOtherText"
            label="Describe the real estate activity"
            value={reOtherText}
            onChange={setReOtherText}
            required
          />
        )}
      </>
    );
  }

  function renderRentalLeasing() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="What type of rental or leasing activity does your business perform?" />
        <RadioGroup
          name="rentalSub"
          choices={RENTAL_LEASING_CHOICES}
          value={rentalSub}
          onChange={(v) => {
            setRentalSub(v);
            setRentalThird(""); setRentalOtherText("");
          }}
          required
        />
        {rentalSub === "REAL_ESTATE" && (
          <>
            {/* [gap-fill: third radio header per HR#1 clause 2] */}
            <SectionHeader title="What type of real estate rental?" />
            <RadioGroup
              name="rentalThird"
              choices={REAL_ESTATE_RENTAL_CHOICES}
              value={rentalThird}
              onChange={setRentalThird}
              required
            />
          </>
        )}
        {rentalSub === "OTHER" && (
          <TextInputField
            name="rentalOtherText"
            label="Describe the goods you rent or lease"
            value={rentalOtherText}
            onChange={setRentalOtherText}
            required
          />
        )}
      </>
    );
  }

  function renderRetail() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="What type of retail business do you operate?" />
        <RadioGroup
          name="retailSub"
          choices={RETAIL_CHOICES}
          value={retailSub}
          onChange={(v) => {
            setRetailSub(v);
            setRetailStorefront(""); setRetailDirect(""); setRetailOther("");
          }}
          required
        />
        {retailSub === "STOREFRONT" && (
          <TextInputField
            name="retailStorefront"
            label="Describe the products sold at your storefront"
            value={retailStorefront}
            onChange={setRetailStorefront}
            required
          />
        )}
        {retailSub === "DIRECT_SALES" && (
          <TextInputField
            name="retailDirect"
            label="Describe the products sold through direct sales"
            value={retailDirect}
            onChange={setRetailDirect}
            required
          />
        )}
        {retailSub === "OTHER" && (
          <TextInputField
            name="retailOther"
            label="Describe the retail activity"
            value={retailOther}
            onChange={setRetailOther}
            required
          />
        )}
        {/* Pass through retail sub-state for OTHER→GOODS_SELLER→Retail sub-flow */}
        <input type="hidden" name="retailSub"        value={retailSub} />
        <input type="hidden" name="retailStorefront" value={retailStorefront} />
        <input type="hidden" name="retailDirect"     value={retailDirect} />
        <input type="hidden" name="retailOther"      value={retailOther} />
      </>
    );
  }

  function renderSocialAssistance() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="What type of social assistance does your organization provide?" />
        <RadioGroup
          name="socialSub"
          choices={SOCIAL_CHOICES}
          value={socialSub}
          onChange={(v) => { setSocialSub(v); setSocialOther(""); }}
          required
        />
        {socialSub === "OTHER" && (
          <TextInputField
            name="socialOther"
            label="Describe the social assistance activity"
            value={socialOther}
            onChange={setSocialOther}
            required
          />
        )}
      </>
    );
  }

  function renderTransportation() {
    return (
      <>
        {/* [gap-fill: sub-section header per HR#1 clause 2] */}
        <SectionHeader title="What type of transportation does your business provide?" />
        <RadioGroup
          name="transSub"
          choices={TRANSPORTATION_FIRST_CHOICES}
          value={transSub}
          onChange={(v) => {
            setTransSub(v);
            setTransCargoSub(""); setTransCargoOther("");
            setTransPassSub(""); setTransPassOther("");
            setTransSupportText("");
          }}
          required
        />
        {transSub === "CARGO" && (
          <>
            {/* [gap-fill: sub-section header per HR#1 clause 2] */}
            <SectionHeader title="What type of cargo transportation?" />
            <RadioGroup
              name="transCargoSub"
              choices={TRANSPORT_CARGO_CHOICES}
              value={transCargoSub}
              onChange={(v) => { setTransCargoSub(v); setTransCargoOther(""); }}
              required
            />
            {transCargoSub === "OTHER" && (
              <TextInputField
                name="transCargoOther"
                label="Describe the cargo transportation activity"
                value={transCargoOther}
                onChange={setTransCargoOther}
                required
              />
            )}
          </>
        )}
        {transSub === "PASSENGER" && (
          <>
            {/* [gap-fill: sub-section header per HR#1 clause 2] */}
            <SectionHeader title="What type of passenger transportation?" />
            <RadioGroup
              name="transPassSub"
              choices={TRANSPORT_PASSENGER_CHOICES}
              value={transPassSub}
              onChange={(v) => { setTransPassSub(v); setTransPassOther(""); }}
              required
            />
            {transPassSub === "OTHER" && (
              <TextInputField
                name="transPassOther"
                label="Describe the passenger transportation activity"
                value={transPassOther}
                onChange={setTransPassOther}
                required
              />
            )}
          </>
        )}
        {transSub === "OTHER" && (
          <TextInputField
            name="transSupportText"
            label="Describe the transportation support activity"
            value={transSupportText}
            onChange={setTransSupportText}
            required
          />
        )}
      </>
    );
  }

  function renderWholesale() {
    return (
      <>
        {/* [gap-fill: prompt per HR#1 clause 2] */}
        <SectionHeader title="Are you a wholesale agent or broker?" />
        <RadioGroup
          name="wholesaleFirst"
          choices={WHOLESALE_FIRST_CHOICES}
          value={wholesaleFirst}
          onChange={(v) => {
            setWholesaleFirst(v);
            setWholesaleAgText(""); setWholesaleThird(""); setWholesaleFourth("");
          }}
          required
        />
        {wholesaleFirst === "yes" && (
          <TextInputField
            name="wholesaleAgText"
            label="Describe the type of wholesale agent or broker activity"
            value={wholesaleAgText}
            onChange={setWholesaleAgText}
            required
          />
        )}
        {wholesaleFirst === "no" && (
          <>
            {/* [gap-fill: third radio prompt per HR#1 clause 2] */}
            <SectionHeader title="Are you a wholesale merchant, distributor, or jobber?" />
            <RadioGroup
              name="wholesaleThird"
              choices={WHOLESALE_THIRD_CHOICES}
              value={wholesaleThird}
              onChange={(v) => { setWholesaleThird(v); setWholesaleFourth(""); }}
              required
            />
            {wholesaleThird === "no" && (
              <TextInputField
                name="wholesaleFourth"
                label="Describe the wholesale activity"
                value={wholesaleFourth}
                onChange={setWholesaleFourth}
                required
              />
            )}
          </>
        )}
        {/* Pass through wholesale sub-state for OTHER→GOODS_SELLER→Wholesale sub-flow */}
        <input type="hidden" name="wholesaleFirst"  value={wholesaleFirst} />
        <input type="hidden" name="wholesaleAgText" value={wholesaleAgText} />
        <input type="hidden" name="wholesaleThird"  value={wholesaleThird} />
        <input type="hidden" name="wholesaleFourth" value={wholesaleFourth} />
      </>
    );
  }

  function renderOther() {
    return (
      <>
        {/* Verbatim from captured HTML screenshot 3 */}
        <SectionHeader title="Tell us more about your Other activities" />
        <div className="inputInstruction _bottomMargin8_bppll_6 ">
          <label>
            {/* Verbatim from captured HTML screenshot 3 */}
            Please choose one of the following that best describes your primary business activity:
            <span className="_required_bppll_1" role="asterisk">*</span>
          </label>
        </div>
        <RadioGroup
          name="otherSub"
          choices={OTHER_SUB_CHOICES}
          value={otherSub}
          onChange={(v) => {
            setOtherSub(v);
            setOtherConsultYN(""); setOtherConsultType(""); setOtherConsultActivity("");
            setOtherMfgText(""); setOtherOrgSub(""); setOtherOrgOther(""); setOtherRentalSub("");
            setOtherRentalReSub(""); setOtherRentalGoods(""); setOtherRepairText("");
            setOtherSellSub(""); setOtherServiceText(""); setOtherOtherText("");
          }}
          required
        />

        {/* CONSULTING sub-flow */}
        {otherSub === "CONSULTING" && (
          <>
            {/* [gap-fill: prompt per HR#1 clause 2] */}
            <SectionHeader title="Do you specialize in a specific type of consulting?" />
            <RadioGroup
              name="otherConsultYN"
              choices={OTHER_CONSULT_YN_CHOICES}
              value={otherConsultYN}
              onChange={(v) => {
                setOtherConsultYN(v);
                setOtherConsultType(""); setOtherConsultActivity("");
              }}
              required
            />
            {otherConsultYN === "yes" && (
              <TextInputField
                name="otherConsultType"
                label="Describe the type of consulting"
                value={otherConsultType}
                onChange={setOtherConsultType}
                required
              />
            )}
            {otherConsultYN === "no" && (
              <TextInputField
                name="otherConsultActivity"
                label="Describe your business consulting activity"
                value={otherConsultActivity}
                onChange={setOtherConsultActivity}
                required
              />
            )}
          </>
        )}

        {/* MANUFACTURING sub-flow */}
        {otherSub === "MANUFACTURING" && (
          <TextInputField
            name="otherMfgText"
            label="Describe the products your business manufactures"
            value={otherMfgText}
            onChange={setOtherMfgText}
            required
          />
        )}

        {/* ORGANIZATION sub-flow */}
        {otherSub === "ORGANIZATION" && (
          <>
            {/* [gap-fill: sub-section header per HR#1 clause 2] */}
            <SectionHeader title="What type of organization is this?" />
            <RadioGroup
              name="otherOrgSub"
              choices={OTHER_ORG_CHOICES}
              value={otherOrgSub}
              onChange={(v) => { setOtherOrgSub(v); setOtherOrgOther(""); }}
              required
            />
            {otherOrgSub !== "" && otherOrgSub !== "hoa" && (
              <TextInputField
                name="otherOrgOther"
                label="Describe the organization"
                value={otherOrgOther}
                onChange={setOtherOrgOther}
                required
              />
            )}
          </>
        )}

        {/* RENTAL sub-flow */}
        {otherSub === "RENTAL" && (
          <>
            {/* [gap-fill: sub-section header per HR#1 clause 2] */}
            <SectionHeader title="What do you rent?" />
            <RadioGroup
              name="otherRentalSub"
              choices={OTHER_RENTAL_CHOICES}
              value={otherRentalSub}
              onChange={(v) => {
                setOtherRentalSub(v);
                setOtherRentalReSub(""); setOtherRentalGoods("");
              }}
              required
            />
            {otherRentalSub === "1" && (
              <>
                {/* [gap-fill: third radio header per HR#1 clause 2] */}
                <SectionHeader title="What type of real estate do you rent?" />
                <RadioGroup
                  name="otherRentalReSub"
                  choices={REAL_ESTATE_RENTAL_CHOICES}
                  value={otherRentalReSub}
                  onChange={setOtherRentalReSub}
                  required
                />
              </>
            )}
            {otherRentalSub === "2" && (
              <TextInputField
                name="otherRentalGoods"
                label="Describe the goods you rent"
                value={otherRentalGoods}
                onChange={setOtherRentalGoods}
                required
              />
            )}
          </>
        )}

        {/* REPAIR sub-flow */}
        {otherSub === "REPAIR" && (
          <TextInputField
            name="otherRepairText"
            label="Describe what you repair"
            value={otherRepairText}
            onChange={setOtherRepairText}
            required
          />
        )}

        {/* GOODS_SELLER sub-flow */}
        {otherSub === "GOODS_SELLER" && (
          <>
            {/* [gap-fill: sub-section header per HR#1 clause 2] */}
            <SectionHeader title="How do you sell goods?" />
            <RadioGroup
              name="otherSellSub"
              choices={OTHER_SELL_CHOICES}
              value={otherSellSub}
              onChange={(v) => {
                setOtherSellSub(v);
              }}
              required
            />
            {otherSellSub === "1" && renderRetail()}
            {otherSellSub === "2" && renderWholesale()}
          </>
        )}

        {/* SERVICE sub-flow */}
        {otherSub === "SERVICE" && (
          <TextInputField
            name="otherServiceText"
            label="Describe the service your business provides"
            value={otherServiceText}
            onChange={setOtherServiceText}
            required
          />
        )}

        {/* OTHER → OTHER sub-flow */}
        {otherSub === "OTHER" && (
          <TextInputField
            name="otherOtherText"
            label="Describe your business activity"
            value={otherOtherText}
            onChange={setOtherOtherText}
            required
          />
        )}
      </>
    );
  }

  // ── Full form render ───────────────────────────────────────────────────────

  const formContent = (
    <form ref={formRef} action={submitActivityServices}>
      {/* Hidden fields — all sub-state passed to server action */}
      <input type="hidden" name="primaryActivity"      value={primary} />
      <input type="hidden" name="accommSub"            value={accommSub} />
      <input type="hidden" name="accommOther"          value={accommOther} />
      <input type="hidden" name="financeSub"           value={financeSub} />
      <input type="hidden" name="financeOther"         value={financeOther} />
      <input type="hidden" name="foodSub"              value={foodSub} />
      <input type="hidden" name="foodOther"            value={foodOther} />
      <input type="hidden" name="healthFirst"          value={healthFirst} />
      <input type="hidden" name="healthYesSub"         value={healthYesSub} />
      <input type="hidden" name="healthYesOther"       value={healthYesOther} />
      <input type="hidden" name="healthNoSub"          value={healthNoSub} />
      <input type="hidden" name="healthNoOther"        value={healthNoOther} />
      <input type="hidden" name="insuranceSub"         value={insuranceSub} />
      <input type="hidden" name="insuranceOther"       value={insuranceOther} />
      <input type="hidden" name="mfgText"              value={mfgText} />
      <input type="hidden" name="reSub"                value={reSub} />
      <input type="hidden" name="reRentalSub"          value={reRentalSub} />
      <input type="hidden" name="reRentalOther"        value={reRentalOther} />
      <input type="hidden" name="reOtherText"          value={reOtherText} />
      <input type="hidden" name="rentalSub"            value={rentalSub} />
      <input type="hidden" name="rentalThird"          value={rentalThird} />
      <input type="hidden" name="rentalOtherText"      value={rentalOtherText} />
      <input type="hidden" name="socialSub"            value={socialSub} />
      <input type="hidden" name="socialOther"          value={socialOther} />
      <input type="hidden" name="transSub"             value={transSub} />
      <input type="hidden" name="transCargoSub"        value={transCargoSub} />
      <input type="hidden" name="transCargoOther"      value={transCargoOther} />
      <input type="hidden" name="transPassSub"         value={transPassSub} />
      <input type="hidden" name="transPassOther"       value={transPassOther} />
      <input type="hidden" name="transSupportText"     value={transSupportText} />
      <input type="hidden" name="otherSub"             value={otherSub} />
      <input type="hidden" name="otherConsultYN"       value={otherConsultYN} />
      <input type="hidden" name="otherConsultType"     value={otherConsultType} />
      <input type="hidden" name="otherConsultActivity" value={otherConsultActivity} />
      <input type="hidden" name="otherMfgText"         value={otherMfgText} />
      <input type="hidden" name="otherOrgSub"          value={otherOrgSub} />
      <input type="hidden" name="otherOrgOther"        value={otherOrgOther} />
      <input type="hidden" name="otherRentalSub"       value={otherRentalSub} />
      <input type="hidden" name="otherRentalReSub"     value={otherRentalReSub} />
      <input type="hidden" name="otherRentalGoods"     value={otherRentalGoods} />
      <input type="hidden" name="otherRepairText"      value={otherRepairText} />
      <input type="hidden" name="otherSellSub"         value={otherSellSub} />
      <input type="hidden" name="otherServiceText"     value={otherServiceText} />
      <input type="hidden" name="otherOtherText"       value={otherOtherText} />

      {/* ── Page-level error summary (Slice 11) ──────────────────────────────────── */}
      <ErrorSummary fieldErrors={fieldErrors} />

      {/* ── Section: What does your business or organization do? ──────────── */}
      {/* Verbatim section title from captured HTML */}
      <section className="">
        <h2 className="_instructionHeader_1w9ml_70">
          What does your business or organization do?
        </h2>
        <span className={`"new-line" _bottomMargin24_1w9ml_126`}>
          {/* Verbatim prompt from captured HTML */}
          Choose one{" "}
          <span className="link link--blue">
            category
          </span>{" "}
          that best describes your business
          <span className="_required_bppll_1" role="asterisk">*</span>
        </span>
      </section>

      {/* Primary activity radio */}
      <div className="radioInput _bottomMargin18_1lntm_13 ">
        <fieldset
          className="radio-group _fixRadioMargin_1lntm_21 undefined"
          data-testid="radio-group"
        >
          <legend className="sr-only">
            Choose one category that best describes your business
          </legend>
          {PRIMARY_CHOICES.map((c) => (
            <div key={c.value}>
              <div
                className={
                  primary === c.value
                    ? "radio-button radio-button--checked"
                    : "radio-button"
                }
              >
                <input
                  tabIndex={0}
                  type="radio"
                  className="radio-button__input"
                  id={`${c.value}entityBusinessCategoryInputid`}
                  name="entityBusinessCategoryInput"
                  value={c.value}
                  checked={primary === c.value}
                  onChange={() => handlePrimaryChange(c.value)}
                />
                <label
                  className="input-label "
                  htmlFor={`${c.value}entityBusinessCategoryInputid`}
                >
                  {c.label}
                </label>
              </div>
              {c.description && (
                <p className="_choiceAdditionalText_1lntm_34">{c.description}</p>
              )}
            </div>
          ))}
        </fieldset>
        <p className="input-error-message" aria-live="polite">
          {primaryErr}
        </p>
      </div>

      {/* ── Conditional sub-sections ──────────────────────────────────────── */}
      {primary === "ACCOMMODATIONS"   && renderAccommodations()}
      {primary === "CONSTRUCTION"     && renderConstruction()}
      {primary === "FINANCE"          && renderFinance()}
      {primary === "FOOD_SERVICE"     && renderFoodService()}
      {primary === "HEALTH_CARE"      && renderHealthCare()}
      {primary === "INSURANCE"        && renderInsurance()}
      {primary === "MANUFACTURING"    && renderManufacturing()}
      {primary === "REAL_ESTATE"      && renderRealEstate()}
      {primary === "RENTAL_LEASING"   && renderRentalLeasing()}
      {primary === "RETAIL"           && renderRetail()}
      {primary === "SOCIAL_ASSISTANCE"&& renderSocialAssistance()}
      {primary === "TRANSPORTATION"   && renderTransportation()}
      {/* WAREHOUSING: no sub-section — principalService="WAREHOUSING" set in actions.ts */}
      {primary === "WHOLESALE"        && renderWholesale()}
      {primary === "OTHER"            && renderOther()}

      {/* ── Navigation buttons ─────────────────────────────────────────────── */}
      {/* Container class verbatim from Activity & Services capture (Ra() function) */}
      <div className="_verticalMargin40_1w9ml_172">
        {/* Back → W4 Additional Details */}
        <button
          type="button"
          aria-label="Back"
          className="irs-button irs-button--active _fixButtonContrast_1w9ml_81 _fixButtonCapitals_1w9ml_85 buttonStyle _rightMargin8_1w9ml_177 "
          onClick={() => {
            window.location.href = "/irs/ein/apply/additional-details";
          }}
        >
          Back
        </button>

        {/* Continue → submitActivityServices */}
        <button
          type="button"
          aria-label="Continue"
          className="irs-button irs-button--active inverted _fixButtonContrast_1w9ml_81 _fixButtonCapitals_1w9ml_85 buttonStyle"
          onClick={handleContinue}
        >
          Continue
        </button>

        <br />
        <br />

        {/* Cancel — matches bundle Su() modal trigger */}
        <button
          type="button"
          aria-label="Cancel"
          className="link-button _fixButtonContrast_1w9ml_81 _fixButtonCapitals_1w9ml_85"
          onClick={() => {
            window.location.href = "/irs/ein/apply";
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  if (!mounted || !portalRef.current) return null;
  return createPortal(formContent, portalRef.current);
}
