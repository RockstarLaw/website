/**
 * IRS EIN Wizard Step 4 — Additional Details (Phase IRS-W4a, Slice 1)
 *
 * 1:1 clone of the IRS sa.www4.irs.gov/applyein/additionalDetails page.
 * HTML chrome stored at public/irs/wizard-step-4.html.
 * Interactive form rendered by <AdditionalDetailsForm /> client component,
 * portaled into #w4-form-portal.
 *
 * Scope: all entity types with an ENTITY_CONFIG entry.
 *   Gate: ENTITY_CONFIG[resolvedType] defined — any missing key falls through to /coming-soon.
 *   resolvedType = entity_type ?? legal_structure ?? "" from form_data.
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

  // ── 2. Entity-type resolution + gate ────────────────────────────────────
  // Default for unauthenticated / direct navigation — SMLLC chrome shown
  let resolvedType = "SINGLE_MEMBER_LLC";

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
      // Resolution order (Slice 5):
      //   1. entity_type — set by W1 actions.ts for LLC sub-types (SMLLC/MMLLC)
      //      and for sub-type selections when W1 sub-sections ship (Slice 5b)
      //   2. legal_structure — for entity types whose W1 selection IS the final type
      //      (SOLE_PROPRIETOR, PARTNERSHIP, CORPORATION, ESTATE, ALL_OTHERS_TRUST, etc.)
      //   3. LLC member-count fallback — pre-Slice-2 sessions
      const detectedType =
        (fd.entity_type as string | undefined) ??
        (fd.legal_structure as string | undefined) ??
        (fd.members_of_llc === "1" ? "SINGLE_MEMBER_LLC" : "");

      if (!ENTITY_CONFIG[detectedType]) {
        // No config entry for this type yet — coming-soon
        redirect("/irs/ein/apply/additional-details/coming-soon");
      }
      resolvedType = detectedType;
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

  // ── 5a. Forbidden legalName endings — verbatim port of ka() from index-ChwXuGQH.js ──
  // ka() takes the entity type and returns the list of uppercased suffixes that must NOT
  // appear at the end of a trimmed+uppercased legal name (legalName Rule 2).
  function getLegalNameForbiddenEndings(entityType: string): string[] {
    if (entityType === "SINGLE_MEMBER_LLC")   return ["CORP", "INC", "PA"];
    if (entityType === "MULTI_MEMBER_LLC")    return ["CORP", "INC"];
    if (
      entityType === "CORPORATION"              ||
      entityType === "PERSONAL_SERVICE_CORPORATION" ||
      entityType === "SCORP"                    ||
      entityType === "HOA"                      ||
      entityType === "POLITICAL_ORGANIZATION"   ||
      entityType === "REIT"                     ||
      entityType === "RIC"                      ||
      entityType === "REMIC"                    ||
      entityType === "SETTLEMENT_FUND"
    ) return ["LLC", "PLLC", "LC"];
    if (
      // ke.isTrustType()
      entityType === "CHARITABLE_LEAD_ANNUITY_TRUST"      ||
      entityType === "CHARITABLE_LEAD_UNITRUST"           ||
      entityType === "CHARITABLE_REMAINDER_ANNUITY_TRUST" ||
      entityType === "CHARITABLE_REMAINDER_UNITRUST"      ||
      entityType === "IRREVOCABLE_TRUST"                  ||
      entityType === "POOLED_INCOME_FUND"                 ||
      entityType === "FUNERAL_TRUST"                      ||
      entityType === "REVOCABLE_TRUST"                    ||
      entityType === "ALL_OTHERS_TRUST"                   ||
      // O.EMPLOYER_PLAN, O.FNMA, O.GNMA, O.OTHER_NON_PROFIT
      entityType === "EMPLOYER_PLAN"                      ||
      entityType === "FNMA"                               ||
      entityType === "GNMA"                               ||
      entityType === "OTHER_NON_PROFIT"                   ||
      // ke.isOther()
      entityType === "SOCIAL_SAVINGS_CLUB"                ||
      entityType === "BLOCK_OR_TENANT_ASSOCIATION"        ||
      entityType === "SPORTS_TEAM"                        ||
      entityType === "PTA_OR_PTO_SCHOOL_ORG"              ||
      entityType === "MEMORIAL_SCHOLARSHIP"               ||
      entityType === "COMMUNITY_OR_VOLUNTEER_GROUP"
    ) return ["CORP", "LLC", "PLLC", "LC", "INC", "PA"];
    if (entityType === "PARTNERSHIP" || entityType === "JOINT_VENTURE")
      return ["CORP", "LLC", "PLLC", "LC", "INC"];
    // SOLE_PROPRIETOR, HOUSEHOLD_EMPLOYER, ESTATE, CONSERVATORSHIP, CUSTODIANSHIP,
    // GUARDIANSHIP, BANKRUPTCY, RECEIVERSHIP, etc. — not in any ka() branch → no forbidden endings
    return [];
  }

  // ── 5. Build serialized schema driven by entity config ──────────────────
  // entityName / tellUsAboutOrgLabel: per-entity strings from additionalDetailsConfig.ts
  // (shared:entityTypes namespace not captured; IRS SS-4 + Pub 1635 gap-fill per HR#1)
  const config              = ENTITY_CONFIG[resolvedType] ?? ENTITY_CONFIG.SINGLE_MEMBER_LLC!;
  const entityName          = config.entityName;
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

  // stateArticles key: isLlcType → Org variant; isCorpType → Inc variant; else null
  const stateArticlesPath = config.stateArticlesKey
    ? `tellUsAboutOrg.${config.stateArticlesKey}`
    : null;

  // articles helptip: Org variant for LLC types, Inc variant for Corp types, null otherwise
  const articlesHelptipKey = config.stateArticlesKey === "stateArticlesOrganizationFiledInputControl"
    ? "articlesOfOrganizationHelp"
    : config.stateArticlesKey === "stateArticlesIncorporationFiledInputControl"
      ? "articlesOfIncorporationHelp"
      : null;

  const formSchema: AdditionalDetailsSchema = {
    // ── Gating flags ────────────────────────────────────────────────────────────────────
    showDba:                 config.showDba,
    showTruckingGamblingAtf: config.showTruckingGamblingAtf,
    showClosingMonth:        config.showClosingMonth,
    showHouseholdEmployees:  config.showHouseholdEmployees,

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
    dbaFieldDef:           extractFieldDef(`tellUsAboutOrg.${config.dbaKey}`),
    countyFieldDef:        extractFieldDef(`tellUsAboutOrg.${config.countyKey}`),
    stateLocationFieldDef: extractFieldDef(`tellUsAboutOrg.${config.stateLocationKey}`),
    stateArticlesFieldDef: stateArticlesPath ? extractFieldDef(stateArticlesPath) : null,
    closingMonthFieldDef:  config.showClosingMonth
      ? extractFieldDef("tellUsAboutOrg.closingMonthInputControl")
      : null,
    startDateLabelDef: {
      fieldName:      substituteEntityName(
        (g(`tellUsAboutOrg.${config.startDateLabelKey}`) as { fieldName: string }).fieldName
      ),
      additionalText: (g(`tellUsAboutOrg.${config.startDateLabelKey}`) as { additionalText: string[] }).additionalText,
    },
    startMonthFieldDef: extractFieldDef("tellUsAboutOrg.startMonthInputControl"),
    startYearFieldDef:  extractFieldDef("tellUsAboutOrg.startYearInputControl"),

    // Section 2 field defs
    highwayVehicleFieldDef:    extractFieldDef("tellUsMoreAboutSection.ownHighwayVehicleInputControl"),
    gamblingFieldDef:          extractFieldDef("tellUsMoreAboutSection.involveGamblingInputControl"),
    fileForm720FieldDef:       extractFieldDef("tellUsMoreAboutSection.fileForm720InputControl"),
    atfFieldDef:               extractFieldDef("tellUsMoreAboutSection.sellAtfInputControl"),
    // employees question: config-driven variant; null when ma()=false
    employeesQuestionFieldDef: config.employeesQuestionKey
      ? extractFieldDef(`tellUsMoreAboutSection.${config.employeesQuestionKey}`)
      : null,

    // Section 3 (W4b) field defs
    firstPayDateInstructions: g("describeYourEmployeesSection.instructions5") as {
      title: string; additionalText: string[];
    },
    firstPayMonthFieldDef:   extractFieldDef("describeYourEmployeesSection.firstPayMonthInputControl"),
    firstPayYearFieldDef:    extractFieldDef("describeYourEmployeesSection.firstPayYearInputControl"),
    empCountInstructions:    g("describeYourEmployeesSection.instructions6") as {
      title: string; additionalText: string[]; inputErrorMessages?: Array<{text: string; id: string}>;
    },
    agEmployeesFieldDef:          extractFieldDef("describeYourEmployeesSection.numOfAgriculturalEmployeesInputControl"),
    householdEmployeesFieldDef:   extractFieldDef("describeYourEmployeesSection.numOfHouseholdEmployeesInputControl"),
    otherEmployeesFieldDef:       extractFieldDef("describeYourEmployeesSection.numOfOtherEmployeesInputControl"),
    taxLiabilityFieldDef:    extractFieldDef("describeYourEmployeesSection.employeeTaxLiabilityInputControl"),

    // Final section
    reviewFieldDef: extractFieldDef("finalSection.reviewInputControl"),

    // Gating — legalName forbidden endings (Scope B, Slice 6)
    legalNameForbiddenEndings: getLegalNameForbiddenEndings(resolvedType),

    // Helptip defs
    dbaHelptip:            g("dbaNameHelp")                 as typeof formSchema["dbaHelptip"],
    articlesHelptip:       articlesHelptipKey
      ? g(articlesHelptipKey) as typeof formSchema["articlesHelptip"]
      : null as unknown as typeof formSchema["articlesHelptip"],
    startMonthHelptip:     g("startMonthHelp")              as typeof formSchema["startMonthHelptip"],
    highwayVehicleHelptip: g("ownHighwayVehicleHelp")       as typeof formSchema["highwayVehicleHelptip"],
    gamblingHelptip:       g("involveGamblingHelp")         as typeof formSchema["gamblingHelptip"],
    fileForm720Helptip:    g("fileForm720Help")             as typeof formSchema["fileForm720Helptip"],
    // employeesHelptip: null when haveEmployees variant (no helptip in JSON for that control)
    employeesHelptip:      config.employeesHelptipKey
      ? g(config.employeesHelptipKey) as typeof formSchema["employeesHelptip"]
      : null,
    maxEmployeesHelptip:   g("maxEmployeesHelp")            as typeof formSchema["maxEmployeesHelptip"],
    agEmployeesHelptip:        g("numOfAgriculturalEmployeesHelp") as typeof formSchema["agEmployeesHelptip"],
    householdEmployeesHelptip: g("numOfHouseholdEmployeesHelp")   as typeof formSchema["householdEmployeesHelptip"],
    otherEmployeesHelptip:     g("numOfOtherEmployeesHelp")       as typeof formSchema["otherEmployeesHelptip"],
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
