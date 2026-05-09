/**
 * IRS EIN Wizard Step 5 — Activity & Services (Slice 7)
 *
 * Verbatim clone of the IRS sa.www4.irs.gov/applyein/activityAndServices page.
 * HTML chrome stored at public/irs/wizard-step-5.html.
 * Interactive form rendered by <ActivityServicesForm /> client component,
 * portaled into #w5-form-portal.
 *
 * Scope: all entity types with an ENTITY_CONFIG entry.
 *   Gate: same entity-type resolution chain as W4 (entity_type ?? legal_structure ??
 *   members_of_llc-fallback). Types with a pre-set principalActivity (hasDefaultActivity)
 *   are auto-persisted here and forwarded to W6 without showing the form.
 *
 * CSS: Reuses /irs/page-w0/index-D-QGvqqz.css (confirmed same bundle as W1–W4
 *   per pre-flight: 5_Activity_and_Services capture references index-D-QGvqqz.css).
 *
 * Content sources (HR#1):
 *   Primary choice labels + descriptions: verbatim from
 *     IRS_Website/9_EIN WIZARD.../5_Activity_and_Services/
 *     "IRS Apply for an Employer Identification Number (EIN) online.html"
 *   Sub-activity display labels: verbatim from
 *     irs-captures/json/ein__reviewAndSubmit.json → principalService map
 *   Sub-section conditional logic: decoded from
 *     irs-captures/js/index-ChwXuGQH.js → mf() renderer + Ia() submitter
 *   Sub-section headers not captured in local literals: prose-walkthrough
 *     gap-fill per HR#1 clause 2 (marked with [gap-fill] in ActivityServicesForm.tsx)
 *
 * Entities with default principal activity (hasDefaultPrincipalActivity in bundle):
 *   CHURCH / CHURCH_CONTROLLED_ORGANIZATION → OTHER / "Faith Based Org"
 *   HOUSEHOLD_EMPLOYER                      → OTHER / "Household Emp"
 *   EMPLOYER_OR_FISCAL_AGENT                → OTHER / "Payroll Services"
 *   POLITICAL_ORGANIZATION                  → OTHER / "Political Org"
 *   HOA / ESCROW                            → REAL_ESTATE / "Real Estate"
 *   These entity types skip the form and auto-advance with their pre-set values.
 *
 * Inherited accepted deviations from W0–W4:
 *   - FA magnifying-glass icon (CSS-only, no JS bundle)
 */

import { readFileSync } from "fs";
import { join }         from "path";
import { redirect }     from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient }  from "@/lib/supabase/admin";
import { ENTITY_CONFIG }              from "@/lib/irs/additionalDetailsConfig";
import ActivityServicesForm, {
  type ActivityServicesPrefill,
} from "./ActivityServicesForm";

export const dynamic = "force-dynamic";

// ── Entity types that pre-set principalActivity (skips the form) ─────────────
// Source: th.hasDefaultPrincipalActivity() + setBusinessActivitiesOnApp() in bundle
const DEFAULT_ACTIVITY_MAP: Record<string, { principalActivity: string; otherPrincipalActivity: string }> = {
  CHURCH:                         { principalActivity: "OTHER",       otherPrincipalActivity: "Faith Based Org" },
  CHURCH_CONTROLLED_ORGANIZATION: { principalActivity: "OTHER",       otherPrincipalActivity: "Faith Based Org" },
  HOUSEHOLD_EMPLOYER:             { principalActivity: "OTHER",       otherPrincipalActivity: "Household Emp" },
  EMPLOYER_OR_FISCAL_AGENT:       { principalActivity: "OTHER",       otherPrincipalActivity: "Payroll Services" },
  POLITICAL_ORGANIZATION:         { principalActivity: "OTHER",       otherPrincipalActivity: "Political Org" },
  HOA:                            { principalActivity: "REAL_ESTATE", otherPrincipalActivity: "Real Estate" },
  ESCROW:                         { principalActivity: "REAL_ESTATE", otherPrincipalActivity: "Real Estate" },
};

export default async function IrsEinActivityServicesPage() {
  // ── 1. Auth check ──────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 2. Entity-type resolution + gate ──────────────────────────────────────
  let resolvedType = "SINGLE_MEMBER_LLC";
  let prefill: ActivityServicesPrefill = {};

  if (user) {
    const admin = createSupabaseAdminClient();
    const { data: app } = await admin
      .from("ein_applications")
      .select("form_data")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (app) {
      const fd = app.form_data as Record<string, unknown>;

      // Resolution order: same as W4 (entity_type ?? legal_structure ?? LLC fallback)
      const detectedType =
        (fd.entity_type       as string | undefined) ??
        (fd.legal_structure   as string | undefined) ??
        (fd.members_of_llc === "1" ? "SINGLE_MEMBER_LLC" : "");

      if (!ENTITY_CONFIG[detectedType]) {
        redirect("/irs/ein/apply/additional-details/coming-soon");
      }
      resolvedType = detectedType;

      // ── Auto-advance for entities with a default principal activity ───────
      if (DEFAULT_ACTIVITY_MAP[resolvedType]) {
        const defaults = DEFAULT_ACTIVITY_MAP[resolvedType]!;
        const merged = {
          ...(fd as Record<string, unknown>),
          principalActivity:      defaults.principalActivity,
          otherPrincipalActivity: defaults.otherPrincipalActivity,
          principalService:       "",
          otherPrincipalService:  null,
        };
        await admin
          .from("ein_applications")
          .update({ current_step: "review_and_submit", form_data: merged })
          .eq("user_id", user.id)
          .eq("status", "in_progress");
        redirect("/irs/ein/apply/review-and-submit");
      }

      // Prefill from prior W5 submission (if user navigated Back from W6)
      prefill = {
        primaryActivity:      (fd.principalActivity      as string | undefined) ?? "",
        otherPrincipalActivity: (fd.otherPrincipalActivity as string | undefined) ?? "",
        principalService:     (fd.principalService       as string | undefined) ?? "",
        otherPrincipalService:(fd.otherPrincipalService  as string | undefined) ?? "",
      };
    }
  }

  // ── 3. Load HTML chrome ────────────────────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/irs/wizard-step-5.html"),
    "utf-8",
  );
  const bodyMatch   = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" crossOrigin="" href="/irs/page-w0/index-D-QGvqqz.css" />

      {/* Tailwind Preflight reset — verbatim from W4 page.tsx */}
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
      `}</style>

      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />

      {/* Portal: renders into #w5-form-portal inside the IRS chrome */}
      <ActivityServicesForm prefill={prefill} />
    </>
  );
}
