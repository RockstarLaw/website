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
 * Section 3 (wo, conditional — shows when provideW2Form/haveEmployees = "yes"):
 *   describeYourEmployeesSection.subHeader
 *   instructions5 (first pay date)  — firstPayMonthInputControl + firstPayYearInputControl
 *   instructions6 (employee counts) — numOfAgriculturalEmployeesInputControl +
 *                                      numOfHouseholdEmployeesInputControl (if showHouseholdEmployees) +
 *                                      numOfOtherEmployeesInputControl
 *   employeeTaxLiabilityInputControl — RadioInput yes/no, Form 944 / Form 941 gate
 *   (Scope A, Slice 6)
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
  /** Forbidden endings list for legalName Rule 2 — verbatim port of ka() from index-ChwXuGQH.js.
   *  Uppercased. Used with value.trim().toUpperCase().endsWith(). Empty = no forbidden endings. */
  legalNameForbiddenEndings: string[];
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
  agEmployeesFieldDef:          SchemaFieldDef;
  /** numOfHouseholdEmployeesInputControl — only rendered when showHouseholdEmployees = true */
  householdEmployeesFieldDef:   SchemaFieldDef;
  otherEmployeesFieldDef:       SchemaFieldDef;
  taxLiabilityFieldDef:         SchemaFieldDef;
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
  agEmployeesHelptip:        HelptipDef;
  /** numOfHouseholdEmployeesHelp — rendered only when showHouseholdEmployees = true */
  householdEmployeesHelptip:  HelptipDef;
  otherEmployeesHelptip:      HelptipDef;
  firstPayDateHelptip:        HelptipDef;
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
  const [hasEmployees,        setHasEmployees]        = useState("");
  // Scope A (Slice 6) — employees=Yes sub-section (wo() in bundle)
  const [firstPayMonth,       setFirstPayMonth]       = useState("");
  const [firstPayYear,        setFirstPayYear]        = useState("");
  const [agEmployees,         setAgEmployees]         = useState("");
  const [householdEmployees,  setHouseholdEmployees]  = useState("");
  const [otherEmployees,      setOtherEmployees]      = useState("");
  const [taxLiability,        setTaxLiability]        = useState("");

  // ── Error state ────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formRef = useRef<HTMLFormElement>(null);

  // ── Validation + submission ────────────────────────────────────────────────
  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // ── Scope B (Slice 6): legalName — all 5 rules in run order, verbatim from ha() in index-ChwXuGQH.js ──
    const lnErrs = schema.legalNameFieldDef.inputErrorMessages ?? [];
    if (!legalName.trim()) {
      // Rule 1 — required: P === "" → inputErrorMessages[0]
      newErrors.legalName = lnErrs[0]?.text ?? "Legal Name: Input is required.";
    } else {
      const upper    = legalName.trim().toUpperCase();
      const forbidden = schema.legalNameForbiddenEndings;
      if (forbidden.some(end => upper.endsWith(end))) {
        // Rule 2 — forbidden endings: !ka(P, entityType) → inputErrorMessages[1] (entity-specific)
        newErrors.legalName = lnErrs[1]?.text ?? "Legal Name: Contains an ending which is not permitted.";
      } else if (!/^[A-Za-z0-9& -]+$/.test(legalName)) {
        // Rule 3 — special chars: !qe.validateLegalName(P) → Kn.legalNamePattern /^[A-Za-z0-9& -]+$/
        newErrors.legalName = lnErrs[2]?.text ?? "Legal Name: The only special characters allowed are '-' and '&'.";
      } else if (legalName.split(" ").some(w => w.length > 34)) {
        // Rule 4 — word length: !Ks(P) → any word.length > 34
        newErrors.legalName = lnErrs[3]?.text ?? "Legal Name: Individual words cannot exceed 34 characters.";
      } else if (!/^[A-Za-z1-9]/.test(legalName)) {
        // Rule 5 — first char: !qe.validateAlphaNumericNonZeroFirstChar(P) → X4 /^[A-Za-z1-9]/
        newErrors.legalName = lnErrs[4]?.text ?? "Legal Name: The first character must be alpha or numeric but cannot contain any leading zeros.";
      }
    }
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

    // ── Scope A (Slice 6): wo() section — validate when employeesQuestion rendered AND answered "yes" ──
    if (schema.employeesQuestionFieldDef && hasEmployees === "yes") {
      // First pay date — instructions5 group
      const fpmErrs = schema.firstPayMonthFieldDef.inputErrorMessages ?? [];
      if (!firstPayMonth)
        newErrors.firstPayMonth = fpmErrs[0]?.text ?? "First Pay Month: Selection is required.";
      const fpyErrs = schema.firstPayYearFieldDef.inputErrorMessages ?? [];
      if (!firstPayYear.trim())
        newErrors.firstPayYear = fpyErrs[0]?.text ?? "First Pay Year: Input is required.";
      else if (!/^[0-9]{4}$/.test(firstPayYear))
        newErrors.firstPayYear = fpyErrs[1]?.text ?? "First Pay Year: Year must consist of 4 numbers.";
      // Employee counts — instructions6 group (numeric, optional per field; total ≥ 1)
      const agErrs = schema.agEmployeesFieldDef.inputErrorMessages ?? [];
      if (agEmployees.trim() && !/^[0-9]+$/.test(agEmployees.trim()))
        newErrors.agEmployees = agErrs[0]?.text ?? "Number of agricultural employees: must be a number";
      if (schema.showHouseholdEmployees) {
        const hhErrs = schema.householdEmployeesFieldDef.inputErrorMessages ?? [];
        if (householdEmployees.trim() && !/^[0-9]+$/.test(householdEmployees.trim()))
          newErrors.householdEmployees = hhErrs[0]?.text ?? "Number of household employees: must be a number";
      }
      const otherErrs = schema.otherEmployeesFieldDef.inputErrorMessages ?? [];
      if (otherEmployees.trim() && !/^[0-9]+$/.test(otherEmployees.trim()))
        newErrors.otherEmployees = otherErrs[0]?.text ?? "Number of other employees: must be a number";
      // Total ≥ 1 check — instructions6.inputErrorMessages[0] verbatim
      const agCount    = parseInt(agEmployees    || "0", 10) || 0;
      const hhCount    = schema.showHouseholdEmployees
        ? (parseInt(householdEmployees || "0", 10) || 0) : 0;
      const otherCount = parseInt(otherEmployees  || "0", 10) || 0;
      if (agCount + hhCount + otherCount < 1) {
        const totalErrs = schema.empCountInstructions.inputErrorMessages ?? [];
        newErrors.empTotal = totalErrs[0]?.text ?? "The total number of employees must be at least 1 and not greater than 99,999";
      }
      // Tax liability — employeeTaxLiabilityInputControl
      const tlErrs = schema.taxLiabilityFieldDef.inputErrorMessages ?? [];
      if (!taxLiability)
        newErrors.taxLiability = tlErrs[0]?.text ?? "Tax Liability: Selection is required.";
    }

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
        {/* Scope A (Slice 6): W4b sub-section hidden inputs — only sent when hasEmployees=yes */}
        {hasEmployees === "yes" && (
          <>
            <input type="hidden" name="firstPayMonth"         value={firstPayMonth} />
            <input type="hidden" name="firstPayYear"          value={firstPayYear} />
            <input type="hidden" name="numAgEmployees"        value={agEmployees} />
            {schema.showHouseholdEmployees && (
              <input type="hidden" name="numHouseholdEmployees" value={householdEmployees} />
            )}
            <input type="hidden" name="numOtherEmployees"     value={otherEmployees} />
            <input type="hidden" name="taxLiability"          value={taxLiability} />
          </>
        )}
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

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — Describe your employees  (matches wo() in bundle)
          Conditional: renders only when hasEmployees === "yes"
          Verbatim text from describeYourEmployeesSection in
          irs-captures/json/ein__additionalDetails.json per HR#1.
          Gated on schema.employeesQuestionFieldDef (null when ma()=false).
          ══════════════════════════════════════════════════════════════════ */}
      {schema.employeesQuestionFieldDef && hasEmployees === "yes" && (
        <section className="_bottomMargin16_im0vm_119">
          {/* Subheader — describeYourEmployeesSection.subHeader.title */}
          <section className="_bottomMargin24_im0vm_124">
            <h4 className="sectionHeader _fontSize20_im0vm_203 ">
              {schema.describeEmpSubHeader.title}
            </h4>
          </section>

          {/* instructions5 — first date wages/annuities were or will be paid
              Fieldset structure mirrors start-date in fl(): month dropdown + year text
              side-by-side via _startDateInputs_im0vm_49.
              Helptip: firstWagesPaidDateHelp — "Wages Paid Date" */}
          <div className="dropdownInput _bottomMargin24_1pbi9_26 ">
            <div className="inputInstruction _bottomMargin8_bppll_6 ">
              <label>
                {schema.firstPayDateInstructions.title}
                <span className="_required_bppll_1" role="asterisk">*</span>
                <Helptip def={schema.firstPayDateHelptip} instanceId="firstPayDate" />
              </label>
              {schema.firstPayDateInstructions.additionalText.length > 0 && (
                <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
                  {schema.firstPayDateInstructions.additionalText.map((txt, i) => (
                    <li key={i}>{txt}</li>
                  ))}
                </ul>
              )}
            </div>
            <fieldset className="_formatFieldset_im0vm_63">
              <legend className="_srOnly_im0vm_69">{schema.firstPayDateInstructions.title}</legend>
              <div className="_startDateInputs_im0vm_49">
                {/* firstPayMonthInputControl — DropdownCommonInput / monthType */}
                <div className="dropdownInput _bottomMargin24_1pbi9_26 ">
                  <div className="inputInstruction _bottomMargin8_bppll_6 ">
                    <label htmlFor="firstPayMonthInputControl">
                      {schema.firstPayMonthFieldDef.fieldName}
                    </label>
                  </div>
                  <select
                    id="firstPayMonthInputControl"
                    className={`single-select ${
                      errors.firstPayMonth ? "single-select--error" : "single-select--no-error"
                    } _removeSelectMargin_1pbi9_1`}
                    value={firstPayMonth}
                    onChange={(e) => setFirstPayMonth(e.target.value)}
                    aria-required={true}
                  >
                    <option value="" disabled hidden>Select an Option</option>
                    {MONTH_OPTIONS.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  {errors.firstPayMonth && (
                    <p className="input-error-message" aria-live="polite">{errors.firstPayMonth}</p>
                  )}
                </div>
                {/* firstPayYearInputControl — TextInput */}
                <div className="textInput _bottomMargin24_mw6ug_13 ">
                  <div className="inputInstruction _bottomMargin8_bppll_6 ">
                    <label htmlFor="firstPayYearInputControl">
                      {schema.firstPayYearFieldDef.fieldName}
                    </label>
                  </div>
                  <div className="undefined _removeInlineErrorMargin_mw6ug_17">
                    <div>
                      <input
                        id="firstPayYearInputControl"
                        type="text"
                        className={`input-text ${errors.firstPayYear ? "input-text--error" : "null"} `}
                        placeholder=""
                        autoComplete="off"
                        autoCorrect="off"
                        aria-required={false}
                        value={firstPayYear}
                        onChange={(e) => setFirstPayYear(e.target.value)}
                      />
                      <p className="input-error-message" aria-live="polite">{errors.firstPayYear}</p>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          {/* instructions6 — highest number of employees expected in next 12 months
              Label group, then ag / household (conditional) / other count fields.
              Helptip on the label: maxEmployeesHelp. */}
          <div className="inputInstruction _bottomMargin8_bppll_6 ">
            <label>
              {schema.empCountInstructions.title}
              <span className="_required_bppll_1" role="asterisk">*</span>
              <Helptip def={schema.maxEmployeesHelptip} instanceId="maxEmployees" />
            </label>
            {schema.empCountInstructions.additionalText.length > 0 && (
              <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
                {schema.empCountInstructions.additionalText.map((txt, i) => (
                  <li key={i}>{txt}</li>
                ))}
              </ul>
            )}
          </div>

          {/* numOfAgriculturalEmployeesInputControl — TextInput */}
          <SchemaField
            fieldDef={schema.agEmployeesFieldDef}
            inputName="numAgEmployees"
            value={agEmployees}
            onChange={setAgEmployees}
            isRequired={false}
            errorMessage={errors.agEmployees}
            helptipDef={schema.agEmployeesHelptip}
          />

          {/* numOfHouseholdEmployeesInputControl — conditional: ds() predicate.
              false for SMLLC/MMLLC; true for SOLE_PROPRIETOR, ESTATE, trust types, etc. */}
          {schema.showHouseholdEmployees && (
            <SchemaField
              fieldDef={schema.householdEmployeesFieldDef}
              inputName="numHouseholdEmployees"
              value={householdEmployees}
              onChange={setHouseholdEmployees}
              isRequired={false}
              errorMessage={errors.householdEmployees}
              helptipDef={schema.householdEmployeesHelptip}
            />
          )}

          {/* numOfOtherEmployeesInputControl — TextInput */}
          <SchemaField
            fieldDef={schema.otherEmployeesFieldDef}
            inputName="numOtherEmployees"
            value={otherEmployees}
            onChange={setOtherEmployees}
            isRequired={false}
            errorMessage={errors.otherEmployees}
            helptipDef={schema.otherEmployeesHelptip}
          />

          {/* Total employees must be ≥ 1 — instructions6.inputErrorMessages[0] verbatim */}
          {errors.empTotal && (
            <p className="input-error-message" aria-live="polite">{errors.empTotal}</p>
          )}

          {/* employeeTaxLiabilityInputControl — RadioInput yes/no
              Rendered inline (not via SchemaField) so that fieldDef.additionalText renders
              verbatim from JSON ("Note: By selecting 'yes'..."). SchemaField RadioInput
              branch omits top-level additionalText; rendering manually per HR#1.
              Per-choice additionalText (Form 944 / Form 941 notes) renders via
              choice.additionalText array. */}
          <div className="radioInput _bottomMargin18_1lntm_13 ">
            <div className="inputInstruction _bottomMargin8_bppll_6 ">
              <label htmlFor="yestaxLiabilityInputid">
                {schema.taxLiabilityFieldDef.fieldName}
                <span className="_required_bppll_1" role="asterisk">*</span>
                <Helptip def={schema.taxLiabilityHelptip} instanceId="taxLiabilityInput" />
              </label>
            </div>
            {schema.taxLiabilityFieldDef.additionalText.length > 0 && (
              <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
                {schema.taxLiabilityFieldDef.additionalText.map((txt, i) => (
                  <li key={i}>{txt}</li>
                ))}
              </ul>
            )}
            <fieldset
              className="radio-group _fixRadioMargin_1lntm_21 undefined"
              data-testid="radio-group"
            >
              <legend data-testid="legend" className="sr-only">
                {" "}{schema.taxLiabilityFieldDef.fieldName}{" "}
              </legend>
              {(schema.taxLiabilityFieldDef.choices ?? []).map((choice) => (
                <div key={choice.value}>
                  <div className={
                    taxLiability === choice.value
                      ? "radio-button radio-button--checked"
                      : "radio-button"
                  }>
                    <input
                      tabIndex={0}
                      type="radio"
                      className="radio-button__input"
                      data-testid={`${choice.value}taxLiabilityInputid`}
                      id={`${choice.value}taxLiabilityInputid`}
                      name="taxLiabilityInput"
                      aria-required="false"
                      value={choice.value}
                      checked={taxLiability === choice.value}
                      onChange={() => setTaxLiability(choice.value)}
                    />
                    <label className="input-label " htmlFor={`${choice.value}taxLiabilityInputid`}>
                      {choice.text}
                    </label>
                  </div>
                  {choice.additionalText?.map((txt, i) => (
                    <p key={i} className="_choiceAdditionalText_1lntm_34">{txt}</p>
                  ))}
                </div>
              ))}
            </fieldset>
            <p className="input-error-message" aria-live="polite">{errors.taxLiability}</p>
          </div>
        </section>
      )}

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
