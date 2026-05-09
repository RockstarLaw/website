/**
 * IRS EIN Wizard Step 4 — Additional Details (Phase IRS-W4a, Slice 1)
 *
 * 1:1 clone of the IRS sa.www4.irs.gov/applyein/additionalDetails page.
 * HTML chrome stored at public/irs/wizard-step-4.html.
 * Interactive form rendered by <AdditionalDetailsForm /> client component,
 * portaled into #w4-form-portal.
 *
 * Scope: SINGLE_MEMBER_LLC only.
 *   Gate: form_data.legal_structure === "LLC" && form_data.members_of_llc === "1"
 *   (members_of_llc is a numeric count string from W1's LegalStructureForm.tsx)
 *   Any other combination redirects to /irs/ein/apply/additional-details/coming-soon.
 *
 * CSS: Reuses /irs/page-w0/index-D-QGvqqz.css (same bundle as W1–W3).
 *
 * Inherited accepted deviations from W0–W3:
 *   - FA magnifying-glass icon (CSS-only, no JS bundle)
 *   - Help-icon line-wrap (minor layout)
 *
 * Non-LLC visual diff relaxation:
 *   Per SESSION_HANDOFF.md (2026-05-08 evening): non-LLC W4a paths use the
 *   LLC visual template, with fields driven by additionalDetailsConfig.ts.
 *   LLC remains the strict 1:1 pixel diff target (dual-pass per IRS-W4a phase plan).
 *   All non-LLC entity types deferred to Slice 3 pending HTML captures.
 *
 * JSON loading: server-side readFileSync of ein__additionalDetails.json.
 * Only the SMLLC-relevant keys are extracted and passed to the client component
 * as serialized props — avoids shipping the full 50KB JSON to the browser.
 */

import { readFileSync } from "fs";
import { join }         from "path";
import { redirect }     from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient }  from "@/lib/supabase/admin";
import AdditionalDetailsForm, {
  type AdditionalDetailsSchema,
} from "./AdditionalDetailsForm";
import { ENTITY_CONFIG } from "@/lib/irs/additionalDetailsConfig";

export const dynamic = "force-dynamic";

export default async function IrsEinAdditionalDetailsPage() {
  // ── 1. Auth check — page is public; we need DB read only if logged in ────
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── 2. Entity-type gate ──────────────────────────────────────────────────
  // Default for unauthenticated / no-app direct navigation (SMLLC chrome shown)
  let resolvedType = "SINGLE_MEMBER_LLC";

  // If no user / no in-progress session, let the form render in blank state
  // (back-compat with direct navigation). Gate check requires an app row.
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
      // entity_type resolved by Slice 2 W1 actions.ts; fall back to member count
      // for pre-Slice-2 sessions that only carry members_of_llc
      const detectedType = (fd.entity_type as string | undefined) ??
        (fd.members_of_llc === "1" || fd.members_of_llc === "SINGLE_MEMBER_LLC"
          ? "SINGLE_MEMBER_LLC"
          : "");
      const isLlc   = fd.legal_structure === "LLC";
      const isSmllc = isLlc && detectedType === "SINGLE_MEMBER_LLC";
      const isMmllc = isLlc && detectedType === "MULTI_MEMBER_LLC";
      if (!isSmllc && !isMmllc) {
        redirect("/irs/ein/apply/additional-details/coming-soon");
      }
      if (isMmllc) resolvedType = "MULTI_MEMBER_LLC";
    }
  }

  // ── 3. Load HTML chrome ──────────────────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/irs/wizard-step-4.html"),
    "utf-8",
  );
  const bodyMatch   = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  // ── 4. Load and extract JSON schema (server-side only) ───────────────────
  const raw    = readFileSync(
    join(process.cwd(), "irs-captures/json/ein__additionalDetails.json"),
    "utf-8",
  );
  const schema = JSON.parse(raw);

  // Helper: get nested key
  function g(path: string): unknown {
    return path.split(".").reduce((acc: unknown, k: string) => {
      return acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined;
    }, schema);
  }

  // ── 5. Build serialized schema for SMLLC ────────────────────────────────
  // entityName sources (HR#1 — verbatim from captured artifacts):
  //   SMLLC → verbatim from Additional Details 1 HTML capture (Slice 1)
  //   MMLLC → irs-captures/json/ein__glossary.json → glossaryTerms.multiMemberLLC.title
  const config             = ENTITY_CONFIG[resolvedType] ?? ENTITY_CONFIG.SINGLE_MEMBER_LLC!;
  const entityName         = config.entityName;
  const tellUsAboutOrgLabel = config.tellUsAboutOrgLabel;

  function substituteEntityName(fieldName: string): string {
    return fieldName
      .replace(/\{\{entityName\}\}/g, entityName)
      .replace(/\{\{tellUsAboutOrgLabel\}\}/g, tellUsAboutOrgLabel);
  }

  // Deep-clone and substitute entity name placeholders in field defs
  function extractFieldDef(path: string) {
    const raw = JSON.parse(JSON.stringify(g(path)));
    raw.fieldName = substituteEntityName(raw.fieldName ?? "");
    return raw;
  }

  const formSchema: AdditionalDetailsSchema = {
    // Section headers
    tellUsAboutSubHeader: {
      title: substituteEntityName(
        (g("tellUsAboutOrg.subHeader") as { title: string }).title
      ),
    },
    tellUsMoreSubHeader: {
      title: substituteEntityName(
        (g("tellUsMoreAboutSection.subHeader") as { title: string }).title
      ),
    },
    describeEmpSubHeader: {
      title: (g("describeYourEmployeesSection.subHeader") as { title: string }).title,
    },

    // Section 1 field defs
    legalNameFieldDef:     extractFieldDef(`tellUsAboutOrg.${config.legalNameKey}`),
    dbaFieldDef:           extractFieldDef("tellUsAboutOrg.dbaNameInputControl"),
    countyFieldDef:        extractFieldDef("tellUsAboutOrg.countyInputControl"),
    stateLocationFieldDef: extractFieldDef("tellUsAboutOrg.stateLocationInputControl"),
    stateArticlesFieldDef: extractFieldDef("tellUsAboutOrg.stateArticlesOrganizationFiledInputControl"),
    startDateLabelDef: {
      fieldName:      substituteEntityName(
        (g("tellUsAboutOrg.defaultStartDate") as { fieldName: string }).fieldName
      ),
      additionalText: (g("tellUsAboutOrg.defaultStartDate") as { additionalText: string[] }).additionalText,
    },
    startMonthFieldDef: extractFieldDef("tellUsAboutOrg.startMonthInputControl"),
    startYearFieldDef:  extractFieldDef("tellUsAboutOrg.startYearInputControl"),

    // Section 2 field defs
    highwayVehicleFieldDef:     extractFieldDef("tellUsMoreAboutSection.ownHighwayVehicleInputControl"),
    gamblingFieldDef:           extractFieldDef("tellUsMoreAboutSection.involveGamblingInputControl"),
    fileForm720FieldDef:        extractFieldDef("tellUsMoreAboutSection.fileForm720InputControl"),
    atfFieldDef:                extractFieldDef("tellUsMoreAboutSection.sellAtfInputControl"),
    employeesQuestionFieldDef:  extractFieldDef("tellUsMoreAboutSection.provideW2FormInputControl"),

    // Section 3 (W4b) field defs
    firstPayDateInstructions: g("describeYourEmployeesSection.instructions5") as {
      title: string; additionalText: string[];
    },
    firstPayMonthFieldDef:   extractFieldDef("describeYourEmployeesSection.firstPayMonthInputControl"),
    firstPayYearFieldDef:    extractFieldDef("describeYourEmployeesSection.firstPayYearInputControl"),
    empCountInstructions:    g("describeYourEmployeesSection.instructions6") as {
      title: string; additionalText: string[]; inputErrorMessages?: Array<{text: string; id: string}>;
    },
    agEmployeesFieldDef:     extractFieldDef("describeYourEmployeesSection.numOfAgriculturalEmployeesInputControl"),
    otherEmployeesFieldDef:  extractFieldDef("describeYourEmployeesSection.numOfOtherEmployeesInputControl"),
    taxLiabilityFieldDef:    extractFieldDef("describeYourEmployeesSection.employeeTaxLiabilityInputControl"),

    // Final section
    reviewFieldDef: extractFieldDef("finalSection.reviewInputControl"),

    // Helptip defs — all sourced from JSON keys
    dbaHelptip:            g("dbaNameHelp")                 as typeof formSchema["dbaHelptip"],
    articlesHelptip:       g("articlesOfOrganizationHelp")  as typeof formSchema["articlesHelptip"],
    startMonthHelptip:     g("startMonthHelp")              as typeof formSchema["startMonthHelptip"],
    highwayVehicleHelptip: g("ownHighwayVehicleHelp")       as typeof formSchema["highwayVehicleHelptip"],
    gamblingHelptip:       g("involveGamblingHelp")         as typeof formSchema["gamblingHelptip"],
    fileForm720Helptip:    g("fileForm720Help")             as typeof formSchema["fileForm720Helptip"],
    employeesHelptip:      g("provideW2FormHelp")           as typeof formSchema["employeesHelptip"],
    maxEmployeesHelptip:   g("maxEmployeesHelp")            as typeof formSchema["maxEmployeesHelptip"],
    agEmployeesHelptip:    g("numOfAgriculturalEmployeesHelp") as typeof formSchema["agEmployeesHelptip"],
    otherEmployeesHelptip: g("numOfOtherEmployeesHelp")     as typeof formSchema["otherEmployeesHelptip"],
    firstPayDateHelptip:   g("firstWagesPaidDateHelp")      as typeof formSchema["firstPayDateHelptip"],
    taxLiabilityHelptip:   g("employeeLessThan1000Help")    as typeof formSchema["taxLiabilityHelptip"],
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" crossOrigin="" href="/irs/page-w0/index-D-QGvqqz.css" />

      {/* Tailwind Preflight + body-display fix + SVG external-icon fix + helptip inline fix
          Verbatim from W0–W3 page.tsx */}
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
        /* Start date inputs side-by-side — match _startDateInputs_im0vm_49 layout */
        ._startDateInputs_im0vm_49 {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        ._startDateInputs_im0vm_49 > * {
          flex: 1;
        }
      `}</style>

      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />

      {/* Portal: renders into #w4-form-portal inside the IRS chrome */}
      <AdditionalDetailsForm schema={formSchema} />
    </>
  );
}
