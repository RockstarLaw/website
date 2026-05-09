"use client";

/**
 * ReviewSubmitForm — IRS EIN Wizard Step 6 (Slice 8)
 *
 * Portals into #w6-form-portal inside wizard-step-6.html.
 *
 * ── Page structure (verbatim from E7() in index-ChwXuGQH.js) ─────────────────
 *
 * 1. reviewBeforeSubmittingAlert — blue info SectionAlert
 * 2. confirmationLetterInstructions h3 + confirmationLetterInputControl radio
 *    (DIGITAL | MAIL, with help tip text per additionalText)
 * 3. summaryInfoHeader h3 + summary table (OI section assembly order)
 * 4. instructions4 paragraph
 * 5. Back button + Submit EIN Request button + Cancel link
 * 6. Processing overlay while submit is in flight
 *
 * ── Summary table section order (OI component, verbatim) ─────────────────────
 *
 * 1. legalStructure     — Organization Type
 * 2. entityInformation  — {{tellUsAboutOrgLabel}} Information fields
 * 3. addressInformation — Addresses
 * 4. personOne          — {{firstPersonNameValue}} (Name, SSN/ITIN)
 *    personTwo          — second person section (Estate / Trust / Receivership)
 * 5. employeeInfo       — Employee Information (conditional on w2Issuer data)
 * 6. businessActivity   — Principal Business Activity (conditional on !hasDefaultPrincipalActivity)
 * 7. additionalInfo     — Additional {{tellUsAboutOrgLabel}} Information
 *
 * ── Back routing (E7() we() function, verbatim from bundle) ──────────────────
 *
 * hasDefaultPrincipalActivity(entityType)
 *   → /irs/ein/apply/additional-details
 * else
 *   → /irs/ein/apply/activity-and-services
 *
 * Entity types with default principal activity (DEFAULT_ACTIVITY_MAP in page.tsx):
 *   CHURCH, CHURCH_CONTROLLED_ORGANIZATION, HOUSEHOLD_EMPLOYER,
 *   EMPLOYER_OR_FISCAL_AGENT, POLITICAL_ORGANIZATION, HOA, ESCROW
 *
 * ── Content sources (HR#1) ───────────────────────────────────────────────────
 *
 * All text labels: verbatim from irs-captures/json/ein__reviewAndSubmit.json
 *   reviewAndSubmitSection.*
 * Section headers (Dynamic): confirmed against captured HTML
 *   IRS_Website/9_EIN WIZARD.../6_Review_and_Submit/
 *   "IRS Apply for an Employer Identification Number (EIN) online.html"
 * Rendering logic: OI() + E7() in irs-captures/js/index-ChwXuGQH.js
 *
 * ── Inherited accepted deviations ────────────────────────────────────────────
 * FA magnifying-glass icon (shared chrome, accepted 2026-05-08).
 */

import { useEffect, useRef, useState } from "react";
import { createPortal }                from "react-dom";
import { submitFinalApplication }      from "./actions";

// ── Entity type → label mapping ───────────────────────────────────────────────
// Source: shared:entityTypes in bundle (not available as a standalone JSON capture).
// Labels for SINGLE_MEMBER_LLC confirmed verbatim against captured HTML
// (IRS_Website/9_EIN WIZARD.../6_Review_and_Submit/).
// All other entity type labels: gap-fill per HR#1 clause 2 (prose-walkthrough),
// following the exact pattern confirmed by the HTML capture.
type EntityLabels = {
  entityName:           string; // All-caps display name for Organization Type row
  tellUsAboutOrgLabel:  string; // Used in section subheaders (e.g. "Limited Liability Company (LLC)")
  firstPersonNameValue: string; // personOne section header
  secondPersonNameValue?: string; // personTwo section header (present for some entity types)
};

const ENTITY_LABEL_MAP: Record<string, EntityLabels> = {
  // LLC types — verbatim from HTML capture (SINGLE_MEMBER_LLC confirmed)
  SINGLE_MEMBER_LLC: {
    entityName:           "SINGLE MEMBER LIMITED LIABILITY COMPANY (LLC)",
    tellUsAboutOrgLabel:  "Limited Liability Company (LLC)",
    firstPersonNameValue: "Responsible Party of the LLC",
  },
  MULTI_MEMBER_LLC: {
    entityName:           "MULTI-MEMBER LIMITED LIABILITY COMPANY (LLC)",
    tellUsAboutOrgLabel:  "Limited Liability Company (LLC)",
    firstPersonNameValue: "Responsible Party of the LLC",
  },
  // Sole Proprietor [gap-fill — prose-walkthrough pattern]
  SOLE_PROPRIETOR: {
    entityName:           "SOLE PROPRIETOR",
    tellUsAboutOrgLabel:  "Sole Proprietor",
    firstPersonNameValue: "Responsible Party",
  },
  // Partnership types [gap-fill]
  PARTNERSHIP: {
    entityName:           "PARTNERSHIP",
    tellUsAboutOrgLabel:  "Partnership",
    firstPersonNameValue: "Responsible Party of the Partnership",
  },
  LIMITED_PARTNERSHIP: {
    entityName:           "LIMITED PARTNERSHIP",
    tellUsAboutOrgLabel:  "Partnership",
    firstPersonNameValue: "Responsible Party of the Partnership",
  },
  // Corporation types [gap-fill]
  CORP: {
    entityName:           "CORPORATION",
    tellUsAboutOrgLabel:  "Corporation",
    firstPersonNameValue: "Responsible Party of the Corporation",
  },
  SCORP: {
    entityName:           "S CORPORATION",
    tellUsAboutOrgLabel:  "Corporation",
    firstPersonNameValue: "Responsible Party of the Corporation",
  },
  PERSONAL_SERVICE_CORPORATION: {
    entityName:           "PERSONAL SERVICE CORPORATION",
    tellUsAboutOrgLabel:  "Corporation",
    firstPersonNameValue: "Responsible Party of the Corporation",
  },
  CHURCH_CONTROLLED_ORGANIZATION: {
    entityName:           "CHURCH-CONTROLLED ORGANIZATION",
    tellUsAboutOrgLabel:  "Corporation",
    firstPersonNameValue: "Responsible Party",
  },
  // Trust types [gap-fill]
  TRUST: {
    entityName:           "TRUST",
    tellUsAboutOrgLabel:  "Trust",
    firstPersonNameValue: "Grantor/Owner",
    secondPersonNameValue: "Trustee",
  },
  // Other entity types [gap-fill]
  ESTATE: {
    entityName:           "ESTATE",
    tellUsAboutOrgLabel:  "Estate",
    firstPersonNameValue: "Decedent",
    secondPersonNameValue: "Executor/Administrator",
  },
  CHURCH: {
    entityName:           "CHURCH OR CHURCH-CONTROLLED ORGANIZATION",
    tellUsAboutOrgLabel:  "Organization",
    firstPersonNameValue: "Responsible Party",
  },
  HOUSEHOLD_EMPLOYER: {
    entityName:           "HOUSEHOLD EMPLOYER",
    tellUsAboutOrgLabel:  "Employer",
    firstPersonNameValue: "Responsible Party",
  },
  EMPLOYER_OR_FISCAL_AGENT: {
    entityName:           "EMPLOYER OR FISCAL AGENT",
    tellUsAboutOrgLabel:  "Employer",
    firstPersonNameValue: "Responsible Party",
  },
  POLITICAL_ORGANIZATION: {
    entityName:           "POLITICAL ORGANIZATION",
    tellUsAboutOrgLabel:  "Organization",
    firstPersonNameValue: "Responsible Party",
  },
  HOA: {
    entityName:           "HOMEOWNERS ASSOCIATION",
    tellUsAboutOrgLabel:  "Organization",
    firstPersonNameValue: "Responsible Party",
  },
  ESCROW: {
    entityName:           "ESCROW",
    tellUsAboutOrgLabel:  "Account",
    firstPersonNameValue: "Responsible Party",
  },
  RECEIVERSHIP: {
    entityName:           "RECEIVERSHIP",
    tellUsAboutOrgLabel:  "Business",
    firstPersonNameValue: "Business Under Receivership",
    secondPersonNameValue: "Responsible Party",
  },
  BANKRUPTCY: {
    entityName:           "BANKRUPTCY",
    tellUsAboutOrgLabel:  "Estate",
    firstPersonNameValue: "Responsible Party",
  },
};

// ── Entity types with a default principal activity (skip W5) ─────────────────
// Source: th.hasDefaultPrincipalActivity() in index-ChwXuGQH.js (W5 page.tsx)
const HAS_DEFAULT_PRINCIPAL_ACTIVITY = new Set([
  "CHURCH",
  "CHURCH_CONTROLLED_ORGANIZATION",
  "HOUSEHOLD_EMPLOYER",
  "EMPLOYER_OR_FISCAL_AGENT",
  "POLITICAL_ORGANIZATION",
  "HOA",
  "ESCROW",
]);

// ── Reason for applying display map ──────────────────────────────────────────
// Source: reviewAndSubmitSection.reasonForApplying in ein__reviewAndSubmit.json
const REASON_FOR_APPLYING_LABELS: Record<string, string> = {
  NEW_BUSINESS:            "Started a new business",
  HIRED_EMPLOYEES:         "Hired employee(s)",
  IRS_COMPLIANCE:          "IRS Compliance",
  BANKING_NEEDS:           "Banking purposes",
  CHANGING_LEGAL_STRUCTURE:"Changed type of organization",
  PURCHASED_BUSINESS:      "Purchased active business",
  CREATED_TRUST:           "Created Trust",
  CREATED_PENSION:         "Created Pension",
  OTHER:                   "Other",
};

// ── Month display map ─────────────────────────────────────────────────────────
const MONTH_LABELS: Record<string, string> = {
  JANUARY: "January", FEBRUARY: "February", MARCH: "March",
  APRIL: "April",     MAY: "May",           JUNE: "June",
  JULY: "July",       AUGUST: "August",     SEPTEMBER: "September",
  OCTOBER: "October", NOVEMBER: "November", DECEMBER: "December",
};

// ── FormData type ─────────────────────────────────────────────────────────────
export type ReviewFormData = {
  // W1
  entity_type?:         string;
  legal_structure?:     string;
  reason_for_applying?: string;
  members_of_llc?:      string;
  // W2
  responsibleFirstName?:  string;
  responsibleMiddleName?: string;
  responsibleLastName?:   string;
  responsibleSuffix?:     string;
  responsibleSsn?:        string;
  // W3
  physicalStreet?:  string;
  physicalCity?:    string;
  physicalState?:   string;
  physicalZipCode?: string;
  thePhone?:        string;
  otherAddress?:    string;
  // W4
  legalName?:         string;
  dbaName?:           string;
  county?:            string;
  state?:             string;
  stateIncorporated?: string;
  startMonth?:        string;
  startYear?:         string | number;
  trucking?:          boolean | string;
  gambling?:          boolean | string;
  exciseTaxes?:       boolean | string;
  atf?:               boolean | string;
  w2Issuer?:          boolean | string;
  w2Info?: {
    firstWagesPaidMonth?:  string;
    firstWagesPaidYear?:   string | number;
    agEmployeesCount?:     string | number;
    householdEmployeesCount?: string | number;
    otherEmployeesCount?:  string | number;
    over1000TaxLiability?: boolean | string;
  };
  // W5
  principalActivity?:      string;
  otherPrincipalActivity?: string;
  principalService?:       string;
  otherPrincipalService?:  string;
};

// ── SummaryRow / SummarySection types (mirrors OI tableData shape) ────────────
type SummaryRow = {
  label: string;
  value: string;
};
type SummarySection = {
  title: string;
  rows: SummaryRow[];
};

// ── Build summary sections from form_data (OI assembly order) ─────────────────
function buildSummarySections(fd: ReviewFormData): SummarySection[] {
  const sections: SummarySection[] = [];

  const entityType =
    (fd.entity_type as string | undefined) ??
    (fd.legal_structure as string | undefined) ??
    (fd.members_of_llc === "1" ? "SINGLE_MEMBER_LLC" : "SINGLE_MEMBER_LLC");

  const labels: EntityLabels = ENTITY_LABEL_MAP[entityType] ?? {
    entityName:           entityType,
    tellUsAboutOrgLabel:  entityType,
    firstPersonNameValue: "Responsible Party",
  };

  const yesNo = (val: boolean | string | undefined) => {
    if (val === true || val === "true" || val === "yes") return "YES";
    if (val === false || val === "false" || val === "no") return "NO";
    return "";
  };

  const maskSsn = (ssn: string) => {
    const digits = ssn.replace(/-/g, "");
    if (digits.length >= 5) return `XXX-XX-${digits.slice(-4)}`;
    return ssn;
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
    return phone;
  };

  // ── 1. legalStructure — Organization Type ────────────────────────────────
  // Source: summaryInfo.legalStructure in ein__reviewAndSubmit.json
  //   subheader: "Legal Structure"
  //   fields[0].name: "Organization Type"
  {
    sections.push({
      title: "Legal Structure",
      rows: [
        { label: "Organization Type", value: labels.entityName },
      ],
    });
  }

  // ── 2. entityInformation — {{tellUsAboutOrgLabel}} Information ────────────
  // Source: summaryInfo.entityInformation + F() function in OI
  {
    const rows: SummaryRow[] = [];

    if (fd.legalName) {
      let displayName = fd.legalName.toUpperCase();
      rows.push({ label: "Legal name", value: displayName });
    }
    if (fd.dbaName) {
      rows.push({ label: "Trade name/doing business as", value: fd.dbaName.toUpperCase() });
    }
    if (fd.county) {
      rows.push({ label: "County", value: fd.county.toUpperCase() });
    }
    if (fd.state) {
      rows.push({ label: "State/Territory", value: fd.state });
    }
    if (fd.startMonth && fd.startYear) {
      const monthLabel = MONTH_LABELS[fd.startMonth] ?? fd.startMonth;
      const startDateDisplay = `${monthLabel} ${fd.startYear}`;
      // Field name varies by entity type — matching OI F() field index logic:
      // ESTATE → fields[4] "Date created/funded/probated"
      // Corp types → fields[5] "Date Corporation started or acquired"
      // Trust types → fields[6] "Date Trust funded"
      // Other/WITHHOLDING → fields[7] "Date business started or acquired"
      // Default (LLC, sole prop, etc.) → fields[8] "Start date"
      rows.push({ label: "Start date", value: startDateDisplay });
    }
    if (fd.stateIncorporated) {
      rows.push({
        label: "State/Territory where articles of organization are (or will be) filed",
        value: fd.stateIncorporated,
      });
    }

    if (rows.length > 0) {
      sections.push({
        title: `${labels.tellUsAboutOrgLabel} Information`,
        rows,
      });
    }
  }

  // ── 3. addressInformation — Addresses ────────────────────────────────────
  // Source: summaryInfo.addressInformation + Y() function in OI
  {
    const rows: SummaryRow[] = [];

    if (fd.physicalStreet && fd.physicalCity && fd.physicalState && fd.physicalZipCode) {
      const addr = `${fd.physicalStreet.toUpperCase()}\n${fd.physicalCity.toUpperCase()} ${fd.physicalState.toUpperCase()} ${fd.physicalZipCode}`;
      rows.push({ label: "Physical Location", value: addr });
    }
    if (fd.thePhone) {
      rows.push({ label: "Phone Number", value: formatPhone(fd.thePhone) });
    }
    // Mail directed To — empty when no third-party designee (matches HTML capture)
    rows.push({ label: "Mail directed To", value: "" });

    if (rows.length > 0) {
      sections.push({ title: "Addresses", rows });
    }
  }

  // ── 4. personOne — {{firstPersonNameValue}} ───────────────────────────────
  // Source: summaryInfo.personOne + Q() function in OI
  //   fields[0].name: "Name", fields[1].name: "SSN/ITIN"
  {
    const rows: SummaryRow[] = [];
    const nameParts = [
      fd.responsibleFirstName,
      fd.responsibleMiddleName,
      fd.responsibleLastName,
      fd.responsibleSuffix,
    ]
      .filter(Boolean)
      .join(" ");

    // Bundle appends entity type display addition to name (e.g. "SOLE MBR" for LLC)
    // This comes from shared:entityTypes displayNameAddition — not captured.
    // Display the name as entered; the entity addition is a display enhancement.
    if (nameParts) {
      rows.push({ label: "Name", value: nameParts.toUpperCase() });
    }
    if (fd.responsibleSsn) {
      rows.push({ label: "SSN/ITIN", value: maskSsn(fd.responsibleSsn) });
    }

    if (rows.length > 0) {
      sections.push({ title: labels.firstPersonNameValue, rows });
    }
  }

  // ── 5. employeeInfo — Employee Information (conditional) ─────────────────
  // Source: summaryInfo.employeeInfo + he() function in OI
  //   Only rendered when w2Issuer data exists in form_data.
  {
    const w2 = fd.w2Info as ReviewFormData["w2Info"] | undefined;
    if (fd.w2Issuer === true || fd.w2Issuer === "true" || fd.w2Issuer === "yes") {
      const rows: SummaryRow[] = [];
      if (w2?.firstWagesPaidMonth && w2?.firstWagesPaidYear) {
        const month = MONTH_LABELS[w2.firstWagesPaidMonth] ?? w2.firstWagesPaidMonth;
        rows.push({
          label: "Date wages or annuities will be paid",
          value: `${month} ${w2.firstWagesPaidYear}`,
        });
      }
      if (w2?.agEmployeesCount !== undefined && w2.agEmployeesCount !== null) {
        rows.push({
          label: "Number of agricultural employees",
          value: String(w2.agEmployeesCount),
        });
      }
      if (w2?.householdEmployeesCount !== undefined && w2.householdEmployeesCount !== null) {
        rows.push({
          label: "Number of household employees",
          value: String(w2.householdEmployeesCount),
        });
      }
      if (w2?.otherEmployeesCount !== undefined && w2.otherEmployeesCount !== null) {
        rows.push({
          label: "Number of other employees",
          value: String(w2.otherEmployeesCount),
        });
      }
      if (w2?.over1000TaxLiability !== undefined) {
        // Bundle: over1000TaxLiability is true when answer is "no" (tax liability ≤ $1000)
        rows.push({
          label: "Tax Liability of $1000 or less during calendar year",
          value: yesNo(w2.over1000TaxLiability),
        });
      }
      if (rows.length > 0) {
        sections.push({ title: "Employee Information", rows });
      }
    }
  }

  // ── 6. businessActivity — Principal Business Activity ────────────────────
  // Source: summaryInfo.businessActivity + J() function in OI
  //   Only rendered when !hasDefaultPrincipalActivity(entityType) AND principalActivity present
  {
    if (
      !HAS_DEFAULT_PRINCIPAL_ACTIVITY.has(entityType) &&
      fd.principalActivity
    ) {
      const activityDisplay =
        fd.otherPrincipalActivity || fd.principalActivity;

      const serviceDisplay =
        fd.otherPrincipalService ||
        (fd.principalService && fd.principalService !== "OTHER"
          ? fd.principalService
          : "");

      sections.push({
        title: "Principal Business Activity",
        rows: [
          {
            label: "What your business/organization does",
            value: activityDisplay.toUpperCase(),
          },
          {
            label: "Principal product/service",
            value: serviceDisplay.toUpperCase(),
          },
        ],
      });
    }
  }

  // ── 7. additionalInfo — Additional {{tellUsAboutOrgLabel}} Information ────
  // Source: summaryInfo.additionalInfo + j() function in OI
  {
    const rows: SummaryRow[] = [];

    if (fd.trucking !== undefined && fd.trucking !== null && fd.trucking !== "") {
      rows.push({
        label: "Owns a 55,000 pounds or greater highway motor vehicle",
        value: yesNo(fd.trucking),
      });
    }
    if (fd.gambling !== undefined && fd.gambling !== null && fd.gambling !== "") {
      rows.push({ label: "Involves gambling/wagering", value: yesNo(fd.gambling) });
    }
    if (fd.atf !== undefined && fd.atf !== null && fd.atf !== "") {
      rows.push({ label: "Involves alcohol, tobacco, or firearms", value: yesNo(fd.atf) });
    }
    if (fd.exciseTaxes !== undefined && fd.exciseTaxes !== null && fd.exciseTaxes !== "") {
      rows.push({
        label: "Files Form 720 (Quarterly Federal Excise Tax Return)",
        value: yesNo(fd.exciseTaxes),
      });
    }
    if (fd.w2Issuer !== undefined && fd.w2Issuer !== null && fd.w2Issuer !== "") {
      rows.push({
        label: "Has employees who receive Forms W-2",
        value: yesNo(fd.w2Issuer),
      });
    }
    if (fd.reason_for_applying) {
      const rfaLabel =
        REASON_FOR_APPLYING_LABELS[fd.reason_for_applying] ?? fd.reason_for_applying;
      rows.push({ label: "Reason for Applying", value: rfaLabel.toUpperCase() });
    }

    if (rows.length > 0) {
      sections.push({
        title: `Additional ${labels.tellUsAboutOrgLabel} Information`,
        rows,
      });
    }
  }

  return sections;
}

// ── Component ─────────────────────────────────────────────────────────────────

type ReviewSubmitFormProps = {
  formData:   ReviewFormData;
  entityType: string;
};

export default function ReviewSubmitForm({
  formData: fd,
  entityType,
}: ReviewSubmitFormProps) {
  const [mounted, setMounted]           = useState(false);
  const [letterPref, setLetterPref]     = useState("");
  const [letterError, setLetterError]   = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState("");
  const errorRef                        = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const summarySections = buildSummarySections(fd);

  const backUrl = HAS_DEFAULT_PRINCIPAL_ACTIVITY.has(entityType)
    ? "/irs/ein/apply/additional-details"
    : "/irs/ein/apply/activity-and-services";

  // ── Validation (mirrors E7() $() in bundle) ───────────────────────────────
  const validate = (): boolean => {
    if (!letterPref) {
      // Verbatim: confirmationLetterInputControl.inputErrorMessages[0].text
      setLetterError("Confirmation Letter: Selection is required.");
      return false;
    }
    setLetterError("");
    return true;
  };

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) {
      errorRef.current?.focus();
      window.scrollTo(0, 0);
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    const fd = new FormData();
    fd.set("confirmationLetterPreference", letterPref);

    try {
      await submitFinalApplication(fd);
      // Successful submit redirects server-side; no client cleanup needed.
    } catch {
      // Matches pageError500 behavior from E7():
      //   "Apply for EIN is currently unavailable."
      setSubmitError("Apply for EIN is currently unavailable.");
      setSubmitting(false);
      errorRef.current?.focus();
      window.scrollTo(0, 0);
    }
  };

  if (!mounted) return null;

  const portal = document.getElementById("w6-form-portal");
  if (!portal) return null;

  // ── Processing overlay (applicationBeingProcessed in bundle) ─────────────
  // Verbatim text: reviewAndSubmitSection.applicationBeingProcessed
  if (submitting) {
    return createPortal(
      <div
        role="status"
        aria-live="polite"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "200px",
          padding: "40px 0",
        }}
      >
        <p style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "8px" }}>
          Your application is being processed
        </p>
        <p style={{ color: "#555" }}>
          It can take up to two minutes for your application to be processed
        </p>
      </div>,
      portal,
    );
  }

  return createPortal(
    <>
      {/* ── Error summary (pageErrorInputError1) ───────────────────────── */}
      {(letterError || submitError) && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="section-alert section-alert--red"
          style={{ marginBottom: "24px" }}
        >
          <div className="section-alert__icon" aria-hidden="true" />
          <div>
            <strong>The following error has occurred:</strong>
            {letterError && (
              <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                <li>{letterError}</li>
              </ul>
            )}
            {submitError && (
              <p style={{ marginTop: "8px" }}>{submitError}</p>
            )}
          </div>
        </div>
      )}

      {/* ── reviewBeforeSubmittingAlert (blue info SectionAlert) ────────── */}
      {/* Verbatim: reviewAndSubmitSection.reviewBeforeSubmittingAlert */}
      <div
        tabIndex={0}
        className="section-alert section-alert--blue"
        style={{ marginBottom: "24px" }}
      >
        <div aria-hidden="true" className="section-alert__icon" />
        <div>
          <h2
            className="section-alert__title"
            style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px" }}
          >
            Review your information before submitting.
          </h2>
          <p style={{ marginBottom: "8px" }}>
            Please review the information you are about to submit. If any of the
            information below is incorrect, you will need to start a new application.
          </p>
          <p>
            Click the &quot;Submit EIN Request&quot; button at the bottom of the
            page to receive your EIN.
          </p>
        </div>
      </div>

      {/* ── confirmationLetterInstructions + radio ───────────────────────── */}
      {/* Verbatim: reviewAndSubmitSection.confirmationLetterInstructions */}
      <section style={{ marginBottom: "32px" }}>
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            marginBottom: "16px",
          }}
        >
          How would you like to receive your EIN Confirmation Letter?
        </h3>

        {/* Verbatim: confirmationLetterInputControl.fieldName */}
        <p style={{ marginBottom: "12px" }}>
          You have two options for receiving your confirmation letter. Please
          choose one below
        </p>

        {letterError && (
          <p
            role="alert"
            style={{ color: "#d52b1e", marginBottom: "8px", fontWeight: 600 }}
          >
            {letterError}
          </p>
        )}

        {/* Radio: DIGITAL */}
        {/* Verbatim: choices[0] text + additionalText */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "flex", gap: "10px", cursor: "pointer" }}>
            <input
              type="radio"
              name="confirmationLetterPreference"
              value="DIGITAL"
              checked={letterPref === "DIGITAL"}
              onChange={() => {
                setLetterPref("DIGITAL");
                setLetterError("");
              }}
              style={{ marginTop: "3px", flexShrink: 0 }}
            />
            <span>
              <strong>Receive letter digitally in the next step</strong>
              <br />
              <span style={{ color: "#555", fontSize: "0.875rem" }}>
                This option requires Adobe Reader. You will be able to view,
                print, and save this letter immediately. It will not be mailed
                to you.
              </span>
            </span>
          </label>
        </div>

        {/* Radio: MAIL */}
        {/* Verbatim: choices[1] text + additionalText */}
        <div>
          <label style={{ display: "flex", gap: "10px", cursor: "pointer" }}>
            <input
              type="radio"
              name="confirmationLetterPreference"
              value="MAIL"
              checked={letterPref === "MAIL"}
              onChange={() => {
                setLetterPref("MAIL");
                setLetterError("");
              }}
              style={{ marginTop: "3px", flexShrink: 0 }}
            />
            <span>
              <strong>
                Receive letter by mail (allow up to 4 weeks for delivery)
              </strong>
              <br />
              <span style={{ color: "#555", fontSize: "0.875rem" }}>
                The IRS will send the letter to the mailing address you
                provided.
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* ── Summary table ────────────────────────────────────────────────── */}
      {/* Verbatim: summaryInfoHeader.title + OI section assembly order */}
      <div className="summaryInfoTable" style={{ marginBottom: "40px" }}>
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            marginBottom: "24px",
          }}
        >
          Summary of your information
        </h3>

        {summarySections.map((section) => (
          <div
            key={section.title}
            className="summary-information-table-component"
            style={{ marginBottom: "40px" }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                marginBottom: "12px",
                marginTop: 0,
              }}
            >
              {section.title}
            </h3>
            <table className="summaryInformationTable" style={{ width: "100%" }}>
              <tbody>
                {section.rows.map((row) => (
                  <tr key={row.label}>
                    <td style={{ padding: "6px 12px 6px 0", verticalAlign: "top", width: "45%" }}>
                      <b>{row.label}</b>
                    </td>
                    <td style={{ padding: "6px 0", verticalAlign: "top", whiteSpace: "pre-line" }}>
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ── instructions4 paragraph ──────────────────────────────────────── */}
      {/* Verbatim: reviewAndSubmitSection.instructions4.title */}
      <p style={{ marginBottom: "40px" }}>
        Click &quot;Submit EIN Request&quot; to send your request and receive
        your EIN. Once you submit, please wait while your application is being
        processed. It can take up to two minutes for your application to be
        processed.
      </p>

      {/* ── Back + Submit EIN Request + Cancel ───────────────────────────── */}
      {/* Verbatim labels: buttonControls[0] "Back", [1] "Submit EIN Request", [2] "Cancel" */}
      {/* Source: reviewAndSubmitSection.buttonControls in ein__reviewAndSubmit.json */}
      <div style={{ marginBottom: "40px" }}>
        {/* Back — inverted style, entity-type-aware routing */}
        <a
          href={backUrl}
          className="irs-button irs-button--active _fixButtonContrast_1w9ml_81 _fixButtonCapitals_1w9ml_85 buttonStyle"
          style={{ marginRight: "8px", display: "inline-block" }}
          aria-label="Back"
        >
          Back
        </a>

        {/* Submit EIN Request — primary button */}
        <button
          type="button"
          id="submitEinRequestButton"
          onClick={handleSubmit}
          disabled={submitting}
          className="irs-button irs-button--active inverted _fixButtonContrast_1w9ml_81 _fixButtonCapitals_1w9ml_85 buttonStyle"
          aria-label="Submit EIN Request"
        >
          Submit EIN Request
        </button>

        <br />
        <br />

        {/* Cancel — link (Cr component equivalent, routes to applyForEin launch page) */}
        <a
          href="/irs/ein"
          aria-label="Cancel link, click enter to go to Apply for EIN Page"
          className="link link--blue link--no-padding"
        >
          Cancel
        </a>
      </div>
    </>,
    portal,
  );
}
