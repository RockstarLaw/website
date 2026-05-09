"use client";

/**
 * SchemaField — IRS EIN Wizard generic field renderer
 *
 * Renders a single field from ein__additionalDetails.json (or any EIN wizard
 * JSON schema). Supports all four field types present in the Additional Details
 * schema: TextInput, DropdownCommonInput, RadioInput, checkBoxInput.
 *
 * Design contract:
 *   - All class names are verbatim IRS SPA CSS module classes from the
 *     captured HTML (index-ChwXuGQH.js + captured screenshots).
 *   - No label text is written in this file. All label text comes from the
 *     fieldDef.fieldName (which callers source from the JSON schema).
 *   - Error message text comes from fieldDef.inputErrorMessages.
 *
 * Container CSS hashes:
 *   TextInput:         textInput _bottomMargin24_mw6ug_13
 *   DropdownInput:     dropdownInput _bottomMargin24_1pbi9_26
 *   RadioInput:        radioInput _bottomMargin18_1lntm_13
 *   checkBoxInput:     checkboxInput _bottomMargin24_mw6ug_13  (approximate — no separate capture)
 *
 * Note on legalNameInput container: The legal name field (legalName5InputControl)
 * uses a different CSS hash: textInput _bottomMargin24_yrq5v_13. Callers pass
 * className override when needed.
 */

import { STATE_OPTIONS, MONTH_OPTIONS } from "@/lib/irs/choiceTypes";
import Helptip, { type HelptipDef } from "./Helptip";

export type SchemaFieldChoice = {
  value: string;
  text: string;
  additionalText?: string[];
};

export type SchemaFieldDef = {
  fieldName: string;
  additionalText: string[];
  type: "TextInput" | "DropdownCommonInput" | "RadioInput" | "checkBoxInput";
  choices?: SchemaFieldChoice[];
  /** Standard key. Some JSON nodes use choicesType (different key) — both are handled. */
  choiceType?: "stateTypes1" | "monthTypes";
  /** Alternate key used by firstPayMonthInputControl in the JSON schema */
  choicesType?: string;
  inputErrorMessages?: Array<{ text: string; id: string; additionalText?: string[] }>;
  // For checkBoxInput
  choice?: string;
};

export type SchemaFieldProps = {
  fieldDef: SchemaFieldDef;
  /** HTML id + name for the input element */
  inputName: string;
  value: string;
  onChange: (value: string) => void;
  isRequired: boolean;
  /** Currently active error message text (empty string = no error) */
  errorMessage?: string;
  /** Helptip definition — rendered after the label text */
  helptipDef?: HelptipDef;
  /** Override container className (e.g. for legalName's yrq5v hash) */
  containerClassName?: string;
  /** Override inner wrapper className */
  innerClassName?: string;
};

export default function SchemaField({
  fieldDef,
  inputName,
  value,
  onChange,
  isRequired,
  errorMessage = "",
  helptipDef,
  containerClassName,
  innerClassName,
}: SchemaFieldProps) {
  const hasError = errorMessage !== "";

  // ── Label block shared by all types ──────────────────────────────────────
  const labelBlock = (
    <div className="inputInstruction _bottomMargin8_bppll_6 ">
      <label htmlFor={`${inputName}Input`}>
        {fieldDef.fieldName}
        {isRequired && (
          <span className="_required_bppll_1" role="asterisk">*</span>
        )}
        {helptipDef && (
          <Helptip def={helptipDef} instanceId={inputName} />
        )}
      </label>
      {fieldDef.additionalText.length > 0 && (
        <ul className="_ulNoBulletsGrey_bppll_12 _bottomMargin8_bppll_6">
          {fieldDef.additionalText.map((txt, i) => (
            <li key={i}>{txt}</li>
          ))}
        </ul>
      )}
    </div>
  );

  // ── TextInput ─────────────────────────────────────────────────────────────
  if (fieldDef.type === "TextInput") {
    const containerCls = containerClassName ?? "textInput _bottomMargin24_mw6ug_13 ";
    const innerCls     = innerClassName     ?? "undefined _removeInlineErrorMargin_mw6ug_17";
    return (
      <div className={containerCls}>
        {labelBlock}
        <div className={innerCls}>
          <div>
            <input
              aria-label={`${fieldDef.fieldName}${isRequired ? ", Required" : ""}`}
              id={`${inputName}Input`}
              name={inputName}
              type="text"
              className={`input-text ${hasError ? "input-text--error" : "null"} `}
              placeholder=""
              autoComplete="off"
              autoCorrect="off"
              required={isRequired}
              aria-required={isRequired}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            <p className="input-error-message" aria-live="polite">
              {errorMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── DropdownCommonInput ───────────────────────────────────────────────────
  if (fieldDef.type === "DropdownCommonInput") {
    // Normalise choiceType — JSON uses "monthType" in firstPayMonthInputControl
    const resolvedChoiceType =
      fieldDef.choiceType ?? (fieldDef.choicesType?.startsWith("month") ? "monthTypes" : undefined);
    const options =
      resolvedChoiceType === "stateTypes1"
        ? STATE_OPTIONS
        : resolvedChoiceType === "monthTypes"
        ? MONTH_OPTIONS
        : (fieldDef.choices?.map((c) => [c.value, c.text] as [string, string]) ?? []);

    return (
      <div className="dropdownInput _bottomMargin24_1pbi9_26 ">
        {labelBlock}
        <select
          id={`${inputName}Input`}
          name={inputName}
          className={`single-select ${hasError ? "single-select--error" : "single-select--no-error"} _removeSelectMargin_1pbi9_1`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-required={isRequired}
        >
          <option value="" disabled hidden>
            Select an Option
          </option>
          {options.map(([val, label], idx) => (
            <option key={`${val}-${idx}`} value={val}>
              {label}
            </option>
          ))}
        </select>
        {hasError && (
          <p className="input-error-message" aria-live="polite">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  // ── RadioInput ────────────────────────────────────────────────────────────
  if (fieldDef.type === "RadioInput") {
    const choices = fieldDef.choices ?? [];
    return (
      <div className="radioInput _bottomMargin18_1lntm_13 ">
        <div className="inputInstruction _bottomMargin8_bppll_6 ">
          <label htmlFor={`${inputName}Input`}>
            {fieldDef.fieldName}
            {isRequired && (
              <span className="_required_bppll_1" role="asterisk">*</span>
            )}
            {helptipDef && (
              <Helptip def={helptipDef} instanceId={inputName} />
            )}
          </label>
        </div>
        <fieldset
          className="radio-group _fixRadioMargin_1lntm_21 undefined"
          data-testid="radio-group"
        >
          <legend data-testid="legend" className="sr-only">
            {" "}{fieldDef.fieldName}{" "}
          </legend>
          {choices.map((choice) => (
            <div key={choice.value}>
              <div className={value === choice.value ? "radio-button radio-button--checked" : "radio-button"}>
                <input
                  tabIndex={0}
                  type="radio"
                  className="radio-button__input"
                  data-testid={`${choice.value}${inputName}id`}
                  id={`${choice.value}${inputName}id`}
                  name={inputName}
                  aria-required="false"
                  value={choice.value}
                  checked={value === choice.value}
                  onChange={() => onChange(choice.value)}
                />
                <label className="input-label " htmlFor={`${choice.value}${inputName}id`}>
                  {choice.text}
                </label>
              </div>
              {choice.additionalText?.map((txt, i) => (
                <p key={i} className="_choiceAdditionalText_1lntm_34">{txt}</p>
              ))}
            </div>
          ))}
        </fieldset>
        <p className="input-error-message" aria-live="polite">
          {errorMessage}
        </p>
      </div>
    );
  }

  // ── checkBoxInput ─────────────────────────────────────────────────────────
  if (fieldDef.type === "checkBoxInput") {
    const checked = value === "yes";
    return (
      <div className="checkboxInput _bottomMargin24_mw6ug_13 ">
        <div className="inputInstruction _bottomMargin8_bppll_6 ">
          <label htmlFor={`${inputName}Input`}>
            {fieldDef.fieldName}
            {isRequired && (
              <span className="_required_bppll_1" role="asterisk">*</span>
            )}
          </label>
        </div>
        <div className="undefined _removeInlineErrorMargin_mw6ug_17">
          <div>
            <input
              id={`${inputName}Input`}
              name={inputName}
              type="checkbox"
              className="checkbox-input"
              checked={checked}
              onChange={(e) => onChange(e.target.checked ? "yes" : "")}
              aria-required={isRequired}
            />
            <label htmlFor={`${inputName}Input`} className="input-label ">
              {fieldDef.choice ?? ""}
            </label>
            <p className="input-error-message" aria-live="polite">
              {errorMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
