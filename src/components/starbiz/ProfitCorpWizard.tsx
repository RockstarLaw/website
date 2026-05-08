"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { submitProfitCorp } from "@/app/starbiz/filing/profit-corp/actions";
import { HelpTip } from "@/components/assisted-mode/HelpTip";
import type {
  DirectorRow,
  OfficerRow,
  WizardData,
} from "@/lib/starbiz/profit-corp-types";

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_DATA: WizardData = {
  name: "", purpose: "", effectiveDate: "",
  sharesAuthorized: "", parValueDollars: "", shareClassName: "Common",
  principalStreet: "", principalCity: "", principalState: "", principalZip: "",
  mailingIsSame: true,
  mailingStreet: "", mailingCity: "", mailingState: "", mailingZip: "",
  raName: "", raStreet: "", raCity: "", raState: "FL", raZip: "", raEmail: "", raAccepted: false,
  incorporatorName: "", incorporatorStreet: "", incorporatorCity: "", incorporatorState: "", incorporatorZip: "",
  feiEin: "", feeAcknowledged: false,
};

const EMPTY_DIRECTOR = (): DirectorRow => ({ name: "", title: "", street: "", city: "", state: "", zip: "" });
const EMPTY_OFFICER  = (): OfficerRow  => ({ name: "", title: "", street: "", city: "", state: "", zip: "" });

// ─── Styles ───────────────────────────────────────────────────────────────────

const NAVY   = "#003366";
const MAROON = "#800000";
const WHITE  = "#FFFFFF";
const RED    = "#cc0000";

const sInput:   React.CSSProperties = { border: "1px solid #666", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", padding: "2px 4px" };
const sLabel:   React.CSSProperties = { fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" };
const sSection: React.CSSProperties = { backgroundColor: NAVY, color: WHITE, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontWeight: "bold", padding: "3px 8px", marginTop: "10px", marginBottom: "6px" };
const sError:   React.CSSProperties = { color: RED, fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", display: "block", marginTop: "2px" };
const sTd:      React.CSSProperties = { fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", padding: "3px 6px", verticalAlign: "top" };

type Errors = Partial<Record<string, string>>;

// ─── Validation ───────────────────────────────────────────────────────────────

function hasCorpSuffix(n: string): boolean {
  return /\b(corp\.?|corporation|inc\.?|incorporated|co\.?|company)\b/i.test(n);
}

function validZip(z: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(z.trim());
}

function validEin(v: string): boolean {
  return /^\d{2}-\d{7}$/.test(v.trim());
}

function validateStep(
  step: number,
  d: WizardData,
  directors: DirectorRow[],
  officers: OfficerRow[],
): Errors {
  const e: Errors = {};

  if (step === 1) {
    if (!d.name.trim()) {
      e.name = "Corporate name is required.";
    } else if (!hasCorpSuffix(d.name)) {
      e.name = "Name must include 'Corporation', 'Incorporated', 'Company', or an abbreviation ('Corp.', 'Inc.', 'Co.').";
    }
    const sharesNum = Number(d.sharesAuthorized);
    if (!d.sharesAuthorized.trim()) {
      e.sharesAuthorized = "Number of authorized shares is required.";
    } else if (!Number.isInteger(sharesNum) || sharesNum < 1) {
      e.sharesAuthorized = "Authorized shares must be a positive whole number.";
    }
    const parRaw = d.parValueDollars.trim();
    if (parRaw && parRaw !== "0") {
      const parNum = Number(parRaw);
      if (!Number.isFinite(parNum) || parNum < 0) {
        e.parValueDollars = "Par value must be a non-negative number, or blank for no par value.";
      }
    }
    if (d.effectiveDate) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const chosen = new Date(d.effectiveDate + "T00:00:00");
      const ninetyDays = new Date(today); ninetyDays.setDate(ninetyDays.getDate() + 90);
      if (chosen < today)        e.effectiveDate = "Effective date must be today or a future date.";
      if (chosen > ninetyDays)   e.effectiveDate = "Effective date may not be more than 90 days in the future.";
    }
  }

  if (step === 2) {
    if (!d.principalStreet.trim()) e.principalStreet = "Street address is required.";
    if (!d.principalCity.trim())   e.principalCity   = "City is required.";
    if (!d.principalState.trim())  e.principalState  = "State is required.";
    if (!d.principalZip.trim())    e.principalZip    = "ZIP code is required.";
    else if (!validZip(d.principalZip)) e.principalZip = "Enter a valid ZIP code.";
    if (!d.mailingIsSame) {
      if (!d.mailingStreet.trim()) e.mailingStreet = "Mailing street is required.";
      if (!d.mailingCity.trim())   e.mailingCity   = "Mailing city is required.";
      if (!d.mailingState.trim())  e.mailingState  = "Mailing state is required.";
      if (!d.mailingZip.trim())    e.mailingZip    = "Mailing ZIP is required.";
      else if (!validZip(d.mailingZip)) e.mailingZip = "Enter a valid ZIP code.";
    }
  }

  if (step === 3) {
    if (!d.raName.trim())   e.raName   = "Registered agent name is required.";
    if (!d.raStreet.trim()) e.raStreet = "Street address is required.";
    if (!d.raCity.trim())   e.raCity   = "City is required.";
    if (d.raState.trim().toUpperCase() !== "FL") e.raState = "Registered agent address must be in Florida (FL).";
    if (!d.raZip.trim())    e.raZip    = "ZIP code is required.";
    else if (!validZip(d.raZip)) e.raZip = "Enter a valid Florida ZIP code.";
    if (!d.raAccepted) e.raAccepted = "Registered agent must accept the appointment.";
  }

  if (step === 4) {
    if (!directors[0]?.name.trim()) e["director_0_name"] = "At least one director is required.";
    directors.forEach((dir, i) => {
      if (dir.name.trim() && !dir.street.trim()) e[`director_${i}_street`] = "Address required.";
      if (dir.name.trim() && !dir.city.trim())   e[`director_${i}_city`]   = "City required.";
      if (dir.name.trim() && !dir.state.trim())  e[`director_${i}_state`]  = "State required.";
      if (dir.name.trim() && !dir.zip.trim())    e[`director_${i}_zip`]    = "ZIP required.";
    });
    officers.forEach((off, i) => {
      if (off.name.trim() && !off.street.trim()) e[`officer_${i}_street`] = "Address required.";
      if (off.name.trim() && !off.city.trim())   e[`officer_${i}_city`]   = "City required.";
      if (off.name.trim() && !off.state.trim())  e[`officer_${i}_state`]  = "State required.";
      if (off.name.trim() && !off.zip.trim())    e[`officer_${i}_zip`]    = "ZIP required.";
    });
    if (!d.incorporatorName.trim())   e.incorporatorName   = "Incorporator name is required.";
    if (!d.incorporatorStreet.trim()) e.incorporatorStreet = "Incorporator address is required.";
    if (!d.incorporatorCity.trim())   e.incorporatorCity   = "Incorporator city is required.";
    if (!d.incorporatorState.trim())  e.incorporatorState  = "Incorporator state is required.";
    if (!d.incorporatorZip.trim())    e.incorporatorZip    = "Incorporator ZIP is required.";
    if (d.feiEin.trim() && !validEin(d.feiEin)) e.feiEin = "EIN must be in XX-XXXXXXX format.";
    if (!d.feeAcknowledged) e.feeAcknowledged = "You must acknowledge the filing fee to proceed.";
  }

  return e;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Err({ msg }: { msg?: string }) {
  return msg ? <span style={sError}>{msg}</span> : null;
}

function Field({
  label, help, helpLabel, children, error,
}: {
  label: string; help?: string; helpLabel?: string; children: React.ReactNode; error?: string;
}) {
  return (
    <tr>
      <td style={{ ...sTd, width: "200px" }}>
        <span style={sLabel}>{label}</span>
        {help && <HelpTip helpText={help} label={helpLabel ?? label} />}
      </td>
      <td style={sTd}>{children}<Err msg={error} /></td>
    </tr>
  );
}

// ─── Step 1 — Identity & Stock ────────────────────────────────────────────────

function Step1({
  d, up, e,
}: {
  d: WizardData;
  up: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
  e: Errors;
}) {
  return (
    <div>
      <div style={sSection}>Article I — Corporate Identity &amp; Stock</div>

      <div style={{ backgroundColor: "#FFFFF0", border: "1px solid #999", padding: "4px 8px", fontFamily: "Arial", fontSize: "11px", color: "#333", marginBottom: "6px" }}>
        Names must be unique. If your chosen name is already filed, you&rsquo;ll be asked to choose a different one when you submit.
      </div>

      <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
        <tbody>
          <Field
            label="Corporate Name *"
            help="The name must include a corporate designator: 'Corporation', 'Incorporated', 'Company', or an accepted abbreviation ('Corp.', 'Inc.', 'Co.'). Names are case-insensitive — 'Acme Inc.' and 'ACME INC.' count as the same name."
            helpLabel="Corporate Name"
            error={e.name}
          >
            <input
              type="text" value={d.name}
              onChange={ev => up("name", ev.target.value)}
              style={{ ...sInput, width: "320px" }} maxLength={120}
              placeholder="e.g. Sunshine Legal Services, Inc." autoFocus
            />
            <span style={{ fontFamily: "Arial", fontSize: "10px", color: "#666", marginLeft: "6px" }}>
              (must include Corp., Inc., Co., Corporation, Incorporated, or Company)
            </span>
          </Field>

          <Field
            label="Shares Authorized *"
            help="The total number of shares the corporation is authorized to issue. Must be a positive whole number. You can authorize more shares than you plan to issue initially."
            error={e.sharesAuthorized}
          >
            <input
              type="number" min="1" step="1" value={d.sharesAuthorized}
              onChange={ev => up("sharesAuthorized", ev.target.value)}
              style={{ ...sInput, width: "130px" }} placeholder="e.g. 1000"
            />
          </Field>

          <Field
            label="Par Value (per share)"
            help="The minimum price per share set in the articles. Leave blank or enter 0 for 'no par value,' which is standard for most Florida corporations. If set, enter a dollar amount (e.g. 0.001 or 1.00)."
            error={e.parValueDollars}
          >
            <span style={{ fontFamily: "Arial", fontSize: "12px", marginRight: "4px" }}>$</span>
            <input
              type="text" value={d.parValueDollars}
              onChange={ev => up("parValueDollars", ev.target.value)}
              style={{ ...sInput, width: "100px" }} placeholder="blank = no par value"
            />
            <span style={{ fontFamily: "Arial", fontSize: "10px", color: "#666", marginLeft: "8px" }}>
              (blank or 0 = no par value)
            </span>
          </Field>

          <Field
            label="Share Class Name"
            help="The name of the class of stock. 'Common' is the standard for most Florida corporations. Only change this if your articles specifically designate a different class name."
            error={e.shareClassName}
          >
            <input
              type="text" value={d.shareClassName}
              onChange={ev => up("shareClassName", ev.target.value)}
              style={{ ...sInput, width: "140px" }} maxLength={60}
              placeholder="Common"
            />
          </Field>

          <Field
            label="Purpose"
            help="Optional in Florida. 'Any lawful purpose' is the standard entry for most corporations. Only specify a purpose if your corporation is chartered for something specific."
            error={e.purpose}
          >
            <input
              type="text" value={d.purpose}
              onChange={ev => up("purpose", ev.target.value)}
              style={{ ...sInput, width: "320px" }} maxLength={500}
              placeholder="any lawful purpose"
            />
          </Field>

          <Field
            label="Effective Date"
            help="Leave blank for the corporation to become effective immediately upon filing. Choose a future date (up to 90 days) if you need to delay activation."
            error={e.effectiveDate}
          >
            <input
              type="date" value={d.effectiveDate}
              onChange={ev => up("effectiveDate", ev.target.value)}
              style={sInput}
            />
            <span style={{ fontFamily: "Arial", fontSize: "10px", color: "#666", marginLeft: "6px" }}>
              (leave blank = effective immediately)
            </span>
          </Field>
        </tbody>
      </table>
    </div>
  );
}

// ─── Step 2 — Addresses ───────────────────────────────────────────────────────

function Step2({
  d, up, e,
}: {
  d: WizardData;
  up: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
  e: Errors;
}) {
  return (
    <div>
      <div style={sSection}>Article II — Principal Office</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
        <tbody>
          <Field label="Street Address *" help="The primary business address of the corporation. May be outside Florida. P.O. Boxes not accepted." error={e.principalStreet}>
            <input type="text" value={d.principalStreet} onChange={ev => up("principalStreet", ev.target.value)} style={{ ...sInput, width: "300px" }} />
          </Field>
          <Field label="City *" error={e.principalCity}>
            <input type="text" value={d.principalCity} onChange={ev => up("principalCity", ev.target.value)} style={{ ...sInput, width: "180px" }} />
          </Field>
          <Field label="State *" error={e.principalState}>
            <input type="text" value={d.principalState} onChange={ev => up("principalState", ev.target.value.toUpperCase())} style={{ ...sInput, width: "40px" }} maxLength={2} placeholder="FL" />
          </Field>
          <Field label="ZIP *" error={e.principalZip}>
            <input type="text" value={d.principalZip} onChange={ev => up("principalZip", ev.target.value)} style={{ ...sInput, width: "90px" }} placeholder="32801" />
          </Field>
        </tbody>
      </table>

      <div style={sSection}>Mailing Address</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td colSpan={2} style={sTd}>
              <label style={{ ...sLabel, fontWeight: "normal" }}>
                <input
                  type="checkbox" checked={d.mailingIsSame}
                  onChange={ev => up("mailingIsSame", ev.target.checked)}
                />
                {" "}Mailing address is the same as principal address
                <HelpTip helpText="Only provide a mailing address if you want correspondence sent somewhere other than the principal address." label="Mailing Address" />
              </label>
            </td>
          </tr>
          {!d.mailingIsSame && (
            <>
              <Field label="Mailing Street *" error={e.mailingStreet}>
                <input type="text" value={d.mailingStreet} onChange={ev => up("mailingStreet", ev.target.value)} style={{ ...sInput, width: "300px" }} />
              </Field>
              <Field label="City *" error={e.mailingCity}>
                <input type="text" value={d.mailingCity} onChange={ev => up("mailingCity", ev.target.value)} style={{ ...sInput, width: "180px" }} />
              </Field>
              <Field label="State *" error={e.mailingState}>
                <input type="text" value={d.mailingState} onChange={ev => up("mailingState", ev.target.value.toUpperCase())} style={{ ...sInput, width: "40px" }} maxLength={2} />
              </Field>
              <Field label="ZIP *" error={e.mailingZip}>
                <input type="text" value={d.mailingZip} onChange={ev => up("mailingZip", ev.target.value)} style={{ ...sInput, width: "90px" }} />
              </Field>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Step 3 — Registered Agent ────────────────────────────────────────────────

function Step3({
  d, up, e,
}: {
  d: WizardData;
  up: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
  e: Errors;
}) {
  return (
    <div>
      <div style={sSection}>Article III — Registered Agent</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
        <tbody>
          <Field
            label="RA Name *"
            help="The registered agent receives legal documents and official state correspondence on behalf of the corporation. Must be a Florida resident or a Florida-registered entity."
            error={e.raName}
          >
            <input type="text" value={d.raName} onChange={ev => up("raName", ev.target.value)} style={{ ...sInput, width: "280px" }} autoFocus />
          </Field>
          <Field
            label="RA Street Address *"
            help="Must be a physical Florida address. P.O. Boxes not accepted. This address is publicly searchable."
            error={e.raStreet}
          >
            <input type="text" value={d.raStreet} onChange={ev => up("raStreet", ev.target.value)} style={{ ...sInput, width: "300px" }} />
          </Field>
          <Field label="City *" error={e.raCity}>
            <input type="text" value={d.raCity} onChange={ev => up("raCity", ev.target.value)} style={{ ...sInput, width: "180px" }} />
          </Field>
          <Field label="State *" error={e.raState}>
            <input type="text" value={d.raState} onChange={ev => up("raState", ev.target.value.toUpperCase())} style={{ ...sInput, width: "40px" }} maxLength={2} />
            <span style={{ marginLeft: "6px", fontSize: "11px", color: "#666" }}>(must be FL)</span>
          </Field>
          <Field label="ZIP *" error={e.raZip}>
            <input type="text" value={d.raZip} onChange={ev => up("raZip", ev.target.value)} style={{ ...sInput, width: "90px" }} />
          </Field>
          <Field label="RA Email">
            <input type="email" value={d.raEmail} onChange={ev => up("raEmail", ev.target.value)} style={{ ...sInput, width: "220px" }} placeholder="optional" />
          </Field>
          <tr>
            <td colSpan={2} style={{ ...sTd, paddingTop: "10px" }}>
              <label style={{ ...sLabel, fontWeight: "normal", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <input
                  type="checkbox" checked={d.raAccepted}
                  onChange={ev => up("raAccepted", ev.target.checked)}
                  style={{ marginTop: "2px" }}
                />
                <span>
                  I hereby agree to act as registered agent for the above-named corporation and am familiar with and accept the obligations of that position.
                  <HelpTip helpText="The registered agent must accept the responsibility before being named. Check this box to simulate their acceptance." label="RA Acceptance" />
                </span>
              </label>
              <Err msg={e.raAccepted} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Reusable person-row block ────────────────────────────────────────────────

function PersonBlock<T extends DirectorRow | OfficerRow>({
  label, rows, setRows, emptyRow, errors, errorPrefix, maxRows = 10,
}: {
  label: string;
  rows: T[];
  setRows: React.Dispatch<React.SetStateAction<T[]>>;
  emptyRow: () => T;
  errors: Errors;
  errorPrefix: string;
  maxRows?: number;
}) {
  function updateRow(i: number, key: keyof T, value: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: value } : r));
  }

  return (
    <>
      <Err msg={errors[`${errorPrefix}_0_name`]} />
      {rows.map((r, i) => (
        <div
          key={i}
          style={{ border: "1px solid #999", padding: "8px", marginBottom: "6px", backgroundColor: i % 2 === 1 ? "#FFFF99" : WHITE }}
        >
          <div style={{ fontFamily: "Arial", fontSize: "11px", fontWeight: "bold", marginBottom: "4px", color: NAVY }}>
            {label} {i + 1}
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}
                style={{ marginLeft: "12px", fontSize: "10px", color: MAROON, border: "1px solid #999", background: WHITE, cursor: "pointer", padding: "1px 6px" }}
              >
                Remove
              </button>
            )}
          </div>
          <table cellPadding={0} cellSpacing={0}><tbody>
            <tr>
              <td style={sTd}>
                <span style={sLabel}>
                  Name {errorPrefix === "director" && i === 0 ? "*" : ""}
                  {i === 0 && (
                    <HelpTip
                      helpText={errorPrefix === "director"
                        ? "List the full legal name of each director. At least one director is required."
                        : "List the full legal name and title of each officer (e.g. President, Secretary, Treasurer)."}
                      label={`${label} Name`}
                    />
                  )}
                </span><br />
                <input
                  type="text" value={r.name}
                  onChange={ev => updateRow(i, "name" as keyof T, ev.target.value)}
                  style={{ ...sInput, width: "200px" }}
                />
                <Err msg={errors[`${errorPrefix}_${i}_name`]} />
              </td>
              <td style={sTd}>
                <span style={sLabel}>Title</span><br />
                <input
                  type="text" value={r.title}
                  onChange={ev => updateRow(i, "title" as keyof T, ev.target.value)}
                  style={{ ...sInput, width: "140px" }}
                  placeholder={errorPrefix === "officer" ? "e.g. President" : "e.g. Director"}
                />
              </td>
            </tr>
            <tr>
              <td style={sTd} colSpan={2}>
                <span style={sLabel}>Address {errorPrefix === "director" && r.name.trim() ? "*" : ""}</span>
                <span style={{ marginLeft: "8px" }}>
                  <input type="text" value={r.street} onChange={ev => updateRow(i, "street" as keyof T, ev.target.value)} style={{ ...sInput, width: "160px" }} placeholder="Street" />
                  {" "}<input type="text" value={r.city} onChange={ev => updateRow(i, "city" as keyof T, ev.target.value)} style={{ ...sInput, width: "110px" }} placeholder="City" />
                  {" "}<input type="text" value={r.state} onChange={ev => updateRow(i, "state" as keyof T, ev.target.value.toUpperCase())} style={{ ...sInput, width: "28px" }} maxLength={2} placeholder="ST" />
                  {" "}<input type="text" value={r.zip} onChange={ev => updateRow(i, "zip" as keyof T, ev.target.value)} style={{ ...sInput, width: "70px" }} placeholder="ZIP" />
                </span>
                <Err msg={errors[`${errorPrefix}_${i}_street`] || errors[`${errorPrefix}_${i}_city`] || errors[`${errorPrefix}_${i}_state`] || errors[`${errorPrefix}_${i}_zip`]} />
              </td>
            </tr>
          </tbody></table>
        </div>
      ))}
      {rows.length < maxRows && (
        <button
          type="button"
          onClick={() => setRows(prev => [...prev, emptyRow()])}
          style={{ backgroundColor: "#555", color: WHITE, border: "none", fontFamily: "Arial", fontSize: "11px", padding: "3px 10px", cursor: "pointer", marginBottom: "10px" }}
        >
          + Add {label}
        </button>
      )}
    </>
  );
}

// ─── Step 4 — Directors + Officers + Incorporator + Review ────────────────────

function Step4({
  d, up,
  directors, setDirectors,
  officers, setOfficers,
  e,
}: {
  d: WizardData;
  up: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
  directors: DirectorRow[];
  setDirectors: React.Dispatch<React.SetStateAction<DirectorRow[]>>;
  officers: OfficerRow[];
  setOfficers: React.Dispatch<React.SetStateAction<OfficerRow[]>>;
  e: Errors;
}) {
  return (
    <div>
      {/* Directors */}
      <div style={sSection}>Article IV — Directors (≥ 1 required)</div>
      <PersonBlock
        label="Director"
        rows={directors}
        setRows={setDirectors}
        emptyRow={EMPTY_DIRECTOR}
        errors={e}
        errorPrefix="director"
      />

      {/* Officers */}
      <div style={sSection}>Officers</div>
      <PersonBlock
        label="Officer"
        rows={officers}
        setRows={setOfficers}
        emptyRow={EMPTY_OFFICER}
        errors={e}
        errorPrefix="officer"
        maxRows={10}
      />

      {/* Incorporator */}
      <div style={sSection}>Incorporator (Filer of Record)</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}><tbody>
        <Field
          label="Incorporator Name *"
          help="The person submitting this filing. Does not have to be a director or officer — they are the filer of record."
          error={e.incorporatorName}
        >
          <input
            type="text" value={d.incorporatorName}
            onChange={ev => up("incorporatorName", ev.target.value)}
            style={{ ...sInput, width: "240px" }}
          />
        </Field>
        <tr>
          <td style={sTd}><span style={sLabel}>Incorporator Address *</span></td>
          <td style={sTd}>
            <input type="text" value={d.incorporatorStreet} onChange={ev => up("incorporatorStreet", ev.target.value)} style={{ ...sInput, width: "160px" }} placeholder="Street" />
            {" "}<input type="text" value={d.incorporatorCity} onChange={ev => up("incorporatorCity", ev.target.value)} style={{ ...sInput, width: "110px" }} placeholder="City" />
            {" "}<input type="text" value={d.incorporatorState} onChange={ev => up("incorporatorState", ev.target.value.toUpperCase())} style={{ ...sInput, width: "28px" }} maxLength={2} placeholder="ST" />
            {" "}<input type="text" value={d.incorporatorZip} onChange={ev => up("incorporatorZip", ev.target.value)} style={{ ...sInput, width: "70px" }} placeholder="ZIP" />
            <Err msg={e.incorporatorStreet || e.incorporatorCity || e.incorporatorState || e.incorporatorZip} />
          </td>
        </tr>
        <Field
          label="FEI / EIN"
          help="Optional at formation. Obtain your EIN from the IRS after the corporation is formed. Format: XX-XXXXXXX."
          error={e.feiEin}
        >
          <input
            type="text" value={d.feiEin}
            onChange={ev => up("feiEin", ev.target.value)}
            style={{ ...sInput, width: "120px" }} placeholder="XX-XXXXXXX"
          />
          <span style={{ fontFamily: "Arial", fontSize: "10px", color: "#666", marginLeft: "8px" }}>
            optional — obtain from IRS after filing
          </span>
        </Field>
      </tbody></table>

      {/* Fee acknowledgment */}
      <div style={sSection}>Filing Fee Acknowledgment</div>
      <div style={{ padding: "8px", border: "1px solid #999", backgroundColor: "#FFFFF0" }}>
        <label style={{ ...sLabel, fontWeight: "normal", display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <input
            type="checkbox" checked={d.feeAcknowledged}
            onChange={ev => up("feeAcknowledged", ev.target.checked)}
            style={{ marginTop: "2px" }}
          />
          <span>
            I acknowledge the <strong>$70.00 Florida filing fee</strong> has been charged to my simulation account.
            <HelpTip helpText="The real Florida filing fee for Articles of Incorporation is $70. This acknowledgment makes the simulation feel authentic. No actual money is charged." label="Fee Acknowledgment" />
          </span>
        </label>
        <Err msg={e.feeAcknowledged} />
      </div>

      {/* Review summary */}
      <div style={sSection}>Review Your Filing</div>
      <table cellPadding={4} cellSpacing={0} style={{ width: "100%", border: "1px solid #999", backgroundColor: WHITE, fontFamily: "Arial", fontSize: "11px" }}>
        <tbody>
          <tr><td style={{ fontWeight: "bold", width: "180px", color: NAVY }}>Corporate Name</td><td>{d.name || "—"}</td></tr>
          <tr style={{ backgroundColor: "#f8f8f8" }}><td style={{ fontWeight: "bold", color: NAVY }}>Authorized Shares</td><td>{d.sharesAuthorized ? `${d.sharesAuthorized} ${d.shareClassName || "Common"} shares` : "—"}{d.parValueDollars && d.parValueDollars !== "0" ? ` @ $${d.parValueDollars} par` : " (no par value)"}</td></tr>
          <tr><td style={{ fontWeight: "bold", color: NAVY }}>Principal Address</td><td>{[d.principalStreet, d.principalCity, d.principalState, d.principalZip].filter(Boolean).join(", ") || "—"}</td></tr>
          <tr style={{ backgroundColor: "#f8f8f8" }}><td style={{ fontWeight: "bold", color: NAVY }}>Registered Agent</td><td>{d.raName || "—"}{d.raStreet ? ` — ${[d.raStreet, d.raCity, d.raState, d.raZip].filter(Boolean).join(", ")}` : ""}</td></tr>
          <tr><td style={{ fontWeight: "bold", color: NAVY }}>Directors</td><td>{directors.filter(r => r.name.trim()).map(r => r.name).join("; ") || "—"}</td></tr>
          <tr style={{ backgroundColor: "#f8f8f8" }}><td style={{ fontWeight: "bold", color: NAVY }}>Officers</td><td>{officers.filter(r => r.name.trim()).map(r => `${r.name}${r.title ? ` (${r.title})` : ""}`).join("; ") || "—"}</td></tr>
          <tr><td style={{ fontWeight: "bold", color: NAVY }}>Incorporator</td><td>{d.incorporatorName || "—"}</td></tr>
          <tr style={{ backgroundColor: "#f8f8f8" }}><td style={{ fontWeight: "bold", color: NAVY }}>Effective Date</td><td>{d.effectiveDate || "Immediate upon filing"}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function ProfitCorpWizard() {
  const router = useRouter();

  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1);
  const [data, setData]           = useState<WizardData>(INITIAL_DATA);
  const [directors, setDirectors] = useState<DirectorRow[]>([EMPTY_DIRECTOR()]);
  const [officers, setOfficers]   = useState<OfficerRow[]>([EMPTY_OFFICER()]);
  const [errors, setErrors]       = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  function next() {
    const e = validateStep(step, data, directors, officers);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step < 4) setStep((step + 1) as 1 | 2 | 3 | 4);
  }

  function back() {
    setErrors({});
    if (step > 1) setStep((step - 1) as 1 | 2 | 3 | 4);
  }

  function handleSubmit() {
    const e = validateStep(4, data, directors, officers);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSubmitError(null);

    startTransition(async () => {
      const fd = new FormData();
      // WizardData fields
      (Object.keys(data) as Array<keyof WizardData>).forEach(key => {
        const v = data[key];
        fd.set(key, typeof v === "boolean" ? (v ? "true" : "false") : String(v));
      });
      // Dynamic rows as JSON
      fd.set("directors", JSON.stringify(directors));
      fd.set("officers",  JSON.stringify(officers));

      const result = await submitProfitCorp(null, fd);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      if (result.fieldErrors) {
        setErrors(result.fieldErrors as Errors);
        if (result.returnToStep) setStep(result.returnToStep);
        return;
      }
      if (result.ok) {
        router.push("/starbiz");
      }
    });
  }

  const stepLabels = ["Identity & Stock", "Addresses", "Registered Agent", "Directors & Review"];

  return (
    <div>
      {/* "Work not saved" notice */}
      <div style={{ backgroundColor: "#FFF8DC", border: "1px solid #cc9900", padding: "5px 10px", fontFamily: "Arial", fontSize: "11px", marginBottom: "10px", color: "#5a4000" }}>
        ⚠ Your work is not saved between sessions. Complete the filing in one sitting.
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 0, marginBottom: "12px", border: "1px solid #999" }}>
        {stepLabels.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const active = n === step, done = n < step;
          return (
            <div
              key={label}
              style={{
                flex: 1, padding: "5px 8px", textAlign: "center",
                fontFamily: "Arial", fontSize: "11px", fontWeight: active ? "bold" : "normal",
                backgroundColor: active ? NAVY : done ? "#668" : "#DDD",
                color: (active || done) ? WHITE : "#333",
                borderRight: i < 3 ? "1px solid #999" : undefined,
              }}
            >
              Step {n}: {label}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {step === 1 && <Step1 d={data} up={update} e={errors} />}
      {step === 2 && <Step2 d={data} up={update} e={errors} />}
      {step === 3 && <Step3 d={data} up={update} e={errors} />}
      {step === 4 && (
        <Step4
          d={data} up={update}
          directors={directors} setDirectors={setDirectors}
          officers={officers}   setOfficers={setOfficers}
          e={errors}
        />
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: "8px", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #ccc", alignItems: "center" }}>
        {step > 1 && (
          <button
            type="button" onClick={back} disabled={isPending}
            style={{ backgroundColor: "#666", color: WHITE, border: "none", fontFamily: "Arial", fontSize: "12px", padding: "5px 16px", cursor: "pointer" }}
          >
            ← Back
          </button>
        )}
        {step < 4 && (
          <button
            type="button" onClick={next}
            style={{ backgroundColor: NAVY, color: WHITE, border: "none", fontFamily: "Arial", fontSize: "12px", fontWeight: "bold", padding: "5px 20px", cursor: "pointer" }}
          >
            Next Step →
          </button>
        )}
        {step === 4 && (
          <button
            type="button" onClick={handleSubmit} disabled={isPending}
            style={{ backgroundColor: isPending ? "#555" : NAVY, color: WHITE, border: "none", fontFamily: "Arial", fontSize: "12px", fontWeight: "bold", padding: "5px 20px", cursor: isPending ? "not-allowed" : "pointer" }}
          >
            {isPending ? "Filing…" : "File Articles of Incorporation — $70.00"}
          </button>
        )}
        {isPending && (
          <span style={{ fontFamily: "Arial", fontSize: "11px", color: "#555" }}>
            Processing your filing…
          </span>
        )}
      </div>

      {submitError && (
        <div style={{ marginTop: "8px", color: RED, fontFamily: "Arial", fontSize: "12px", border: "1px solid #cc0000", padding: "5px 8px", backgroundColor: "#fff0f0" }}>
          {submitError}
        </div>
      )}
    </div>
  );
}
