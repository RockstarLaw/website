"use client";

import { useState } from "react";

import { HelpTip } from "@/components/assisted-mode/HelpTip";

// ─── Types ────────────────────────────────────────────────────────────────────

type PersonRow = {
  name: string;
  title: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  ownershipPct: string; // string for input; empty = not applicable
};

type WizardData = {
  // Step 1
  name: string;
  managementStructure: "member-managed" | "manager-managed" | "";
  purpose: string;
  effectiveDate: string;
  // Step 2
  principalStreet: string;
  principalCity: string;
  principalState: string;
  principalZip: string;
  mailingIsSame: boolean;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  // Step 3
  raName: string;
  raStreet: string;
  raCity: string;
  raState: string;
  raZip: string;
  raEmail: string;
  raAccepted: boolean;
  // Step 4
  organizerName: string;
  organizerStreet: string;
  organizerCity: string;
  organizerState: string;
  organizerZip: string;
  feiEin: string;
  feeAcknowledged: boolean;
};

const INITIAL_DATA: WizardData = {
  name: "", managementStructure: "", purpose: "", effectiveDate: "",
  principalStreet: "", principalCity: "", principalState: "", principalZip: "",
  mailingIsSame: true,
  mailingStreet: "", mailingCity: "", mailingState: "", mailingZip: "",
  raName: "", raStreet: "", raCity: "", raState: "FL", raZip: "", raEmail: "", raAccepted: false,
  organizerName: "", organizerStreet: "", organizerCity: "", organizerState: "", organizerZip: "",
  feiEin: "", feeAcknowledged: false,
};

const EMPTY_PERSON = (): PersonRow => ({ name: "", title: "", street: "", city: "", state: "", zip: "", ownershipPct: "" });

// ─── Style constants ───────────────────────────────────────────────────────────

const NAVY   = "#003366";
const MAROON = "#800000";
const WHITE  = "#FFFFFF";
const RED    = "#cc0000";

const sInput: React.CSSProperties = {
  border: "1px solid #666", fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px", padding: "2px 4px",
};
const sLabel: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px",
  fontWeight: "bold", whiteSpace: "nowrap",
};
const sSection: React.CSSProperties = {
  backgroundColor: NAVY, color: WHITE,
  fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px",
  fontWeight: "bold", padding: "3px 8px", marginTop: "10px", marginBottom: "6px",
};
const sError: React.CSSProperties = {
  color: RED, fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif",
  display: "block", marginTop: "2px",
};
const sTd: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px",
  padding: "3px 6px", verticalAlign: "top",
};

type Errors = Partial<Record<string, string>>;

// ─── Validation ───────────────────────────────────────────────────────────────

function hasLLCSuffix(n: string): boolean {
  return /\b(llc|l\.l\.c\.|limited liability company)\b/i.test(n);
}

function validZip(z: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(z.trim());
}

function validateStep(step: number, d: WizardData, persons: PersonRow[]): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!d.name.trim()) e.name = "LLC name is required.";
    else if (!hasLLCSuffix(d.name)) e.name = "Name must include 'LLC', 'L.L.C.', or 'Limited Liability Company'.";
    if (!d.managementStructure) e.managementStructure = "Select a management structure.";
    if (d.effectiveDate) {
      const today = new Date(); today.setHours(0,0,0,0);
      const chosen = new Date(d.effectiveDate + "T00:00:00");
      const ninetyDays = new Date(today); ninetyDays.setDate(ninetyDays.getDate() + 90);
      if (chosen < today) e.effectiveDate = "Effective date must be today or a future date.";
      if (chosen > ninetyDays) e.effectiveDate = "Effective date may not be more than 90 days in the future.";
    }
  }
  if (step === 2) {
    if (!d.principalStreet.trim()) e.principalStreet = "Street address is required.";
    if (!d.principalCity.trim()) e.principalCity = "City is required.";
    if (!d.principalState.trim()) e.principalState = "State is required.";
    if (!d.principalZip.trim()) e.principalZip = "ZIP code is required.";
    else if (!validZip(d.principalZip)) e.principalZip = "Enter a valid ZIP code (12345 or 12345-6789).";
    if (!d.mailingIsSame) {
      if (!d.mailingStreet.trim()) e.mailingStreet = "Mailing street is required.";
      if (!d.mailingCity.trim()) e.mailingCity = "Mailing city is required.";
      if (!d.mailingState.trim()) e.mailingState = "Mailing state is required.";
      if (!d.mailingZip.trim()) e.mailingZip = "Mailing ZIP is required.";
      else if (!validZip(d.mailingZip)) e.mailingZip = "Enter a valid ZIP code.";
    }
  }
  if (step === 3) {
    if (!d.raName.trim()) e.raName = "Registered agent name is required.";
    if (!d.raStreet.trim()) e.raStreet = "Street address is required.";
    if (!d.raCity.trim()) e.raCity = "City is required.";
    if (d.raState.trim().toUpperCase() !== "FL") e.raState = "Registered agent address must be in Florida (FL).";
    if (!d.raZip.trim()) e.raZip = "ZIP code is required.";
    else if (!validZip(d.raZip)) e.raZip = "Enter a valid Florida ZIP code.";
    if (!d.raAccepted) e.raAccepted = "Registered agent must accept the appointment.";
  }
  if (step === 4) {
    const first = persons[0];
    if (!first?.name.trim()) e["person_0_name"] = "At least one member or manager is required.";
    persons.forEach((p, i) => {
      if (p.name.trim() && !p.street.trim()) e[`person_${i}_street`] = "Address is required for named persons.";
      if (p.name.trim() && !p.city.trim()) e[`person_${i}_city`] = "City is required.";
      if (p.name.trim() && !p.state.trim()) e[`person_${i}_state`] = "State is required.";
      if (p.name.trim() && !p.zip.trim()) e[`person_${i}_zip`] = "ZIP is required.";
    });
    if (!d.organizerName.trim()) e.organizerName = "Organizer name is required.";
    if (!d.organizerStreet.trim()) e.organizerStreet = "Organizer street address is required.";
    if (!d.organizerCity.trim()) e.organizerCity = "Organizer city is required.";
    if (!d.organizerState.trim()) e.organizerState = "Organizer state is required.";
    if (!d.organizerZip.trim()) e.organizerZip = "Organizer ZIP is required.";
    if (!d.feeAcknowledged) e.feeAcknowledged = "You must acknowledge the filing fee to proceed.";
  }
  return e;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span style={sError}>{msg}</span>;
}

function Field({ label, help, children, error }: {
  label: string; help?: string; children: React.ReactNode; error?: string;
}) {
  return (
    <tr>
      <td style={{ ...sTd, width: "200px" }}>
        <span style={sLabel}>{label}</span>
        {help && <HelpTip helpText={help} label={label} />}
      </td>
      <td style={sTd}>
        {children}
        <Err msg={error} />
      </td>
    </tr>
  );
}

// ─── Step 1 — LLC Identity ────────────────────────────────────────────────────

function Step1({ d, up, e }: { d: WizardData; up: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void; e: Errors }) {
  return (
    <div>
      <div style={sSection}>Article I — LLC Identity</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
        <tbody>
          <Field
            label="LLC Name *"
            help="Your LLC must include 'LLC', 'L.L.C.', or 'Limited Liability Company' in its name. Name conflict checking is not simulated — any name is accepted."
            error={e.name}
          >
            <input
              type="text"
              value={d.name}
              onChange={ev => up("name", ev.target.value)}
              style={{ ...sInput, width: "320px" }}
              maxLength={120}
              placeholder="e.g. Sunshine Legal Services, LLC"
              autoFocus
            />
            <span style={{ fontFamily: "Arial", fontSize: "10px", color: "#666", marginLeft: "6px" }}>
              (must include LLC, L.L.C., or Limited Liability Company)
            </span>
          </Field>

          <Field
            label="Management Structure *"
            help="Member-Managed: all members share day-to-day operations. Manager-Managed: one or more designated managers run the LLC; members are passive investors. Most small LLCs use member-managed."
            error={e.managementStructure}
          >
            <label style={sLabel}>
              <input type="radio" name="mgmt" value="member-managed"
                checked={d.managementStructure === "member-managed"}
                onChange={() => up("managementStructure", "member-managed")} />
              {" "}Member-Managed
            </label>
            &nbsp;&nbsp;&nbsp;
            <label style={sLabel}>
              <input type="radio" name="mgmt" value="manager-managed"
                checked={d.managementStructure === "manager-managed"}
                onChange={() => up("managementStructure", "manager-managed")} />
              {" "}Manager-Managed
            </label>
          </Field>

          <Field
            label="Purpose"
            help="Optional in Florida. 'Any lawful purpose' is the standard entry for most LLCs. Only specify a purpose if your LLC is chartered for something specific."
            error={e.purpose}
          >
            <input
              type="text"
              value={d.purpose}
              onChange={ev => up("purpose", ev.target.value)}
              style={{ ...sInput, width: "320px" }}
              maxLength={500}
              placeholder="any lawful purpose"
            />
          </Field>

          <Field
            label="Effective Date"
            help="Leave blank for the LLC to become effective immediately upon filing. Choose a future date (up to 90 days) if you need to delay activation. The entity will appear in search results immediately regardless."
            error={e.effectiveDate}
          >
            <input
              type="date"
              value={d.effectiveDate}
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

function Step2({ d, up, e }: { d: WizardData; up: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void; e: Errors }) {
  return (
    <div>
      <div style={sSection}>Article II — Principal Office</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
        <tbody>
          <Field label="Street Address *" help="The primary business address. May be outside Florida. P.O. Boxes are not accepted." error={e.principalStreet}>
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
                <input type="checkbox" checked={d.mailingIsSame} onChange={ev => up("mailingIsSame", ev.target.checked)} />
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

function Step3({ d, up, e }: { d: WizardData; up: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void; e: Errors }) {
  return (
    <div>
      <div style={sSection}>Article III — Registered Agent</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
        <tbody>
          <Field label="RA Name *" help="The registered agent receives legal documents and official state correspondence on behalf of your LLC. Must be a Florida resident or a Florida-registered entity." error={e.raName}>
            <input type="text" value={d.raName} onChange={ev => up("raName", ev.target.value)} style={{ ...sInput, width: "280px" }} autoFocus />
          </Field>
          <Field label="RA Street Address *" help="Must be a physical Florida address. P.O. Boxes are not accepted. This address is publicly searchable." error={e.raStreet}>
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
                  type="checkbox"
                  checked={d.raAccepted}
                  onChange={ev => up("raAccepted", ev.target.checked)}
                  style={{ marginTop: "2px" }}
                />
                <span>
                  I hereby agree to act as registered agent for the above-named LLC and am familiar with and accept the obligations of that position.
                  <HelpTip helpText="The registered agent must accept the responsibility before being named. In a real filing, the RA would sign separately. Check this box to simulate their acceptance." label="RA Acceptance" />
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

// ─── Step 4 — Members / Managers + Review ────────────────────────────────────

function Step4({
  d, up, persons, setPersons, e,
}: {
  d: WizardData;
  up: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void;
  persons: PersonRow[];
  setPersons: React.Dispatch<React.SetStateAction<PersonRow[]>>;
  e: Errors;
}) {
  const isMemberManaged = d.managementStructure === "member-managed";
  const personLabel     = isMemberManaged ? "Authorized Members" : "Managers";

  // Ownership percent sum for soft warning
  const pctSum = persons.reduce((acc, p) => {
    const v = parseFloat(p.ownershipPct);
    return acc + (isNaN(v) ? 0 : v);
  }, 0);

  function updatePerson(i: number, key: keyof PersonRow, value: string) {
    setPersons(prev => prev.map((p, idx) => idx === i ? { ...p, [key]: value } : p));
  }

  return (
    <div>
      {/* Members / Managers */}
      <div style={sSection}>{personLabel}</div>
      <Err msg={e["person_0_name"]} />

      {persons.map((p, i) => (
        <div key={i} style={{ border: "1px solid #999", padding: "8px", marginBottom: "6px", backgroundColor: i % 2 === 1 ? "#FFFF99" : WHITE }}>
          <div style={{ fontFamily: "Arial", fontSize: "11px", fontWeight: "bold", marginBottom: "4px", color: NAVY }}>
            {personLabel.replace(/s$/, "")} {i + 1}
            {persons.length > 1 && (
              <button type="button" onClick={() => setPersons(prev => prev.filter((_, idx) => idx !== i))}
                style={{ marginLeft: "12px", fontSize: "10px", color: MAROON, border: "1px solid #999", background: WHITE, cursor: "pointer", padding: "1px 6px" }}>
                Remove
              </button>
            )}
          </div>
          <table cellPadding={0} cellSpacing={0}>
            <tbody>
              <tr>
                <td style={sTd}>
                  <span style={sLabel}>
                    Name *
                    {i === 0 && <HelpTip helpText="List the full legal name. For member-managed LLCs, list every owner. For manager-managed, list only the managers." label={`${personLabel.replace(/s$/, "")} Name`} />}
                  </span>
                  <br />
                  <input type="text" value={p.name} onChange={ev => updatePerson(i, "name", ev.target.value)} style={{ ...sInput, width: "200px" }} />
                  <Err msg={e[`person_${i}_name`]} />
                </td>
                <td style={sTd}>
                  <span style={sLabel}>Title</span><br />
                  <input type="text" value={p.title} onChange={ev => updatePerson(i, "title", ev.target.value)} style={{ ...sInput, width: "120px" }} placeholder="MGR / MGRM" />
                </td>
                {isMemberManaged && (
                  <td style={sTd}>
                    <span style={sLabel}>
                      Ownership %
                      {i === 0 && <HelpTip helpText="Your ownership share. All members' percentages can add up to less than 100% (reserved interests are normal). A warning appears if the total exceeds 100%." label="Ownership Percentage" />}
                    </span><br />
                    <input type="number" step="0.01" min="0" max="100" value={p.ownershipPct}
                      onChange={ev => updatePerson(i, "ownershipPct", ev.target.value)}
                      style={{ ...sInput, width: "70px" }} placeholder="0.00" />
                    {" "}%
                  </td>
                )}
              </tr>
              <tr>
                <td style={sTd} colSpan={3}>
                  <span style={sLabel}>Address *</span>
                  <span style={{ marginLeft: "8px" }}>
                    <input type="text" value={p.street} onChange={ev => updatePerson(i, "street", ev.target.value)} style={{ ...sInput, width: "180px" }} placeholder="Street" />
                    {" "}
                    <input type="text" value={p.city} onChange={ev => updatePerson(i, "city", ev.target.value)} style={{ ...sInput, width: "120px" }} placeholder="City" />
                    {" "}
                    <input type="text" value={p.state} onChange={ev => updatePerson(i, "state", ev.target.value.toUpperCase())} style={{ ...sInput, width: "30px" }} maxLength={2} placeholder="ST" />
                    {" "}
                    <input type="text" value={p.zip} onChange={ev => updatePerson(i, "zip", ev.target.value)} style={{ ...sInput, width: "80px" }} placeholder="ZIP" />
                  </span>
                  <Err msg={e[`person_${i}_street`] || e[`person_${i}_city`] || e[`person_${i}_state`] || e[`person_${i}_zip`]} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      {isMemberManaged && pctSum > 100 && (
        <p style={{ fontFamily: "Arial", fontSize: "11px", color: "#cc6600", border: "1px solid #cc6600", padding: "3px 8px", backgroundColor: "#FFFAED" }}>
          ⚠ Total ownership percentage exceeds 100% ({pctSum.toFixed(2)}%). This will be flagged in the filing record.
        </p>
      )}

      {persons.length < 10 && (
        <button type="button" onClick={() => setPersons(prev => [...prev, EMPTY_PERSON()])}
          style={{ backgroundColor: "#555", color: WHITE, border: "none", fontFamily: "Arial", fontSize: "11px", padding: "3px 10px", cursor: "pointer", marginBottom: "10px" }}>
          + Add {personLabel.replace(/s$/, "")}
        </button>
      )}

      {/* Organizer */}
      <div style={sSection}>Organizer (Filer of Record)</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
        <tbody>
          <Field label="Organizer Name *" help="The person submitting this filing. The organizer doesn't have to be a member or manager — they're just the filer of record." error={e.organizerName}>
            <input type="text" value={d.organizerName} onChange={ev => up("organizerName", ev.target.value)} style={{ ...sInput, width: "240px" }} />
          </Field>
          <tr>
            <td style={sTd}><span style={sLabel}>Organizer Address *</span></td>
            <td style={sTd}>
              <input type="text" value={d.organizerStreet} onChange={ev => up("organizerStreet", ev.target.value)} style={{ ...sInput, width: "180px" }} placeholder="Street" />
              {" "}<input type="text" value={d.organizerCity} onChange={ev => up("organizerCity", ev.target.value)} style={{ ...sInput, width: "120px" }} placeholder="City" />
              {" "}<input type="text" value={d.organizerState} onChange={ev => up("organizerState", ev.target.value.toUpperCase())} style={{ ...sInput, width: "30px" }} maxLength={2} placeholder="ST" />
              {" "}<input type="text" value={d.organizerZip} onChange={ev => up("organizerZip", ev.target.value)} style={{ ...sInput, width: "80px" }} placeholder="ZIP" />
              <Err msg={e.organizerStreet || e.organizerCity || e.organizerState || e.organizerZip} />
            </td>
          </tr>
          <Field label="FEI / EIN"
            help="Optional at formation. Obtain your EIN from the IRS after the LLC is formed. You can add it via amendment."
            error={e.feiEin}>
            <input type="text" value={d.feiEin} onChange={ev => up("feiEin", ev.target.value)} style={{ ...sInput, width: "120px" }} placeholder="XX-XXXXXXX" />
            <span style={{ fontFamily: "Arial", fontSize: "10px", color: "#666", marginLeft: "8px" }}>optional — obtain from IRS after filing</span>
          </Field>
        </tbody>
      </table>

      {/* Fee acknowledgment */}
      <div style={sSection}>Filing Fee Acknowledgment</div>
      <div style={{ padding: "8px", border: "1px solid #999", backgroundColor: "#FFFFF0" }}>
        <label style={{ ...sLabel, fontWeight: "normal", display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <input type="checkbox" checked={d.feeAcknowledged} onChange={ev => up("feeAcknowledged", ev.target.checked)} style={{ marginTop: "2px" }} />
          <span>
            I acknowledge the <strong>$125.00 Florida filing fee</strong> has been charged to my simulation account.
            <HelpTip helpText="The real Florida filing fee is $125. This acknowledgment makes the simulation feel authentic. No actual money is charged." label="Fee Acknowledgment" />
          </span>
        </label>
        <Err msg={e.feeAcknowledged} />
      </div>

      {/* Review summary */}
      <div style={sSection}>Review Your Filing</div>
      <table cellPadding={4} cellSpacing={0} style={{ width: "100%", border: "1px solid #999", backgroundColor: WHITE, fontFamily: "Arial", fontSize: "11px" }}>
        <tbody>
          <tr><td style={{ fontWeight: "bold", width: "180px", color: NAVY }}>LLC Name</td><td>{d.name || "—"}</td></tr>
          <tr style={{ backgroundColor: "#f8f8f8" }}><td style={{ fontWeight: "bold", color: NAVY }}>Management</td><td>{d.managementStructure || "—"}</td></tr>
          <tr><td style={{ fontWeight: "bold", color: NAVY }}>Principal Address</td><td>{[d.principalStreet, d.principalCity, d.principalState, d.principalZip].filter(Boolean).join(", ") || "—"}</td></tr>
          <tr style={{ backgroundColor: "#f8f8f8" }}><td style={{ fontWeight: "bold", color: NAVY }}>Registered Agent</td><td>{d.raName || "—"} — {[d.raStreet, d.raCity, d.raState, d.raZip].filter(Boolean).join(", ")}</td></tr>
          <tr><td style={{ fontWeight: "bold", color: NAVY }}>Persons</td><td>{persons.filter(p => p.name.trim()).map(p => p.name).join("; ") || "—"}</td></tr>
          <tr style={{ backgroundColor: "#f8f8f8" }}><td style={{ fontWeight: "bold", color: NAVY }}>Organizer</td><td>{d.organizerName || "—"}</td></tr>
          <tr><td style={{ fontWeight: "bold", color: NAVY }}>Effective Date</td><td>{d.effectiveDate || "Immediate upon filing"}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function LLCWizard() {
  const [step, setStep]     = useState<1 | 2 | 3 | 4>(1);
  const [data, setData]     = useState<WizardData>(INITIAL_DATA);
  const [persons, setPersons] = useState<PersonRow[]>([EMPTY_PERSON()]);
  const [errors, setErrors] = useState<Errors>({});
  const [placeholderMsg, setPlaceholderMsg] = useState(false);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  function next() {
    const e = validateStep(step, data, persons);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step < 4) setStep((step + 1) as 1 | 2 | 3 | 4);
  }

  function back() {
    setErrors({});
    if (step > 1) setStep((step - 1) as 1 | 2 | 3 | 4);
  }

  const stepLabels = ["LLC Identity", "Addresses", "Registered Agent", "Members & Review"];

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
          const active = n === step;
          const done   = n < step;
          return (
            <div key={label} style={{
              flex: 1, padding: "5px 8px", textAlign: "center",
              fontFamily: "Arial", fontSize: "11px", fontWeight: active ? "bold" : "normal",
              backgroundColor: active ? NAVY : done ? "#668" : "#DDD",
              color: (active || done) ? WHITE : "#333",
              borderRight: i < 3 ? "1px solid #999" : undefined,
            }}>
              Step {n}: {label}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {step === 1 && <Step1 d={data} up={update} e={errors} />}
      {step === 2 && <Step2 d={data} up={update} e={errors} />}
      {step === 3 && <Step3 d={data} up={update} e={errors} />}
      {step === 4 && <Step4 d={data} up={update} persons={persons} setPersons={setPersons} e={errors} />}

      {/* Navigation */}
      <div style={{ display: "flex", gap: "8px", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #ccc" }}>
        {step > 1 && (
          <button type="button" onClick={back} style={{
            backgroundColor: "#666", color: WHITE, border: "none",
            fontFamily: "Arial", fontSize: "12px", padding: "5px 16px", cursor: "pointer",
          }}>
            ← Back
          </button>
        )}

        {step < 4 && (
          <button type="button" onClick={next} style={{
            backgroundColor: NAVY, color: WHITE, border: "none",
            fontFamily: "Arial", fontSize: "12px", fontWeight: "bold", padding: "5px 20px", cursor: "pointer",
          }}>
            Next Step →
          </button>
        )}

        {step === 4 && (
          <>
            <button
              type="button"
              onClick={next}
              style={{ backgroundColor: NAVY, color: WHITE, border: "none", fontFamily: "Arial", fontSize: "12px", fontWeight: "bold", padding: "5px 20px", cursor: "pointer", opacity: 0.5 }}
              title="Filing not yet wired — Phase 2.2 will enable this"
              disabled
            >
              File Articles of Organization — $125.00
            </button>
            <button
              type="button"
              onClick={() => {
                const e = validateStep(4, data, persons);
                if (Object.keys(e).length) { setErrors(e); return; }
                setPlaceholderMsg(true);
              }}
              style={{ backgroundColor: "#cc9900", color: WHITE, border: "none", fontFamily: "Arial", fontSize: "11px", padding: "5px 14px", cursor: "pointer" }}
            >
              Test form validation
            </button>
          </>
        )}
      </div>

      {placeholderMsg && (
        <div style={{ marginTop: "10px", backgroundColor: "#FFF8DC", border: "1px solid #cc9900", padding: "8px 12px", fontFamily: "Arial", fontSize: "12px", color: "#5a4000" }}>
          ✓ Form validation passed. <strong>Filing not yet wired</strong> — Phase 2.2 will connect the submit action to the database.
        </div>
      )}
    </div>
  );
}
