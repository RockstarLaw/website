/**
 * IRS EIN Wizard Step 6 — Review & Submit (Slice 8)
 *
 * Verbatim clone of the IRS sa.www4.irs.gov/applyein/reviewAndSubmit page.
 * HTML chrome stored at public/irs/wizard-step-6.html.
 * Interactive content rendered by <ReviewSubmitForm /> client component,
 * portaled into #w6-form-portal.
 *
 * ── Responsibilities ─────────────────────────────────────────────────────────
 *
 * 1. Auth check — redirects to /login if not signed in.
 * 2. Application gate — redirects to /irs/ein/apply/legal-structure if no
 *    in-progress application found.
 * 3. Step completeness gate — redirects to the earliest incomplete step if the
 *    user navigates directly to /review-and-submit without completing prior steps.
 *    Minimum required fields checked (not exhaustive):
 *      W1: entity_type (or legal_structure)
 *      W2: responsibleFirstName + responsibleLastName + responsibleSsn
 *      W3: physicalStreet + physicalCity + physicalState + physicalZipCode
 *      W4: legalName + startMonth + startYear
 *      W5: principalActivity (for non-default-activity entity types)
 * 4. Passes accumulated form_data to ReviewSubmitForm for display.
 *
 * ── Content sources (HR#1) ───────────────────────────────────────────────────
 *
 * Chrome HTML: adapted from wizard-step-5.html (same page-w0/ CSS bundle,
 *   same shared chrome). Changes: portal id w6-form-portal, progress step 5-of-6
 *   active (Review & Submit), step 4 (Additional Details) completed.
 *   Confirmed against:
 *     IRS_Website/9_EIN WIZARD.../6_Review_and_Submit/
 *     "IRS Apply for an Employer Identification Number (EIN) online.html"
 *
 * Summary section labels: verbatim from
 *   irs-captures/json/ein__reviewAndSubmit.json → reviewAndSubmitSection.summaryInfo
 *
 * Section ordering + conditional logic: verbatim from
 *   irs-captures/js/index-ChwXuGQH.js → OI() component assembly (U,P,q,B,W,V,X,ie)
 *
 * ── Entity types with default principal activity ──────────────────────────────
 * CHURCH / CHURCH_CONTROLLED_ORGANIZATION → skip W5, Back routes to W4
 * HOUSEHOLD_EMPLOYER                      → skip W5, Back routes to W4
 * EMPLOYER_OR_FISCAL_AGENT                → skip W5, Back routes to W4
 * POLITICAL_ORGANIZATION                  → skip W5, Back routes to W4
 * HOA / ESCROW                            → skip W5, Back routes to W4
 * All others                              → Back routes to W5
 *
 * ── Inherited accepted deviations ────────────────────────────────────────────
 * FA magnifying-glass icon (shared chrome, accepted 2026-05-08).
 */

import { readFileSync } from "fs";
import { join }         from "path";
import { redirect }     from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient }  from "@/lib/supabase/admin";
import { ENTITY_CONFIG }              from "@/lib/irs/additionalDetailsConfig";
import ReviewSubmitForm, {
  type ReviewFormData,
} from "./ReviewSubmitForm";

export const dynamic = "force-dynamic";

// ── Entity types that pre-set principalActivity (skip W5) ────────────────────
// Source: th.hasDefaultPrincipalActivity() in index-ChwXuGQH.js
const HAS_DEFAULT_PRINCIPAL_ACTIVITY = new Set([
  "CHURCH",
  "CHURCH_CONTROLLED_ORGANIZATION",
  "HOUSEHOLD_EMPLOYER",
  "EMPLOYER_OR_FISCAL_AGENT",
  "POLITICAL_ORGANIZATION",
  "HOA",
  "ESCROW",
]);

export default async function IrsEinReviewSubmitPage() {
  // ── 1. Auth check ──────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 2. Load in-progress application ───────────────────────────────────────
  const admin = createSupabaseAdminClient();
  const { data: app } = await admin
    .from("ein_applications")
    .select("form_data, current_step, status")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (!app) {
    redirect("/irs/ein/apply/legal-structure");
  }

  const fd = (app.form_data ?? {}) as ReviewFormData & Record<string, unknown>;

  // ── 3. Entity-type resolution ──────────────────────────────────────────────
  const entityType =
    (fd.entity_type      as string | undefined) ??
    (fd.legal_structure  as string | undefined) ??
    (fd.members_of_llc === "1" ? "SINGLE_MEMBER_LLC" : "");

  // ── 4. Step completeness gates ─────────────────────────────────────────────

  // W1 gate: entity type must be resolved
  if (!entityType) {
    redirect("/irs/ein/apply/legal-structure");
  }

  // W1 gate: entity type must be supported (same check as W4/W5)
  if (!ENTITY_CONFIG[entityType]) {
    redirect("/irs/ein/apply/additional-details/coming-soon");
  }

  // W2 gate: responsible party identity fields
  if (!fd.responsibleFirstName || !fd.responsibleLastName || !fd.responsibleSsn) {
    redirect("/irs/ein/apply/identity");
  }

  // W3 gate: physical address
  if (!fd.physicalStreet || !fd.physicalCity || !fd.physicalState || !fd.physicalZipCode) {
    redirect("/irs/ein/apply/address");
  }

  // W4 gate: entity information
  if (!fd.legalName || !fd.startMonth || !fd.startYear) {
    redirect("/irs/ein/apply/additional-details");
  }

  // W5 gate: principal activity required for non-default-activity entities
  if (
    !HAS_DEFAULT_PRINCIPAL_ACTIVITY.has(entityType) &&
    !fd.principalActivity
  ) {
    redirect("/irs/ein/apply/activity-and-services");
  }

  // ── 5. Load HTML chrome ────────────────────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/irs/wizard-step-6.html"),
    "utf-8",
  );
  const bodyMatch   = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" crossOrigin="" href="/irs/page-w0/index-D-QGvqqz.css" />

      {/* Tailwind Preflight reset — verbatim from W5 page.tsx */}
      <style>{`
        body {
          display: block !important;
          flex-direction: initial !important;
          align-items: initial !important;
          min-height: auto !important;
          background-color: initial !important;
        }
        svg.external-icon {
          display: inline !important;
          vertical-align: text-top !important;
        }
        ._fixHelptipStyling_bppll_24,
        ._fixHelptipStyling_bppll_24 > span {
          display: inline !important;
          vertical-align: middle !important;
        }
        /* Summary table styling — mirrors xI component (summaryInformationTable class) */
        .summaryInformationTable {
          border-collapse: collapse;
          width: 100%;
        }
        .summaryInformationTable td {
          border-bottom: 1px solid #ddd;
          padding: 8px 12px 8px 0;
          vertical-align: top;
        }
        .summaryInformationTable tr:last-child td {
          border-bottom: none;
        }
      `}</style>

      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />

      {/* Portal: renders into #w6-form-portal inside the IRS chrome */}
      <ReviewSubmitForm formData={fd} entityType={entityType} />
    </>
  );
}
