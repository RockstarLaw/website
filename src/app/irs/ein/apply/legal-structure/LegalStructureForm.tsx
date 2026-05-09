"use client";

/**
 * LegalStructureForm — IRS EIN Wizard Step 1 (Phase IRS-W1)
 *
 * Renders the interactive form area for the Legal Structure step.
 * Verbatim class names, ids, name attributes, and aria-labels from the
 * IRS SPA capture (sa.www4.irs.gov/applyein/legalStructure).
 *
 * State management:
 *   - selectedStructure: which radio option is currently checked
 *   - membersCount: text input value for LLC member count
 *   - selectedState: dropdown value for LLC state/territory
 *   - error: validation error message shown inline
 *
 * Conditional fields: Only LLC selection triggers additional fields,
 * per the "New Fields Opened" capture. Other entity types show no
 * additional conditional section (those states are not captured).
 *
 * Continue button → calls submitLegalStructure() server action via
 * a hidden <form> element + requestSubmit().
 * Back button → window.history.back()
 * Cancel link → href="/irs/ein/apply" (W0 landing)
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { submitLegalStructure } from "./actions";

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
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  const [membersCount, setMembersCount] = useState("1");
  const [membersError, setMembersError] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [stateError, setStateError] = useState("");
  const [spousesAnswer, setSpousesAnswer] = useState("");
  const [marriedError, setMarriedError] = useState("");
  const [qjvElection, setQjvElection] = useState("");
  const [qjvError, setQjvError] = useState("");
  const [entityType, setEntityType] = useState("");
  const [error, setError] = useState("");
  // Portal target — null during SSR, set after mount
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Find the empty placeholder div that wizard-step-1.html injects
    // inside .container.content__container
    const el = document.getElementById("w1-form-portal");
    if (el) setPortalTarget(el);
  }, []);

  const formRef = useRef<HTMLFormElement>(null);

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

  // ── handleContinue: validation per bundle Zi LLC branch (4 checks, in order) ─
  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    let isValid = true;

    if (!selectedStructure) {
      setError("Please select a type of legal structure.");
      isValid = false;
    } else {
      setError("");
    }

    if (selectedStructure === "LLC") {
      // Check 1: members empty
      if (membersCount === "") {
        isValid = false;
        setMembersError("LLC Members: Enter a valid number");
      } else {
        setMembersError("");
      }
      // Check 2: state empty
      if (selectedState === "") {
        isValid = false;
        setStateError("State: Selection is required.");
      } else {
        setStateError("");
      }
      // Check 3: count==="2" && CP state && spouses not answered
      if (membersCount === "2" && isCommunityPropertyState(selectedState) && spousesAnswer === "") {
        isValid = false;
        setMarriedError("Married: Selection is required.");
      } else {
        setMarriedError("");
      }
      // Check 4: entityType unresolved && spouses==="yes" && qjv not chosen
      if (entityType === "" && spousesAnswer === "yes" && qjvElection === "") {
        isValid = false;
        setQjvError("Which LCC: Selection is required. Please complete LLC questions.");
      } else {
        setQjvError("");
      }
    }

    if (!isValid) return;
    formRef.current?.requestSubmit();
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.back();
  };

  // Don't render during SSR (portal target doesn't exist yet)
  if (!portalTarget) return null;

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
          </>
        )}
      </form>

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
                    setSpousesAnswer("");
                    setMarriedError("");
                    setQjvElection("");
                    setQjvError("");
                    setEntityType("");
                    setMembersError("");
                    setStateError("");
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
