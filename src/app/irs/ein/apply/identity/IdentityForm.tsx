"use client";

/**
 * IdentityForm — IRS EIN Wizard Step 2 (Phase IRS-W2)
 *
 * Renders the interactive form area for the Identity / Responsible Party step.
 * Verbatim class names, ids, name attributes, and aria-labels from the
 * IRS SPA capture (sa.www4.irs.gov/applyein/identityOfEntities).
 *
 * Fields (in document order, matching capture):
 *   - SSN/ITIN     (responsibleSsn)      — required, has Show/Hide toggle
 *   - First name   (responsibleFirstName) — required
 *   - Middle name  (responsibleMiddleName) — optional
 *   - Last name    (responsibleLastName)  — required
 *   - Suffix       (responsibleSuffix)   — optional dropdown
 *   - Your role    (entityRoleRadioInput) — required radio: "yes" / "no"
 *
 * Continue → calls submitIdentity() server action via hidden form.
 * Back → window.history.back()
 * Cancel → href="/irs/ein/apply" (W0 landing)
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { submitIdentity } from "./actions";
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

// ── Helptip icon SVG path (question-mark circle) ──────────────────────────────
const HelptipIconPath =
  "M9,18 C4.02943725,18 0,13.9705627 0,9 C0,4.02943725 4.02943725,0 9,0 C13.9705627,0 18,4.02943725 18,9 C18,13.9705627 13.9705627,18 9,18 Z M9,17 C13.418278,17 17,13.418278 17,9 C17,4.581722 13.418278,1 9,1 C4.581722,1 1,4.581722 1,9 C1,13.418278 4.581722,17 9,17 Z M10.5533462,12.1315042 L10.5533462,14.3230653 C10.5533462,14.5239584 10.3889794,14.6883256 10.1880863,14.6883256 L7.99652525,14.6883256 C7.79563216,14.6883256 7.63126489,14.5239584 7.63126489,14.3230653 L7.63126489,12.1315042 C7.63126489,11.9306111 7.79563216,11.7662444 7.99652525,11.7662444 L10.1880863,11.7662444 C10.3889794,11.7662444 10.5533462,11.9306111 10.5533462,12.1315042 Z M13.4389016,6.652602 C13.4389016,8.38758764 12.2609374,9.05418764 11.3934449,9.53815691 C10.8546858,9.84862855 10.5168203,10.4787022 10.5168203,10.743516 C10.5168203,10.9444091 10.3615845,11.181828 10.15156,11.181828 L7.95999889,11.181828 C7.7591058,11.181828 7.63126489,10.8713569 7.63126489,10.6704638 L7.63126489,10.2595462 C7.63126489,9.15463418 8.72704544,8.20495745 9.5306178,7.83969709 C10.2337436,7.52009455 10.5259518,7.21875491 10.5259518,6.63433855 C10.5259518,6.12297436 9.8593518,5.66639945 9.11970016,5.66639945 C8.70878253,5.66639945 8.33439071,5.79424036 8.13349762,5.93121273 C7.91434162,6.08644855 7.69518562,6.30560455 7.15642653,6.981336 C7.08337489,7.07265109 6.97379689,7.12743982 6.87335035,7.12743982 C6.79116671,7.12743982 6.71811453,7.10004545 6.64506235,7.05438818 L5.14749562,5.91294982 C4.99226035,5.79424036 4.95573398,5.59334727 5.05618053,5.42898 C6.04238307,3.79444091 7.4303718,3 9.29319889,3 C11.2473405,3 13.4389016,4.56148745 13.4389016,6.652602 Z";

// ── Suffix options (verbatim from capture) ────────────────────────────────────
const SUFFIX_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "",    label: ""    },
  { value: "DDS", label: "DDS" },
  { value: "MD",  label: "MD"  },
  { value: "PHD", label: "PHD" },
  { value: "JR",  label: "Jr"  },
  { value: "SR",  label: "Sr"  },
  { value: "I",   label: "I"   },
  { value: "II",  label: "II"  },
  { value: "III", label: "III" },
  { value: "IV",  label: "IV"  },
  { value: "V",   label: "V"   },
  { value: "VI",  label: "VI"  },
];

export default function IdentityForm() {
  // Form field state
  const [ssn, setSsn]             = useState("");
  const [showSsn, setShowSsn]     = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [suffix, setSuffix]       = useState("");
  const [role, setRole]           = useState<"yes" | "no" | "">("");
  const [error, setError]         = useState("");
  // Page-level error summary (Slice 11) — set on Continue click only
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  // Portal target — null during SSR, set after mount
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById("w2-form-portal");
    if (el) setPortalTarget(el);
  }, []);

  const formRef = useRef<HTMLFormElement>(null);

  // SSN auto-format — verbatim from bundle _y.updateSsnState:
  // 1. strip non-digits, 2. cap at 9, 3. insert dashes at positions 3 and 5
  const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.length > 9) digits = digits.slice(0, 9);
    let formatted: string;
    if (digits.length > 4) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3, 5) + "-" + digits.slice(5, 9);
    } else if (digits.length > 2) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3, 5);
    } else {
      formatted = digits;
    }
    setSsn(formatted);
  };

  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    // Collect all errors at once (Slice 11 — page-level summary)
    const errs: string[] = [];
    const ssnDigits = ssn.replace(/-/g, "");
    if (!ssn.trim()) {
      errs.push("SSN/ITIN is required.");
    } else if (ssnDigits.length !== 9) {
      errs.push("SSN/ITIN must be 9 digits (format: 123-45-6789).");
    }
    if (!firstName.trim()) errs.push("First name is required.");
    if (!lastName.trim())  errs.push("Last name is required.");
    if (!role)             errs.push("Please choose your role.");
    // Keep existing inline error (first error) for the per-field <p> at bottom
    setError(errs[0] ?? "");
    setFieldErrors(errs);
    if (errs.length > 0) return;
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
      <form ref={formRef} action={submitIdentity} style={{ display: "none" }}>
        <input type="hidden" name="responsibleSsn"       value={ssn}        />
        <input type="hidden" name="responsibleFirstName" value={firstName}   />
        <input type="hidden" name="responsibleMiddleName" value={middleName} />
        <input type="hidden" name="responsibleLastName"  value={lastName}    />
        <input type="hidden" name="responsibleSuffix"    value={suffix}      />
        <input type="hidden" name="entityRoleRadioInput" value={role}        />
      </form>

      {/* ── Page-level error summary (Slice 11) ──────────────────────────────────── */}
      <ErrorSummary fieldErrors={fieldErrors} />

      {/* ── Outer personInputs wrapper (verbatim class from capture) ────────── */}
      <div className="personInputs ">

        {/* ── SSN / ITIN field ──────────────────────────────────────────────── */}
        <div className="ssnInput _bottomMargin12_456w9_9 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="responsibleSsn">
              SSN/ITIN
              <span className="_required_bppll_1" role="asterisk">*</span>
              <span className="_fixHelptipStyling_bppll_24 false">
                <span className="_helptipContent_1c7yk_2">
                  <span className="helptip-group">
                    <h3 className="helptip-button__button-wrapper">
                      <button
                        aria-expanded="false"
                        aria-label="SSN or ITIN help topic"
                        className="helptip-button"
                        type="button"
                      >
                        <span className="undefined " style={{ marginLeft: 0 }}>
                          <span aria-hidden="true" style={{ marginLeft: 5 }}>
                            <svg
                              className="helptip-icon"
                              id="responsibleSsnid"
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
              <li>Example: 123-45-6789</li>
            </ul>
          </div>
          <div className="inLineSsnInput">
            <input
              aria-label="SSN/ITIN, Required"
              id="responsibleSsn"
              name="responsibleSsn"
              type={showSsn ? "text" : "password"}
              className="input-text null _width84_456w9_26"
              placeholder=""
              autoComplete="off"
              autoCorrect="off"
              aria-required="false"
              inputMode="numeric"
              value={ssn}
              onChange={handleSsnChange}
            />
            <p className="input-error-message" aria-live="polite"></p>
          </div>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a
            href="#"
            aria-label="Show SSN/ITIN link, click enter to display SSN"
            target="_self"
            className="link link--blue link--no-padding _leftMargin12_456w9_21"
            onClick={(e) => { e.preventDefault(); setShowSsn((v) => !v); }}
          >
            {showSsn ? "Hide SSN/ITIN" : "Show SSN/ITIN"}
          </a>
          <div className="_fixInlineErrorMargin_456w9_1">
            <p className="input-error-message" aria-live="polite"></p>
          </div>
        </div>

        {/* ── First name ────────────────────────────────────────────────────── */}
        <div className="textInput _bottomMargin24_mw6ug_13 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="responsibleFirstName">
              First name
              <span className="_required_bppll_1" role="asterisk">*</span>
            </label>
            <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
              <li>The only special characters allowed are &#39;-&#39; and &#39;&amp;&#39;</li>
            </ul>
          </div>
          <div className="undefined _removeInlineErrorMargin_mw6ug_17">
            <div>
              <input
                aria-label="First name, Required"
                id="responsibleFirstName"
                name="responsibleFirstName"
                type="text"
                className="input-text null "
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                required
                aria-required="true"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <p className="input-error-message" aria-live="polite"></p>
            </div>
          </div>
        </div>

        {/* ── Middle name / initial ─────────────────────────────────────────── */}
        <div className="textInput _bottomMargin24_mw6ug_13 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="responsibleMiddleName">
              Middle name/initial
            </label>
            <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
              <li>The only special characters allowed are &#39;-&#39; and &#39;&amp;&#39;</li>
            </ul>
          </div>
          <div className="undefined _removeInlineErrorMargin_mw6ug_17">
            <div>
              <input
                aria-label="Middle name/initial"
                id="responsibleMiddleName"
                name="responsibleMiddleName"
                type="text"
                className="input-text null "
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                aria-required="false"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
              <p className="input-error-message" aria-live="polite"></p>
            </div>
          </div>
        </div>

        {/* ── Last name ─────────────────────────────────────────────────────── */}
        <div className="textInput _bottomMargin24_mw6ug_13 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="responsibleLastName">
              Last name
              <span className="_required_bppll_1" role="asterisk">*</span>
            </label>
            <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
              <li>The only special characters allowed are &#39;-&#39; and &#39;&amp;&#39;</li>
            </ul>
          </div>
          <div className="undefined _removeInlineErrorMargin_mw6ug_17">
            <div>
              <input
                aria-label="Last name, Required"
                id="responsibleLastName"
                name="responsibleLastName"
                type="text"
                className="input-text null "
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                required
                aria-required="true"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <p className="input-error-message" aria-live="polite"></p>
            </div>
          </div>
        </div>

        {/* ── Suffix dropdown ───────────────────────────────────────────────── */}
        <div className="dropdownInput _bottomMargin24_1pbi9_26 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="responsibleSuffix">
              Suffix
            </label>
            <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
              <li>Jr, Sr, etc.</li>
            </ul>
          </div>
          <select
            id="responsibleSuffix"
            className="single-select single-select--no-error _removeSelectMargin_1pbi9_1"
            name="responsibleSuffix"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
          >
            {SUFFIX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="_removeInlineErrorMargin_1pbi9_6">
            <p className="input-error-message" aria-live="polite"></p>
          </div>
        </div>

        {/* ── Your role section ─────────────────────────────────────────────── */}
        <h3>Your role</h3>
        <div className="radioInput _bottomMargin18_1lntm_13 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label htmlFor="entityRoleRadioInput">
              Choose one
              <span className="_required_bppll_1" role="asterisk">*</span>
              <span className="_fixHelptipStyling_bppll_24 false">
                <span className="_helptipContent_1c7yk_2">
                  <span className="helptip-group">
                    <h3 className="helptip-button__button-wrapper">
                      <button
                        aria-expanded="false"
                        aria-label=" llc role help topic"
                        className="helptip-button"
                        type="button"
                      >
                        <span className="undefined " style={{ marginLeft: 0 }}>
                          <span aria-hidden="true" style={{ marginLeft: 5 }}>
                            <svg
                              className="helptip-icon"
                              id="roleHelpLLC"
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
              {" "}Choose one{" "}
            </legend>
            {/* Radio: yes — owner/member/managing member */}
            <div className={role === "yes" ? "radio-button radio-button--checked" : "radio-button"}>
              <input
                tabIndex={0}
                type="radio"
                className="radio-button__input"
                data-testid="yesentityRoleRadioInputid"
                id="yesentityRoleRadioInputid"
                name="entityRoleRadioInput"
                aria-required="false"
                value="yes"
                checked={role === "yes"}
                onChange={() => setRole("yes")}
              />
              <label className="input-label " htmlFor="yesentityRoleRadioInputid">
                I am one of the{" "}
                <a
                  href="https://sa.www4.irs.gov/applyein/glossary#owner"
                  aria-label="owners. open in a new window"
                  target="_blank"
                  className="link link--blue link--no-padding"
                >
                  owners<ExternalIcon />
                </a>
                ,{" "}
                <a
                  href="https://sa.www4.irs.gov/applyein/glossary#member"
                  aria-label="members. open in a new window"
                  target="_blank"
                  className="link link--blue link--no-padding"
                >
                  members<ExternalIcon />
                </a>
                , or the managing member of this LLC.
              </label>
            </div>
            {/* Radio: no — third party */}
            <div className={role === "no" ? "radio-button radio-button--checked" : "radio-button"}>
              <input
                tabIndex={0}
                type="radio"
                className="radio-button__input"
                data-testid="noentityRoleRadioInputid"
                id="noentityRoleRadioInputid"
                name="entityRoleRadioInput"
                aria-required="false"
                value="no"
                checked={role === "no"}
                onChange={() => setRole("no")}
              />
              <label className="input-label " htmlFor="noentityRoleRadioInputid">
                I am a third party applying for an EIN on behalf of this LLC.
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
        <div className="_verticalMargin40_1iw8e_131">
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a
            href="#"
            className="irs-button irs-button--active inverted _fixButtonContrast_1iw8e_29 _fixButtonCapitals_1iw8e_33 buttonStyle _rightMargin8_1iw8e_140 "
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
            className="irs-button irs-button--active _fixButtonContrast_1iw8e_29 _fixButtonCapitals_1iw8e_33 buttonStyle"
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

      </div>{/* end .personInputs */}
    </>,
    portalTarget,
  );
}
