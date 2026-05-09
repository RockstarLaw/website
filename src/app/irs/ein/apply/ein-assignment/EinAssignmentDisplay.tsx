"use client";

/**
 * EinAssignmentDisplay — IRS EIN Wizard Step 7 (Slice 9)
 *
 * Portals into #w7-form-portal inside wizard-step-7.html.
 *
 * ── Page structure (verbatim from $7() / k7 in index-ChwXuGQH.js) ────────────
 *
 * 1. alertNotification — success banner
 *    "Congratulations! Your EIN has been successfully assigned."
 *    + sub-text: "Save and/or print this page and the confirmation letter
 *                 below for your permanent records."
 * 2. einDetailsHeader  — "Your EIN" heading
 * 3. einDetails table  — "Your EIN Details" subheader + 4 rows:
 *      EIN assigned | Legal name | Name control | Confirmation letter
 * 4. confirmationLetterNote — digital or mail variant depending on letterPref
 * 5. CP575G download section — placeholder until Slice 10
 * 6. instructionAccordion   — "Additional Information about your EIN"
 *    Sections: "When can you use your EIN?" | "Next Steps" | "Need to make a correction?"
 * 7. Button row:
 *      [Print Page (inverted)] [Help with saving and printing your letter]
 *      [Download EIN confirmation Letter [PDF] (placeholder)]
 *      [Exit Application] [Apply for another EIN]
 *
 * ── Content sources (HR#1) ───────────────────────────────────────────────────
 *
 * All text labels verbatim from:
 *   irs-captures/json/ein__einAssignment.json
 *
 * Rendering logic (field order, conditional note, accordion structure):
 *   irs-captures/js/index-ChwXuGQH.js → $7() component + D() / F() / Y()
 *   functions decoded from the post-submit state machine.
 *
 * Accordion text verbatim from ein__einAssignment.json →
 *   instructionAccordion.sections[*].additionalText
 *   instructionAccordion.sectionsUnique[*].additionalText
 *
 * ── Third-party designee scope ───────────────────────────────────────────────
 * The real wizard supports a third-party designee path (thirdPartyDesignee keys
 * in the JSON). RockStar IRS does not expose a TPD flow in Phase 1.
 * All rendering uses the responsibleParty variants exclusively.
 *
 * ── Phone substitution (§4) ──────────────────────────────────────────────────
 * The W7 chrome contains no IRS phone numbers — accordion content only has
 * IRS.gov URLs. No substitution needed here. CP575G PDF (Slice 10) handles
 * any phone numbers appearing in the letter.
 *
 * ── Out of scope ─────────────────────────────────────────────────────────────
 * CP575G PDF generator — Slice 10. Download button is a placeholder.
 * Letter 147C / third-party designee path — Phase 4+.
 *
 * ── Inherited accepted deviations ────────────────────────────────────────────
 * FA magnifying-glass icon (shared chrome, accepted 2026-05-08).
 */

import { useEffect, useState } from "react";
import { createPortal }        from "react-dom";
import { useRouter }           from "next/navigation";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface EinAssignmentDisplayProps {
  ein:        string;          // e.g. "99-1234567"
  legalName:  string;          // from form_data.legalName
  nameControl: string;         // derived from legalName (first 4 letters)
  letterPref: "DIGITAL" | "MAIL";
}

// ── Accordion section (local state) ──────────────────────────────────────────

function AccordionSection({
  id,
  title,
  children,
}: {
  id:       string;
  title:    string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="accordion-item" id={id}>
      <button
        type="button"
        className="accordion-button"
        aria-expanded={open}
        aria-controls={`${id}-content`}
        onClick={() => setOpen((v) => !v)}
        style={{
          display:         "flex",
          justifyContent:  "space-between",
          alignItems:      "center",
          width:           "100%",
          padding:         "14px 16px",
          background:      "none",
          border:          "none",
          borderBottom:    "1px solid #d6d7d9",
          cursor:          "pointer",
          fontSize:        "1rem",
          fontWeight:      600,
          textAlign:       "left",
          color:           "#1b1b1b",
        }}
      >
        {title}
        <span aria-hidden="true" style={{ fontSize: "0.8rem", marginLeft: "8px" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div
          id={`${id}-content`}
          className="accordion-content"
          style={{ padding: "16px" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EinAssignmentDisplay({
  ein,
  legalName,
  nameControl,
  letterPref,
}: EinAssignmentDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const portal = document.getElementById("w7-form-portal");
  if (!portal) return null;

  // ── Confirmation letter row value ─────────────────────────────────────────
  // Verbatim from ein__einAssignment.json → einDetails.responsibleParty.details.fields[3]
  // "Confirmation letter" field shows delivery mode label.
  const confirmationLetterValue =
    letterPref === "DIGITAL"
      ? "Digital - Confirmation Letter displayed below"
      : "Mail - Allow up to 4 weeks for delivery";

  // ── Confirmation letter note (digital vs mail variant) ────────────────────
  // Source: ein__einAssignment.json → confirmationLetterNoteDigital / confirmationLetterNoteMail
  const confirmationLetterNote =
    letterPref === "DIGITAL"
      ? "This confirmation letter is your official IRS notice and contains important information regarding your EIN:"
      : "Your confirmation letter will be mailed to you. This letter will be your official IRS notice and will contain important information regarding your EIN. Allow up to 4 weeks for your letter to arrive by mail.";

  return createPortal(
    <>
      {/* ── 1. Success alert banner (alertNotification) ───────────────────── */}
      {/* Source: ein__einAssignment.json → alertNotification */}
      <div
        role="status"
        aria-live="polite"
        className="section-alert section-alert--green"
        style={{
          display:       "flex",
          alignItems:    "flex-start",
          gap:           "12px",
          background:    "#ecf3ec",
          border:        "2px solid #2e8540",
          borderRadius:  "4px",
          padding:       "16px",
          marginBottom:  "24px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            minWidth:    "24px",
            height:      "24px",
            background:  "#2e8540",
            borderRadius:"50%",
            display:     "flex",
            alignItems:  "center",
            justifyContent: "center",
            color:       "#fff",
            fontWeight:  700,
            fontSize:    "14px",
            marginTop:   "2px",
          }}
        >
          ✓
        </div>
        <div>
          {/* Verbatim: alertNotification.title */}
          <strong style={{ display: "block", fontSize: "1.1rem", marginBottom: "4px" }}>
            Congratulations! Your EIN has been successfully assigned.
          </strong>
          {/* Verbatim: alertNotification.additionalText[0] */}
          <span>
            Save and/or print this page and the confirmation letter below for your permanent records.
          </span>
        </div>
      </div>

      {/* ── 2. EIN header (einDetailsHeader.responsibleParty.title) ─────────── */}
      {/* Source: ein__einAssignment.json → einDetailsHeader.responsibleParty.title */}
      <h2
        style={{
          fontSize:     "1.5rem",
          fontWeight:   700,
          marginBottom: "16px",
          color:        "#1b1b1b",
        }}
      >
        Your EIN
      </h2>

      {/* ── 3. EIN Details table ─────────────────────────────────────────────── */}
      {/* Source: ein__einAssignment.json → einDetails.responsibleParty.details */}
      <div
        style={{
          border:       "1px solid #d6d7d9",
          borderRadius: "4px",
          marginBottom: "24px",
        }}
      >
        {/* Verbatim subheader: einDetails.responsibleParty.details.subheader */}
        <div
          style={{
            background:   "#f0f0f0",
            padding:      "12px 16px",
            fontWeight:   700,
            fontSize:     "1rem",
            borderBottom: "1px solid #d6d7d9",
          }}
        >
          Your EIN Details
        </div>

        {/* Rows: verbatim field names from einDetails.responsibleParty.details.fields */}
        <table
          style={{
            width:          "100%",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            {/* Row 1: "EIN assigned" */}
            <tr style={{ borderBottom: "1px solid #d6d7d9" }}>
              <th
                scope="row"
                style={{
                  padding:    "12px 16px",
                  fontWeight: 600,
                  textAlign:  "left",
                  width:      "40%",
                  background: "#fafafa",
                }}
              >
                EIN assigned
              </th>
              <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: "1.1rem" }}>
                {ein}
              </td>
            </tr>
            {/* Row 2: "Legal name" */}
            <tr style={{ borderBottom: "1px solid #d6d7d9" }}>
              <th
                scope="row"
                style={{
                  padding:    "12px 16px",
                  fontWeight: 600,
                  textAlign:  "left",
                  background: "#fafafa",
                }}
              >
                Legal name
              </th>
              <td style={{ padding: "12px 16px" }}>{legalName}</td>
            </tr>
            {/* Row 3: "Name control" */}
            <tr style={{ borderBottom: "1px solid #d6d7d9" }}>
              <th
                scope="row"
                style={{
                  padding:    "12px 16px",
                  fontWeight: 600,
                  textAlign:  "left",
                  background: "#fafafa",
                }}
              >
                Name control
              </th>
              <td style={{ padding: "12px 16px" }}>{nameControl}</td>
            </tr>
            {/* Row 4: "Confirmation letter" — responsibleParty only (not TPD) */}
            <tr>
              <th
                scope="row"
                style={{
                  padding:    "12px 16px",
                  fontWeight: 600,
                  textAlign:  "left",
                  background: "#fafafa",
                }}
              >
                Confirmation letter
              </th>
              <td style={{ padding: "12px 16px" }}>{confirmationLetterValue}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 4. Confirmation letter note (digital vs mail variant) ─────────── */}
      {/* Source: ein__einAssignment.json → confirmationLetterNoteDigital /    */}
      {/*         confirmationLetterNoteMail.responsibleParty                  */}
      <p
        style={{
          marginBottom: "24px",
          color:        "#1b1b1b",
          lineHeight:   "1.5",
        }}
      >
        {confirmationLetterNote}
      </p>

      {/* ── 5. Download / print button row ───────────────────────────────── */}
      {/* Source: ein__einAssignment.json → buttonControls                    */}
      <div
        style={{
          display:       "flex",
          flexWrap:      "wrap",
          gap:           "12px",
          marginBottom:  "32px",
          alignItems:    "center",
        }}
      >
        {/* buttonControls[0]: "Print Page" (inverted: true) */}
        <button
          type="button"
          className="irs-button-v2 inverted"
          aria-label="Print Page"
          onClick={() => window.print()}
        >
          Print Page
        </button>

        {/* buttonControls[1]: "Help with saving and printing your letter" (external link) */}
        <a
          href="https://www.irs.gov/businesses/employer-identification-number"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="click for Help with saving and printing your letter. open in new window"
          className="link link--blue"
        >
          Help with saving and printing your letter
          {/* External icon per IRS chrome pattern */}
          <svg
            data-testid="external-icon"
            aria-hidden="true"
            className="external-icon"
            fill="currentColor"
            focusable="false"
            viewBox="0 0 512 512"
            height="14"
            width="14"
            style={{ marginLeft: "4px", verticalAlign: "middle" }}
          >
            <path d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z" />
          </svg>
        </a>

        {/* buttonControls[2]: "Download EIN confirmation Letter [PDF]" — PLACEHOLDER (Slice 10) */}
        <button
          type="button"
          className="irs-button-v2"
          aria-label="Download EIN confirmation Letter [PDF]"
          onClick={() => alert("PDF letter ships in Slice 10")}
        >
          Download EIN confirmation Letter [PDF]
        </button>
      </div>

      {/* ── 6. instructionAccordion ──────────────────────────────────────────── */}
      {/* Source: ein__einAssignment.json → instructionAccordion                */}
      <div
        id="einInfoAccordion"
        style={{
          border:       "1px solid #d6d7d9",
          borderRadius: "4px",
          marginBottom: "32px",
        }}
      >
        {/* Verbatim: instructionAccordion.title */}
        <div
          style={{
            background:   "#f0f0f0",
            padding:      "12px 16px",
            fontWeight:   700,
            borderBottom: "1px solid #d6d7d9",
          }}
        >
          Additional Information about your EIN
        </div>

        {/* Section 1: whenYouCanUseEin */}
        {/* Verbatim text: instructionAccordion.sections[0] */}
        <AccordionSection id="whenYouCanUseEin" title="When can you use your EIN?">
          <p>
            This EIN is your permanent number and can be used immediately for most of your business needs, including:
          </p>
          <ul style={{ marginLeft: "20px", marginBottom: "12px" }}>
            <li>Opening a bank account</li>
            <li>Applying for business licenses</li>
            <li>Filing a tax return by mail</li>
          </ul>
          <p>
            However, it will take up to two weeks before your EIN becomes part of the IRS&apos;s permanent records.
            You must wait until this occurs before you can:
          </p>
          <ul style={{ marginLeft: "20px" }}>
            <li>File an electronic return</li>
            <li>Make an electronic payment</li>
            <li>Pass an IRS Taxpayer Identification Number (TIN) matching program</li>
          </ul>
        </AccordionSection>

        {/* Section 2: nextStepsDefault */}
        {/* Verbatim text: instructionAccordion.sections[1] */}
        <AccordionSection id="nextStepsDefault" title="Next Steps">
          <p>
            You can download IRS forms, publications, and tax returns at{" "}
            <a
              href="https://www.irs.gov/formspubs"
              target="_blank"
              rel="noopener noreferrer"
              className="link link--blue"
            >
              https://www.irs.gov/formspubs
            </a>
          </p>
        </AccordionSection>

        {/* Section 3: needCorrections */}
        {/* Verbatim text: instructionAccordion.sections[2] */}
        <AccordionSection id="needCorrections" title="Need to make a correction?">
          <p>
            If you need to make changes to your organization&apos;s information, you must do so in writing and mail the
            information to the address provided at{" "}
            <a
              href="https://www.irs.gov/businesses/business-name-change"
              target="_blank"
              rel="noopener noreferrer"
              className="link link--blue"
            >
              https://www.irs.gov/businesses/business-name-change
            </a>
          </p>
        </AccordionSection>
      </div>

      {/* ── 7. Exit / Apply-Again navigation row ─────────────────────────── */}
      {/* Source: ein__einAssignment.json → buttonControls[3] + [4]           */}
      {/* Bundle: F() → "ThankYou" route; Y() → "ApplyForEin" route           */}
      <div
        style={{
          display:      "flex",
          flexWrap:     "wrap",
          gap:          "12px",
          marginBottom: "40px",
        }}
      >
        {/* buttonControls[3]: "Exit Application" (inverted: false) */}
        <button
          type="button"
          className="irs-button-v2"
          aria-label="Exit Application"
          onClick={() => router.push("/irs/ein")}
        >
          Exit Application
        </button>

        {/* buttonControls[4]: "Apply for another EIN" (inverted: false) */}
        <button
          type="button"
          className="irs-button-v2"
          aria-label="Apply for another EIN"
          onClick={() => router.push("/irs/ein/apply/legal-structure")}
        >
          Apply for another EIN
        </button>
      </div>
    </>,
    portal,
  );
}
