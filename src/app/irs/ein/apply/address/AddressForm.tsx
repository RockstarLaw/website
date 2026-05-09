"use client";

/**
 * AddressForm — IRS EIN Wizard Step 3 (Phase IRS-W3)
 *
 * Renders the interactive form area for the Addresses step.
 * Verbatim class names, ids, name attributes, and aria-labels from the
 * IRS SPA capture (sa.www4.irs.gov/applyein/addAddresses).
 *
 * Fields (in document order, matching capture):
 *   - Street         (physicalStreet)   — required
 *   - City           (physicalCity)     — required
 *   - State/U.S. territory (physicalState) — required dropdown, 63 options
 *   - ZIP/Postal code (physicalZipCode) — required
 *   - Phone number   (thePhone)         — required
 *   - Other address? (otherAddress)     — required radio: "yes" / "no"
 *
 * Note: The conditional mailing address section (triggered when otherAddress="yes")
 * is NOT present in the W3 capture. The yes/no choice is persisted; a separate
 * mailing address capture would be needed to implement that branch 1:1.
 *
 * Continue → calls submitAddress() server action via hidden form.
 * Back → window.history.back()
 * Cancel → href="/irs/ein/apply" (W0 landing)
 *
 * Outer wrapper uses verbatim class="undefined" from capture — not a typo,
 * that is the literal class emitted by the IRS SPA for this container.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { submitAddress } from "./actions";

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

// ── Helptip icon path (question-mark circle) ──────────────────────────────────
const HelptipIconPath =
  "M9,18 C4.02943725,18 0,13.9705627 0,9 C0,4.02943725 4.02943725,0 9,0 C13.9705627,0 18,4.02943725 18,9 C18,13.9705627 13.9705627,18 9,18 Z M9,17 C13.418278,17 17,13.418278 17,9 C17,4.581722 13.418278,1 9,1 C4.581722,1 1,4.581722 1,9 C1,13.418278 4.581722,17 9,17 Z M10.5533462,12.1315042 L10.5533462,14.3230653 C10.5533462,14.5239584 10.3889794,14.6883256 10.1880863,14.6883256 L7.99652525,14.6883256 C7.79563216,14.6883256 7.63126489,14.5239584 7.63126489,14.3230653 L7.63126489,12.1315042 C7.63126489,11.9306111 7.79563216,11.7662444 7.99652525,11.7662444 L10.1880863,11.7662444 C10.3889794,11.7662444 10.5533462,11.9306111 10.5533462,12.1315042 Z M13.4389016,6.652602 C13.4389016,8.38758764 12.2609374,9.05418764 11.3934449,9.53815691 C10.8546858,9.84862855 10.5168203,10.4787022 10.5168203,10.743516 C10.5168203,10.9444091 10.3615845,11.181828 10.15156,11.181828 L7.95999889,11.181828 C7.7591058,11.181828 7.63126489,10.8713569 7.63126489,10.6704638 L7.63126489,10.2595462 C7.63126489,9.15463418 8.72704544,8.20495745 9.5306178,7.83969709 C10.2337436,7.52009455 10.5259518,7.21875491 10.5259518,6.63433855 C10.5259518,6.12297436 9.8593518,5.66639945 9.11970016,5.66639945 C8.70878253,5.66639945 8.33439071,5.79424036 8.13349762,5.93121273 C7.91434162,6.08644855 7.69518562,6.30560455 7.15642653,6.981336 C7.08337489,7.07265109 6.97379689,7.12743982 6.87335035,7.12743982 C6.79116671,7.12743982 6.71811453,7.10004545 6.64506235,7.05438818 L5.14749562,5.91294982 C4.99226035,5.79424036 4.95573398,5.59334727 5.05618053,5.42898 C6.04238307,3.79444091 7.4303718,3 9.29319889,3 C11.2473405,3 13.4389016,4.56148745 13.4389016,6.652602 Z";

// ── State / territory options (verbatim from W3 capture — same list as W1/W2) ─
const STATE_OPTIONS: Array<[string, string]> = [
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
];

export default function AddressForm() {
  // Form field state
  const [street, setStreet]           = useState("");
  const [city, setCity]               = useState("");
  const [state, setState]             = useState("");
  const [zip, setZip]                 = useState("");
  const [phone, setPhone]             = useState("");
  const [otherAddress, setOtherAddress] = useState<"yes" | "no" | "">("");
  const [error, setError]             = useState("");

  // Portal target — null during SSR, set after mount
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById("w3-form-portal");
    if (el) setPortalTarget(el);
  }, []);

  const formRef = useRef<HTMLFormElement>(null);

  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!street.trim()) { setError("Street is required."); return; }
    if (!city.trim())   { setError("City is required.");   return; }
    if (!state)         { setError("State/U.S. territory is required."); return; }
    if (!zip.trim())    { setError("ZIP/Postal code is required."); return; }
    if (!phone.trim())  { setError("Phone number is required."); return; }
    if (!otherAddress)  { setError("Please indicate if you have a different mailing address."); return; }
    setError("");
    formRef.current?.requestSubmit();
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.back();
  };

  // Don't render during SSR
  if (!portalTarget) return null;

  return createPortal(
    <>
      {/* Hidden form for server action submission */}
      <form ref={formRef} action={submitAddress} style={{ display: "none" }}>
        <input type="hidden" name="physicalStreet"   value={street}       />
        <input type="hidden" name="physicalCity"     value={city}         />
        <input type="hidden" name="physicalState"    value={state}        />
        <input type="hidden" name="physicalZipCode"  value={zip}          />
        <input type="hidden" name="thePhone"         value={phone}        />
        <input type="hidden" name="otherAddress"     value={otherAddress} />
      </form>

      {/* ── Outer wrapper (verbatim class="undefined" from capture) ─────────── */}
      <div className="undefined">

        {/* ── Street ──────────────────────────────────────────────────────── */}
        <div className="textInput _bottomMargin24_mw6ug_13 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="physicalStreet">
              Street
              <span className="_required_bppll_1" role="asterisk">*</span>
              {/* Empty _fixHelptipStyling span — verbatim from capture */}
              <span className="_fixHelptipStyling_bppll_24 false"></span>
            </label>
            <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
              <li>The only special characters allowed are &#39;-&#39; and &#39;/&#39;</li>
            </ul>
          </div>
          <div className="undefined _removeInlineErrorMargin_mw6ug_17">
            <div>
              <input
                aria-label="Street, Required"
                id="physicalStreet"
                name="physicalStreet"
                type="text"
                className="input-text null "
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                required
                aria-required="true"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
              <p className="input-error-message" aria-live="polite"></p>
            </div>
          </div>
        </div>

        {/* ── City ────────────────────────────────────────────────────────── */}
        <div className="textInput _bottomMargin24_mw6ug_13 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="physicalCity">
              City
              <span className="_required_bppll_1" role="asterisk">*</span>
            </label>
            <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
              <li>The only special characters allowed are &#39;-&#39; and &#39;/&#39;</li>
            </ul>
          </div>
          <div className="undefined _removeInlineErrorMargin_mw6ug_17">
            <div>
              <input
                aria-label="City, Required"
                id="physicalCity"
                name="physicalCity"
                type="text"
                className="input-text null "
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                required
                aria-required="true"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <p className="input-error-message" aria-live="polite"></p>
            </div>
          </div>
        </div>

        {/* ── State / U.S. territory ───────────────────────────────────────── */}
        <div className="dropdownInput _bottomMargin24_1pbi9_26 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="physicalState">
              State/U.S. territory
              <span className="_required_bppll_1" role="asterisk">*</span>
              <span className="_fixHelptipStyling_bppll_24 false">
                <span className="_helptipContent_1c7yk_2">
                  <span className="helptip-group">
                    <h3 className="helptip-button__button-wrapper">
                      <button
                        aria-expanded="false"
                        aria-label="state help topic"
                        className="helptip-button"
                        type="button"
                      >
                        <span className="undefined " style={{ marginLeft: 0 }}>
                          <span aria-hidden="true" style={{ marginLeft: 5 }}>
                            <svg
                              className="helptip-icon"
                              id="physicalStateid"
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
            <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
              <li>
                Select the state/territory.{" "}
                <a
                  href="https://sa.www4.irs.gov/applyein/glossary#militaryAddresses"
                  aria-label="For military addresses click here. "
                  target="_blank"
                  className="link link--blue link--no-padding"
                >
                  For military addresses click here<ExternalIcon />
                </a>
                .
              </li>
            </ul>
          </div>
          <select
            id="physicalState"
            className="single-select single-select--no-error _removeSelectMargin_1pbi9_1"
            name="physicalState"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="" disabled hidden>Select an Option</option>
            {STATE_OPTIONS.map(([value, label], idx) => (
              <option key={`${value}-${idx}`} value={value}>{label}</option>
            ))}
          </select>
          <div className="_removeInlineErrorMargin_1pbi9_6">
            <p className="input-error-message" aria-live="polite"></p>
          </div>
        </div>

        {/* ── ZIP / Postal code ────────────────────────────────────────────── */}
        <div className="textInput _bottomMargin24_mw6ug_13 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="physicalZipCode">
              ZIP/Postal code
              <span className="_required_bppll_1" role="asterisk">*</span>
            </label>
            <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
              <li>The postal code must be 5 digits</li>
            </ul>
          </div>
          <div className="undefined _removeInlineErrorMargin_mw6ug_17">
            <div>
              <input
                aria-label="ZIP/Postal code, Required"
                id="physicalZipCode"
                name="physicalZipCode"
                type="text"
                className="input-text null "
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                required
                aria-required="true"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
              <p className="input-error-message" aria-live="polite"></p>
            </div>
          </div>
        </div>

        {/* ── Phone number ─────────────────────────────────────────────────── */}
        <div className="textInput _bottomMargin24_mw6ug_13 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="thePhone">
              Phone number
              <span className="_required_bppll_1" role="asterisk">*</span>
            </label>
            <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
              <li>Must contain only digits; do not enter extensions</li>
            </ul>
          </div>
          <div className="undefined _removeInlineErrorMargin_mw6ug_17">
            <div>
              <input
                aria-label="Phone number, Required"
                id="thePhone"
                name="thePhone"
                type="text"
                className="input-text null "
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                required
                aria-required="true"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="input-error-message" aria-live="polite"></p>
            </div>
          </div>
        </div>

        {/* ── Other / mailing address radio ─────────────────────────────────── */}
        <div className="radioInput _bottomMargin18_1lntm_13 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="otherAddress">
              Do you have an address different from the above where you want your mail to be sent?
              <span className="_required_bppll_1" role="asterisk">*</span>
            </label>
          </div>
          <fieldset
            className="radio-group _fixRadioMargin_1lntm_21 undefined"
            data-testid="radio-group"
          >
            <legend data-testid="legend" className="sr-only">
              {" "}Do you have an address different from the above where you want your mail to be sent?{" "}
            </legend>
            {/* Radio: yes */}
            <div className={otherAddress === "yes" ? "radio-button radio-button--checked" : "radio-button"}>
              <input
                tabIndex={0}
                type="radio"
                className="radio-button__input"
                data-testid="yesotherAddressid"
                id="yesotherAddressid"
                name="otherAddress"
                aria-required="false"
                value="yes"
                checked={otherAddress === "yes"}
                onChange={() => setOtherAddress("yes")}
              />
              <label className="input-label " htmlFor="yesotherAddressid">
                Yes
              </label>
            </div>
            {/* Radio: no */}
            <div className={otherAddress === "no" ? "radio-button radio-button--checked" : "radio-button"}>
              <input
                tabIndex={0}
                type="radio"
                className="radio-button__input"
                data-testid="nootherAddressid"
                id="nootherAddressid"
                name="otherAddress"
                aria-required="false"
                value="no"
                checked={otherAddress === "no"}
                onChange={() => setOtherAddress("no")}
              />
              <label className="input-label " htmlFor="nootherAddressid">
                No
              </label>
            </div>
          </fieldset>
          <p className="input-error-message" aria-live="polite">
            {error}
          </p>
        </div>

        {/* ── Navigation buttons ────────────────────────────────────────────── */}
        {/* Verbatim class names + aria-labels from capture.
            Both are <a role="button"> in the original IRS SPA — preserved.
            Duplicate id="anchor-ui-0" on Back + Continue is verbatim (IRS bug). */}
        <div className="_verticalMargin40_osk8n_104">
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a
            href="#"
            className="irs-button irs-button--active inverted _fixButtonContrast_osk8n_18 _fixButtonCapitals_osk8n_22 buttonStyle _rightMargin8_osk8n_109 "
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
            className="irs-button irs-button--active _fixButtonContrast_osk8n_18 _fixButtonCapitals_osk8n_22 buttonStyle"
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

      </div>{/* end .undefined (form wrapper) */}
    </>,
    portalTarget,
  );
}
