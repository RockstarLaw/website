"use client";

/**
 * AdditionalDetailsForm — IRS EIN Wizard Step 4 (Phase IRS-W4a, Slice 1)
 *
 * Renders the interactive form area for the Additional Details step.
 * Portals into #w4-form-portal inside wizard-step-4.html.
 *
 * Scope: SINGLE_MEMBER_LLC only. Non-SMLLC paths redirect to coming-soon
 * before this component is reached.
 *
 * All field labels, error messages, and helptip content are sourced from
 * irs-captures/json/ein__additionalDetails.json keys — never prose strings.
 * JSON data is loaded server-side in page.tsx and passed as serialized props.
 *
 * ── Sections rendered (matching fl(), xi(), wo(), finalSection in bundle) ──
 *
 * Section 1 (fl):  Tell us about the LLC
 *   legalName5InputControl  — TextInput, required, legalNameDefaultFilter
 *   dbaNameInputControl     — TextInput, optional
 *   countyInputControl      — TextInput, required
 *   stateLocationInputControl — DropdownCommonInput (stateTypes1), required
 *   stateArticlesOrganizationFiledInputControl — DropdownCommonInput (stateTypes1), required
 *   Start Date fieldset (defaultStartDate label + startMonthInputControl + startYearInputControl)
 *
 * Section 2 (xi):  Tell us more about the LLC
 *   ownHighwayVehicleInputControl — RadioInput yes/no, required
 *   involveGamblingInputControl   — RadioInput yes/no, required
 *   fileForm720InputControl       — RadioInput yes/no, required
 *   sellAtfInputControl           — RadioInput yes/no, required, NO helptip
 *   provideW2FormInputControl     — RadioInput yes/no, required
 *
 * Section 3 (wo, conditional — shows when provideW2Form = "yes"):
 *   instructions5 (first pay date)  — month dropdown + year text
 *   instructions6 (employee counts) — ag count + other count text inputs
 *   employeeTaxLiabilityInputControl — RadioInput yes/no, required
 *
 * Section 4 (finalSection):
 *   reviewInputControl — checkBoxInput
 *   Back / Continue / Cancel navigation
 *
 * Navigation:
 *   Back    → /irs/ein/apply/address
 *   Continue → submitAdditionalDetails() server action
 *   Cancel  → /irs/ein/apply
 *
 * Button classes verbatim from Additional Details 1 capture:
 *   Back:     irs-button irs-button--active _fixButtonContrast_im0vm_41 _fixButtonCapitals_im0vm_45 buttonStyle _rightMargin8_im0vm_195
 *   Continue: irs-button irs-button--active inverted _fixButtonContrast_im0vm_41 _fixButtonCapitals_im0vm_45 buttonStyle
 *   Container: _bottomMargin40_im0vm_129
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import SchemaField, { type SchemaFieldDef } from "@/components/irs/SchemaField";
import Helptip, { type HelptipDef } from "@/components/irs/Helptip";
import { MONTH_OPTIONS } from "@/lib/irs/choiceTypes";
import { submitAdditionalDetails } from "./actions";

// ── Serialized schema data types ─────────────────────────────────────────────

export type AdditionalDetailsSchema = {
  // Section headers
  // ── Gating flags (decoded from bundle bo/li/us/ds/cs/ma functions) ─────────
  showDba:                 boolean;
  showTruckingGamblingAtf: boolean;
  showClosingMonth:        boolean;
  showHouseholdEmployees:  boolean;
  // Section headers
  tellUsAboutSubHeader:    { title: string };
  tellUsMoreSubHeader:     { title: string };
  describeEmpSubHeader:    { title: string };
  // Tell us about — field defs
  legalNameFieldDef:       SchemaFieldDef;
  dbaFieldDef:             SchemaFieldDef;
  countyFieldDef:          SchemaFieldDef;
  stateLocationFieldDef:   SchemaFieldDef;
  /** null when stateArticlesKey is null for the entity type */
  stateArticlesFieldDef:   SchemaFieldDef | null;
  /** null when showClosingMonth is false */
  closingMonthFieldDef:    SchemaFieldDef | null;
  startDateLabelDef:       { fieldName: string; additionalText: string[] };
  startMonthFieldDef:      SchemaFieldDef;
  startYearFieldDef:       SchemaFieldDef;
  // Tell us more — field defs
  highwayVehicleFieldDef:  SchemaFieldDef;
  gamblingFieldDef:        SchemaFieldDef;
  fileForm720FieldDef:     SchemaFieldDef;
  atfFieldDef:             SchemaFieldDef;
  /** null when ma()=false (employees section hidden entirely for entity type) */
  employeesQuestionFieldDef: SchemaFieldDef | null;
  // Describe employees — field defs
  firstPayDateInstructions: { title: string; additionalText: string[] };
  firstPayMonthFieldDef:   SchemaFieldDef;
  firstPayYearFieldDef:    SchemaFieldDef;
  empCountInstructions:    { title: string; additionalText: string[]; inputErrorMessages?: Array<{text: string; id: string}> };
  agEmployeesFieldDef:     SchemaFieldDef;
  otherEmployeesFieldDef:  SchemaFieldDef;
  taxLiabilityFieldDef:    SchemaFieldDef;
  // Final section
  reviewFieldDef:          SchemaFieldDef;
  // Helptip defs
  dbaHelptip:              HelptipDef;
  /** null when stateArticlesKey is null (no articles field for entity type) */
  articlesHelptip:         HelptipDef | null;
  startMonthHelptip:       HelptipDef;
  highwayVehicleHelptip:   HelptipDef;
  gamblingHelptip:         HelptipDef;
  fileForm720Helptip:      HelptipDef;
  /** null when employeesHelptipKey is null (haveEmployees variant has no helptip) */
  employeesHelptip:        HelptipDef | null;
  maxEmployeesHelptip:     HelptipDef;
  agEmployeesHelptip:      HelptipDef;
  otherEmployeesHelptip:   HelptipDef;
  firstPayDateHelptip:     HelptipDef;
  taxLiabilityHelptip:     HelptipDef;
};

type Props = {
  schema: AdditionalDetailsSchema;
};

export default function AdditionalDetailsForm({ schema }: Props) {
  // ── Portal target ──────────────────────────────────────────────────────────
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.getElementById("w4-form-portal");
    if (el) setPortalTarget(el);
  }, []);

  // ── Form field state ───────────────────────────────────────────────────────
  const [legalName,         setLegalName]         = useState("");
  const [dbaName,           setDbaName]           = useState("");
  const [county,            setCounty]            = useState("");
  const [stateLocation,     setStateLocation]     = useState("");
  const [stateArticles,     setStateArticles]     = useState("");
  const [closingMonth,      setClosingMonth]      = useState("");
  const [startMonth,        setStartMonth]        = useState("");
  const [startYear,         setStartYear]         = useState("");
  const [highwayVehicles,   setHighwayVehicles]   = useState("");
  const [gambling,          setGambling]          = useState("");
  const [fileForm720,       setFileForm720]       = useState("");
  const [atf,               setAtf]               = useState("");
  const [hasEmployees,      setHasEmployees]      = useState("");
  // W4b deferred — no pixel reference for employees=yes state; ships in a later slice

  // ── Error state ────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formRef = useRef<HTMLFormElement>(null);

  // ── Validation + submission ────────────────────────────────────────────────
  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const errs = schema.legalNameFieldDef.inputErrorMessages ?? [];
    if (!legalName.trim())
      newErrors.legalName = errs[0]?.text ?? "Legal Name: Input is required.";
    if (schema.showDba && dbaName.length > 34 && dbaName.trim()) {
      const dbaErrs = schema.dbaFieldDef.inputErrorMessages ?? [];
      newErrors.dbaName = dbaErrs[1]?.text ?? "DBA Name: Invalid.";
    }
    const ctyErrs = schema.countyFieldDef.inputErrorMessages ?? [];
    if (!county.trim())
      newErrors.county = ctyErrs[0]?.text ?? "County Name: Input is required";
    const slErrs = schema.stateLocationFieldDef.inputErrorMessages ?? [];
    if (!stateLocation)
      newErrors.stateLocation = slErrs[0]?.text ?? "State Located: Selection is required";
    // stateArticles only validated when rendered (stateArticlesKey non-null)
    if (schema.stateArticlesFieldDef) {
      const saErrs = schema.stateArticlesFieldDef.inputErrorMessages ?? [];
      if (!stateArticles)
        newErrors.stateArticles = saErrs[0]?.text ?? "State Filed: Selection is required";
    }
    // closingMonth only validated when rendered
    if (schema.showClosingMonth && schema.closingMonthFieldDef) {
      const cmErrs = schema.closingMonthFieldDef.inputErrorMessages ?? [];
      if (!closingMonth)
        newErrors.closingMonth = cmErrs[0]?.text ?? "Closing Month: Selection is required";
    }
    const smErrs = schema.startMonthFieldDef.inputErrorMessages ?? [];
    if (!startMonth)
      newErrors.startMonth = smErrs[0]?.text ?? "Start Month: Selection is required";
    const syErrs = schema.startYearFieldDef.inputErrorMessages ?? [];
    if (!startYear.trim())
      newErrors.startYear = syErrs[0]?.text ?? "Start Year: Input is required";
    else if (!/^[0-9]{4}$/.test(startYear))
      newErrors.startYear = syErrs[1]?.text ?? "Start Year: Year must consist of 4 numbers";
    // trucking/gambling/ATF only validated when section is rendered
    if (schema.showTruckingGamblingAtf) {
      const hvErrs = schema.highwayVehicleFieldDef.inputErrorMessages ?? [];
      if (!highwayVehicles)
        newErrors.highwayVehicles = hvErrs[0]?.text ?? "Have Highway Vehicle: Selection is required.";
      const gErrs = schema.gamblingFieldDef.inputErrorMessages ?? [];
      if (!gambling)
        newErrors.gambling = gErrs[0]?.text ?? "Has Gambling: Selection is required.";
      const f720Errs = schema.fileForm720FieldDef.inputErrorMessages ?? [];
      if (!fileForm720)
        newErrors.fileForm720 = f720Errs[0]?.text ?? "File Form 720: Selection is required.";
      const atfErrs = schema.atfFieldDef.inputErrorMessages ?? [];
      if (!atf)
        newErrors.atf = atfErrs[0]?.text ?? "Sell alcohol, tobacco, or firearms: Selection is required.";
    }
    // employees question only validated when rendered (null = ma()=false)
    if (schema.employeesQuestionFieldDef) {
      const empErrs = schema.employeesQuestionFieldDef.inputErrorMessages ?? [];
      if (!hasEmployees)
        newErrors.hasEmployees = empErrs[0]?.text ?? "Have Employees: Selection is required.";
    }

    // W4b validation deferred — no pixel reference; ships in a later slice

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    formRef.current?.requestSubmit();
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/irs/ein/apply/address";
  };

  if (!portalTarget) return null;

  return createPortal(
    <>
      {/* Hidden form for server action submission */}
      <form ref={formRef} action={submitAdditionalDetails} style={{ display: "none" }}>
        <input type="hidden" name="legalName"         value={legalName} />
        <input type="hidden" name="dbaName"           value={dbaName} />
        <input type="hidden" name="county"            value={county} />
        <input type="hidden" name="state"             value={stateLocation} />
        {schema.stateArticlesFieldDef && (
          <input type="hidden" name="stateIncorporated" value={stateArticles} />
        )}
        {schema.showClosingMonth && (
          <input type="hidden" name="closingMonth" value={closingMonth} />
        )}
        <input type="hidden" name="startMonth"        value={startMonth} />
        <input type="hidden" name="startYear"         value={startYear} />
        <input type="hidden" name="trucking"          value={highwayVehicles} />
        <input type="hidden" name="gambling"          value={gambling} />
        <input type="hidden" name="exciseTaxes"       value={fileForm720} />
        <input type="hidden" name="atf"               value={atf} />
        <input type="hidden" name="w2Issuer"          value={hasEmployees} />
      </form>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — Tell us about the LLC  (matches fl() in bundle)
          Outer section class verbatim from capture: _bottomMargin16_im0vm_119
          ══════════════════════════════════════════════════════════════════ */}
      <section className="_bottomMargin16_im0vm_119">
        {/* h4 section header — verbatim from capture */}
        <section className="_bottomMargin24_im0vm_124">
          <h4 className="sectionHeader _fontSize20_im0vm_203 ">
            {schema.tellUsAboutSubHeader.title}
          </h4>
        </section>

        {/* Legal name — legalName5InputControl
            Container uses unique _yrq5v_ hash from capture */}
        <SchemaField
          fieldDef={schema.legalNameFieldDef}
          inputName="legalNameInput"
          value={legalName}
          onChange={setLegalName}
          isRequired={true}
          errorMessage={errors.legalName}
          containerClassName="textInput _bottomMargin24_yrq5v_13 "
          innerClassName="_flex_yrq5v_29 _removeInlineErrorMargin_yrq5v_21"
        />

        {/* DBA name — dbaNameInputControl, optional, has helptip */}
        <SchemaField
          fieldDef={schema.dbaFieldDef}
          inputName="dbaNameInput"
          value={dbaName}
          onChange={setDbaName}
          isRequired={false}
          errorMessage={errors.dbaName}
          helptipDef={schema.dbaHelptip}
        />

        {/* County — countyInputControl, required, no helptip */}
        <SchemaField
          fieldDef={schema.countyFieldDef}
          inputName="countyInput"
          value={county}
          onChange={setCounty}
          isRequired={true}
          errorMessage={errors.county}
        />

        {/* State location — stateLocationInputControl, required, no helptip */}
        <SchemaField
          fieldDef={schema.stateLocationFieldDef}
          inputName="stateInput"
          value={stateLocation}
          onChange={setStateLocation}
          isRequired={true}
          errorMessage={errors.stateLocation}
        />

        {/* State articles filed — null when stateArticlesKey is null for entity type */}
        {schema.stateArticlesFieldDef && (
          <SchemaField
            fieldDef={schema.stateArticlesFieldDef}
            inputName="StateFiledArticlesOrganization"
            value={stateArticles}
            onChange={setStateArticles}
            isRequired={true}
            errorMessage={errors.stateArticles}
            helptipDef={schema.articlesHelptip ?? undefined}
          />
        )}

        {/* Start Date fieldset
            Verbatim structure from capture: _formatFieldset_im0vm_63, legend _srOnly_im0vm_69
            Label group uses defaultStartDate.fieldName + startMonthHelp helptip */}
        <div className="dropdownInput _bottomMargin24_1pbi9_26 ">
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label>
              {schema.startDateLabelDef.fieldName}
              <span className="_required_bppll_1" role="asterisk">*</span>
              <Helptip def={schema.startMonthHelptip} instanceId="startMonth" />
            </label>
          </div>
          <fieldset className="_formatFieldset_im0vm_63">
            <legend className="_srOnly_im0vm_69">{schema.startDateLabelDef.fieldName}</legend>
            <div className="_startDateInputs_im0vm_49">
              {/* Month dropdown — rendered directly to avoid double-wrap from SchemaField container */}
              <div className="dropdownInput _bottomMargin24_1pbi9_26 ">
                <div className="inputInstruction _bottomMargin8_bppll_6 ">
                  <label htmlFor="startDateMonthInput">{schema.startMonthFieldDef.fieldName}</label>
                </div>
                <select
                  id="startDateMonthInput"
                  name="startDateMonth"
                  className={`single-select ${errors.startMonth ? "single-select--error" : "single-select--no-error"} _removeSelectMargin_1pbi9_1`}
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  aria-required={true}
                >
                  <option value="" disabled hidden>Select an Option</option>
                  {MONTH_OPTIONS.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                {errors.startMonth && (
                  <p className="input-error-message" aria-live="polite">{errors.startMonth}</p>
                )}
              </div>
              {/* Year text input — direct render for consistent fieldset width */}
              <div className="textInput _bottomMargin24_mw6ug_13 ">
                <div className="inputInstruction _bottomMargin8_bppll_6 ">
                  <label htmlFor="startDateYearInput">{schema.startYearFieldDef.fieldName}</label>
                </div>
                <div className="undefined _removeInlineErrorMargin_mw6ug_17">
                  <div>
                    <input
                      id="startDateYearInput"
                      name="startDateYear"
                      type="text"
                      className={`input-text ${errors.startYear ? "input-text--error" : "null"} `}
                      placeholder=""
                      autoComplete="off"
                      autoCorrect="off"
                      aria-required={false}
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                    />
                    <p className="input-error-message" aria-live="polite">{errors.startYear}</p>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — Tell us more about the LLC  (matches xi() in bundle)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="_bottomMargin16_im0vm_119">
        <section className="_bottomMargin24_im0vm_124">
          <h4 className="sectionHeader _fontSize20_im0vm_203 ">
            {schema.tellUsMoreSubHeader.title}
          </h4>
        </section>

        {/* Trucking / Gambling / ATF block — conditional: li() function */}
        {schema.showTruckingGamblingAtf && (
          <>
            {/* Highway vehicles — ownHighwayVehicleInputControl, has helptip */}
            <SchemaField
              fieldDef={schema.highwayVehicleFieldDef}
              inputName="highwayVehiclesInput"
              value={highwayVehicles}
              onChange={setHighwayVehicles}
              isRequired={true}
              errorMessage={errors.highwayVehicles}
              helptipDef={schema.highwayVehicleHelptip}
            />

            {/* Gambling — involveGamblingInputControl, has helptip */}
            <SchemaField
              fieldDef={schema.gamblingFieldDef}
              inputName="gamblingWagerInput"
              value={gambling}
              onChange={setGambling}
              isRequired={true}
              errorMessage={errors.gambling}
              helptipDef={schema.gamblingHelptip}
            />

            {/* Form 720 — fileForm720InputControl, has helptip
                NOTE: bundle renders helptip but button has NO aria-label attribute */}
            <SchemaField
              fieldDef={schema.fileForm720FieldDef}
              inputName="fileForm720Input"
              value={fileForm720}
              onChange={setFileForm720}
              isRequired={true}
              errorMessage={errors.fileForm720}
              helptipDef={schema.fileForm720Helptip}
            />

            {/* ATF — sellAtfInputControl, NO helptip (bundle: no helptip rendered) */}
            <SchemaField
              fieldDef={schema.atfFieldDef}
              inputName="atfInput"
              value={atf}
              onChange={setAtf}
              isRequired={true}
              errorMessage={errors.atf}
            />
          </>
        )}

        {/* Employees question — provideW2FormInputControl or haveEmployeesInputControl.
            null when ma()=false (employees section hidden entirely for this entity type). */}
        {schema.employeesQuestionFieldDef && (
          <SchemaField
            fieldDef={schema.employeesQuestionFieldDef}
            inputName="hasEmployeesInput"
            value={hasEmployees}
            onChange={setHasEmployees}
            isRequired={true}
            errorMessage={errors.hasEmployees}
            helptipDef={schema.employeesHelptip ?? undefined}
          />
        )}

        <div className="_bottomMargin16_im0vm_119" />
      </section>

      {/* Navigation buttons
          Classes verbatim from Additional Details 1 HTML capture.
          Back  inverted=false → no "inverted" class (verbatim)
          Continue inverted=true → has "inverted" class (verbatim)
          Both use _im0vm_ hashes (vs _osk8n_ in W3) */}
      <div className="_bottomMargin40_im0vm_129">
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a
          href="#"
          className="irs-button irs-button--active _fixButtonContrast_im0vm_41 _fixButtonCapitals_im0vm_45 buttonStyle _rightMargin8_im0vm_195 "
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
          className="irs-button irs-button--active inverted _fixButtonContrast_im0vm_41 _fixButtonCapitals_im0vm_45 buttonStyle"
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
