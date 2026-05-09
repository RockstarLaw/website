"use server";

/**
 * IRS EIN Wizard Step 5 — Activity & Services Server Action (Slice 7)
 *
 * submitActivityServices(formData: FormData) → void
 *
 * Called when the user clicks Continue on the Activity & Services step.
 * Requires auth.
 *
 * ── Fields persisted (key names mirror bundle's Ia() payload builder) ──────
 *
 * principalActivity       — primary category enum string (e.g. "CONSTRUCTION")
 * otherPrincipalActivity  — free-text label when category is OTHER or sub-type
 *                           requires it (e.g. "Consulting")
 * principalService        — sub-activity enum string (e.g. "INVESTMENT_ADVICE")
 * otherPrincipalService   — free-text when sub-activity is OTHER
 *
 * Source: bundle Ia() function in irs-captures/js/index-ChwXuGQH.js.
 *
 * ── Entity types with default principal activity (bypass W5) ─────────────
 * CHURCH / CHURCH_CONTROLLED_ORGANIZATION → principalActivity=OTHER, "Faith Based Org"
 * HOUSEHOLD_EMPLOYER                      → principalActivity=OTHER, "Household Emp"
 * EMPLOYER_OR_FISCAL_AGENT                → principalActivity=OTHER, "Payroll Services"
 * POLITICAL_ORGANIZATION                  → principalActivity=OTHER, "Political Org"
 * HOA / ESCROW                            → principalActivity=REAL_ESTATE, "Real Estate"
 * (These entity types are auto-routed in page.tsx and should not reach this action.)
 *
 * On success: merges into ein_applications.form_data, advances current_step
 * to "review_and_submit", redirects to /irs/ein/apply/review-and-submit
 * (W6 — will 404 until Slice 8 ships).
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Valid primary activity values — from bundle enum `ie` in index-ChwXuGQH.js
const VALID_PRIMARY_ACTIVITIES = new Set([
  "ACCOMMODATIONS",
  "CONSTRUCTION",
  "FINANCE",
  "FOOD_SERVICE",
  "HEALTH_CARE",
  "INSURANCE",
  "MANUFACTURING",
  "REAL_ESTATE",
  "RENTAL_LEASING",
  "RETAIL",
  "SOCIAL_ASSISTANCE",
  "TRANSPORTATION",
  "WAREHOUSING",
  "WHOLESALE",
  "OTHER",
]);

// Sub-activity values that require otherPrincipalService free-text
// Source: Ia() function — cases where l.principalService is set to "OTHER"
// and otherPrincipalService is populated from a text input
const SERVICE_REQUIRES_TEXT = new Set(["OTHER"]);

export async function submitActivityServices(formData: FormData): Promise<void> {
  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 2. Extract fields ─────────────────────────────────────────────────────
  const primaryActivity = formData.get("primaryActivity")?.toString()?.trim() ?? "";

  // Sub-activity inputs — only one set will be populated per primary selection
  const accommSub       = formData.get("accommSub")?.toString()?.trim()       ?? "";
  const accommOther     = formData.get("accommOther")?.toString()?.trim()      ?? "";

  const constFirst      = formData.get("constFirst")?.toString()?.trim()       ?? "";
  const constOtherText  = formData.get("constOtherText")?.toString()?.trim()   ?? "";
  const constThird      = formData.get("constThird")?.toString()?.trim()       ?? "";
  const constFourthText = formData.get("constFourthText")?.toString()?.trim()  ?? "";
  const constFifthText  = formData.get("constFifthText")?.toString()?.trim()   ?? "";

  const financeSub      = formData.get("financeSub")?.toString()?.trim()       ?? "";
  const financeOther    = formData.get("financeOther")?.toString()?.trim()      ?? "";

  const foodSub         = formData.get("foodSub")?.toString()?.trim()          ?? "";
  const foodOther       = formData.get("foodOther")?.toString()?.trim()        ?? "";

  const healthFirst     = formData.get("healthFirst")?.toString()?.trim()      ?? "";
  const healthYesSub    = formData.get("healthYesSub")?.toString()?.trim()     ?? "";
  const healthYesOther  = formData.get("healthYesOther")?.toString()?.trim()   ?? "";
  const healthNoSub     = formData.get("healthNoSub")?.toString()?.trim()      ?? "";
  const healthNoOther   = formData.get("healthNoOther")?.toString()?.trim()    ?? "";

  const insuranceSub    = formData.get("insuranceSub")?.toString()?.trim()     ?? "";
  const insuranceOther  = formData.get("insuranceOther")?.toString()?.trim()   ?? "";

  const mfgText         = formData.get("mfgText")?.toString()?.trim()          ?? "";

  const reSub           = formData.get("reSub")?.toString()?.trim()            ?? "";
  const reRentalSub     = formData.get("reRentalSub")?.toString()?.trim()      ?? "";
  const reRentalOther   = formData.get("reRentalOther")?.toString()?.trim()    ?? "";
  const reOtherText     = formData.get("reOtherText")?.toString()?.trim()      ?? "";

  const rentalSub       = formData.get("rentalSub")?.toString()?.trim()        ?? "";
  const rentalThird     = formData.get("rentalThird")?.toString()?.trim()      ?? "";
  const rentalOtherText = formData.get("rentalOtherText")?.toString()?.trim()  ?? "";

  const retailSub       = formData.get("retailSub")?.toString()?.trim()        ?? "";
  const retailStorefront = formData.get("retailStorefront")?.toString()?.trim() ?? "";
  const retailDirect    = formData.get("retailDirect")?.toString()?.trim()     ?? "";
  const retailOther     = formData.get("retailOther")?.toString()?.trim()      ?? "";

  const socialSub       = formData.get("socialSub")?.toString()?.trim()        ?? "";
  const socialOther     = formData.get("socialOther")?.toString()?.trim()      ?? "";

  const transSub        = formData.get("transSub")?.toString()?.trim()         ?? "";
  const transCargoSub   = formData.get("transCargoSub")?.toString()?.trim()    ?? "";
  const transCargoOther = formData.get("transCargoOther")?.toString()?.trim()  ?? "";
  const transPassSub    = formData.get("transPassSub")?.toString()?.trim()     ?? "";
  const transPassOther  = formData.get("transPassOther")?.toString()?.trim()   ?? "";
  const transSupportText = formData.get("transSupportText")?.toString()?.trim() ?? "";

  const wholesaleFirst  = formData.get("wholesaleFirst")?.toString()?.trim()   ?? "";
  const wholesaleAgText = formData.get("wholesaleAgText")?.toString()?.trim()  ?? "";
  const wholesaleThird  = formData.get("wholesaleThird")?.toString()?.trim()   ?? "";
  const wholesaleFourth = formData.get("wholesaleFourth")?.toString()?.trim()  ?? "";

  const otherSub        = formData.get("otherSub")?.toString()?.trim()         ?? "";
  const otherConsultYN  = formData.get("otherConsultYN")?.toString()?.trim()   ?? "";
  const otherConsultType = formData.get("otherConsultType")?.toString()?.trim() ?? "";
  const otherConsultActivity = formData.get("otherConsultActivity")?.toString()?.trim() ?? "";
  const otherMfgText    = formData.get("otherMfgText")?.toString()?.trim()     ?? "";
  const otherOrgSub     = formData.get("otherOrgSub")?.toString()?.trim()      ?? "";
  const otherOrgOther   = formData.get("otherOrgOther")?.toString()?.trim()    ?? "";
  const otherRentalSub  = formData.get("otherRentalSub")?.toString()?.trim()   ?? "";
  const otherRentalReSub = formData.get("otherRentalReSub")?.toString()?.trim() ?? "";
  const otherRentalGoods = formData.get("otherRentalGoods")?.toString()?.trim() ?? "";
  const otherRepairText = formData.get("otherRepairText")?.toString()?.trim()  ?? "";
  const otherSellSub    = formData.get("otherSellSub")?.toString()?.trim()     ?? "";
  const otherServiceText = formData.get("otherServiceText")?.toString()?.trim() ?? "";
  const otherOtherText  = formData.get("otherOtherText")?.toString()?.trim()   ?? "";

  // ── 3. Validate primary activity ─────────────────────────────────────────
  if (!primaryActivity || !VALID_PRIMARY_ACTIVITIES.has(primaryActivity)) {
    redirect("/irs/ein/apply/activity-and-services");
  }

  // ── 4. Derive principalActivity / otherPrincipalActivity /
  //        principalService / otherPrincipalService
  //       (Mirrors Ia() in index-ChwXuGQH.js) ──────────────────────────────
  let principalActivity       = primaryActivity;
  let otherPrincipalActivity  = "";
  let principalService        = "";
  let otherPrincipalService   = "";

  switch (primaryActivity) {
    case "ACCOMMODATIONS": {
      if (!accommSub) redirect("/irs/ein/apply/activity-and-services");
      if (accommSub === "CASINO" || accommSub === "HOTEL" || accommSub === "MOTEL") {
        principalService = accommSub;
      } else {
        // OTHER
        if (!accommOther) redirect("/irs/ein/apply/activity-and-services");
        principalService       = "OTHER";
        otherPrincipalService  = accommOther;
      }
      break;
    }

    case "CONSTRUCTION": {
      if (!constFirst) redirect("/irs/ein/apply/activity-and-services");
      if (constFirst === "OTHER") {
        if (!constOtherText) redirect("/irs/ein/apply/activity-and-services");
        principalService      = "OTHER";
        otherPrincipalService = constOtherText;
      } else {
        // constFirst === "NO"
        if (!constThird) redirect("/irs/ein/apply/activity-and-services");
        if (constThird === "RESIDENTIAL_CONSTRUCTION" || constThird === "RESIDENTIAL_REMODELING") {
          principalService = constThird;
        } else if (constThird === "3") {
          if (!constFourthText) redirect("/irs/ein/apply/activity-and-services");
          principalService      = "OTHER";
          otherPrincipalService = constFourthText;
        } else if (constThird === "4") {
          if (!constFifthText) redirect("/irs/ein/apply/activity-and-services");
          principalService      = "OTHER";
          otherPrincipalService = constFifthText;
        } else {
          redirect("/irs/ein/apply/activity-and-services");
        }
      }
      break;
    }

    case "FINANCE": {
      if (!financeSub) redirect("/irs/ein/apply/activity-and-services");
      if (financeSub === "OTHER") {
        if (!financeOther) redirect("/irs/ein/apply/activity-and-services");
        principalService      = "OTHER";
        otherPrincipalService = financeOther;
      } else {
        principalService = financeSub;
      }
      break;
    }

    case "FOOD_SERVICE": {
      if (!foodSub) redirect("/irs/ein/apply/activity-and-services");
      if (foodSub === "OTHER") {
        if (!foodOther) redirect("/irs/ein/apply/activity-and-services");
        principalService      = "OTHER";
        otherPrincipalService = foodOther;
      } else {
        principalService = foodSub;
      }
      break;
    }

    case "HEALTH_CARE": {
      if (!healthFirst) redirect("/irs/ein/apply/activity-and-services");
      if (healthFirst === "yes") {
        if (!healthYesSub) redirect("/irs/ein/apply/activity-and-services");
        if (healthYesSub === "OTHER") {
          if (!healthYesOther) redirect("/irs/ein/apply/activity-and-services");
          principalService      = "OTHER";
          otherPrincipalService = healthYesOther;
        } else {
          principalService = healthYesSub;
        }
      } else {
        // healthFirst === "no"
        if (!healthNoSub) redirect("/irs/ein/apply/activity-and-services");
        if (healthNoSub === "10") {
          if (!healthNoOther) redirect("/irs/ein/apply/activity-and-services");
          principalService      = "OTHER";
          otherPrincipalService = healthNoOther;
        } else if (healthNoSub === "11") {
          if (!healthNoOther) redirect("/irs/ein/apply/activity-and-services");
          principalService      = "OTHER";
          otherPrincipalService = healthNoOther;
        } else {
          principalService = healthNoSub;
        }
      }
      break;
    }

    case "INSURANCE": {
      if (!insuranceSub) redirect("/irs/ein/apply/activity-and-services");
      if (insuranceSub === "OTHER") {
        if (!insuranceOther) redirect("/irs/ein/apply/activity-and-services");
        principalService      = "OTHER";
        otherPrincipalService = insuranceOther;
      } else {
        principalService      = insuranceSub;
        otherPrincipalService = "";
      }
      break;
    }

    case "MANUFACTURING": {
      if (!mfgText) redirect("/irs/ein/apply/activity-and-services");
      principalService      = "OTHER";
      otherPrincipalService = mfgText;
      break;
    }

    case "REAL_ESTATE": {
      if (!reSub) redirect("/irs/ein/apply/activity-and-services");
      if (reSub === "RENTAL_PROPERTY") {
        if (!reRentalSub) redirect("/irs/ein/apply/activity-and-services");
        if (reRentalSub === "OTHER") {
          if (!reRentalOther) redirect("/irs/ein/apply/activity-and-services");
          principalService      = "OTHER";
          otherPrincipalService = reRentalOther;
        } else {
          principalService = reRentalSub;
        }
      } else if (reSub === "CAPITAL_PROVIDER") {
        // Reuses construction sub-flow
        if (!constFirst) redirect("/irs/ein/apply/activity-and-services");
        principalActivity = "CONSTRUCTION";
        if (constFirst === "OTHER") {
          if (!constOtherText) redirect("/irs/ein/apply/activity-and-services");
          principalService      = "OTHER";
          otherPrincipalService = constOtherText;
        } else {
          if (!constThird) redirect("/irs/ein/apply/activity-and-services");
          if (constThird === "RESIDENTIAL_CONSTRUCTION" || constThird === "RESIDENTIAL_REMODELING") {
            principalService = constThird;
          } else if (constThird === "3") {
            if (!constFourthText) redirect("/irs/ein/apply/activity-and-services");
            principalService      = "OTHER";
            otherPrincipalService = constFourthText;
          } else if (constThird === "4") {
            if (!constFifthText) redirect("/irs/ein/apply/activity-and-services");
            principalService      = "OTHER";
            otherPrincipalService = constFifthText;
          } else {
            redirect("/irs/ein/apply/activity-and-services");
          }
        }
      } else if (reSub === "OTHER") {
        if (!reOtherText) redirect("/irs/ein/apply/activity-and-services");
        principalService      = "OTHER";
        otherPrincipalService = reOtherText;
      } else {
        principalService = reSub;
      }
      break;
    }

    case "RENTAL_LEASING": {
      if (!rentalSub) redirect("/irs/ein/apply/activity-and-services");
      if (rentalSub === "OTHER") {
        if (!rentalOtherText) redirect("/irs/ein/apply/activity-and-services");
        principalActivity     = "RENTAL_LEASING";
        principalService      = "OTHER";
        otherPrincipalService = rentalOtherText;
      } else if (rentalSub === "REAL_ESTATE") {
        if (!rentalThird) redirect("/irs/ein/apply/activity-and-services");
        principalActivity = "REAL_ESTATE";
        principalService  = rentalThird;
      } else {
        principalActivity = "REAL_ESTATE";
        principalService  = rentalSub;
      }
      break;
    }

    case "RETAIL": {
      if (!retailSub) redirect("/irs/ein/apply/activity-and-services");
      if (retailSub === "STOREFRONT") {
        if (!retailStorefront) redirect("/irs/ein/apply/activity-and-services");
        principalService      = "STOREFRONT";
        otherPrincipalService = retailStorefront;
      } else if (retailSub === "DIRECT_SALES") {
        if (!retailDirect) redirect("/irs/ein/apply/activity-and-services");
        principalService      = "DIRECT_SALES";
        otherPrincipalService = retailDirect;
      } else if (retailSub === "OTHER") {
        if (!retailOther) redirect("/irs/ein/apply/activity-and-services");
        principalService      = "OTHER";
        otherPrincipalService = retailOther;
      } else {
        principalService = retailSub; // INTERNET, AUCTION_HOUSE
      }
      break;
    }

    case "SOCIAL_ASSISTANCE": {
      if (!socialSub) redirect("/irs/ein/apply/activity-and-services");
      if (socialSub === "OTHER") {
        if (!socialOther) redirect("/irs/ein/apply/activity-and-services");
        principalService      = "OTHER";
        otherPrincipalService = socialOther;
      } else {
        principalService = socialSub;
      }
      break;
    }

    case "TRANSPORTATION": {
      if (!transSub) redirect("/irs/ein/apply/activity-and-services");
      if (transSub === "CARGO") {
        if (!transCargoSub) redirect("/irs/ein/apply/activity-and-services");
        principalService      = transCargoSub;
        otherPrincipalService = transCargoSub === "OTHER" ? transCargoOther : "";
        if (transCargoSub === "OTHER" && !transCargoOther) redirect("/irs/ein/apply/activity-and-services");
      } else if (transSub === "PASSENGER") {
        if (!transPassSub) redirect("/irs/ein/apply/activity-and-services");
        principalService      = transPassSub;
        otherPrincipalService = transPassSub === "OTHER" ? transPassOther : "";
        if (transPassSub === "OTHER" && !transPassOther) redirect("/irs/ein/apply/activity-and-services");
      } else {
        // OTHER → support activity
        principalService      = transSub;
        otherPrincipalService = transSupportText;
      }
      break;
    }

    case "WAREHOUSING": {
      principalService = "WAREHOUSING";
      break;
    }

    case "WHOLESALE": {
      if (!wholesaleFirst) redirect("/irs/ein/apply/activity-and-services");
      if (wholesaleFirst === "yes") {
        if (!wholesaleAgText) redirect("/irs/ein/apply/activity-and-services");
        principalService      = "OTHER";
        otherPrincipalService = wholesaleAgText;
      } else {
        // wholesaleFirst === "no"
        if (!wholesaleThird) redirect("/irs/ein/apply/activity-and-services");
        if (wholesaleThird === "yes") {
          principalService = "WHOLESALE_AGENT";
        } else {
          if (!wholesaleFourth) redirect("/irs/ein/apply/activity-and-services");
          principalService      = "OTHER";
          otherPrincipalService = wholesaleFourth;
        }
      }
      break;
    }

    case "OTHER": {
      if (!otherSub) redirect("/irs/ein/apply/activity-and-services");
      if (otherSub === "CONSULTING") {
        if (!otherConsultYN) redirect("/irs/ein/apply/activity-and-services");
        otherPrincipalActivity = "Consulting";
        principalService       = "OTHER";
        if (otherConsultYN === "yes") {
          if (!otherConsultType) redirect("/irs/ein/apply/activity-and-services");
          otherPrincipalService = otherConsultType;
        } else {
          if (!otherConsultActivity) redirect("/irs/ein/apply/activity-and-services");
          otherPrincipalService = otherConsultActivity;
        }
      } else if (otherSub === "MANUFACTURING") {
        if (!otherMfgText) redirect("/irs/ein/apply/activity-and-services");
        principalActivity     = "MANUFACTURING";
        principalService      = "OTHER";
        otherPrincipalService = otherMfgText;
      } else if (otherSub === "ORGANIZATION") {
        if (!otherOrgSub) redirect("/irs/ein/apply/activity-and-services");
        principalService = "OTHER";
        if (otherOrgSub === "athletic") {
          otherPrincipalActivity = "Athletic Org";
          otherPrincipalService  = otherOrgOther;
        } else if (otherOrgSub === "conservation") {
          otherPrincipalActivity = "Conservation";
          otherPrincipalService  = otherOrgOther;
        } else if (otherOrgSub === "environmental") {
          otherPrincipalActivity = "Environmental";
          otherPrincipalService  = otherOrgOther;
        } else if (otherOrgSub === "fundraising") {
          otherPrincipalActivity = "Fundraising";
          otherPrincipalService  = otherOrgOther;
        } else if (otherOrgSub === "hoa") {
          otherPrincipalActivity = "Organization";
          otherPrincipalService  = "Homeowners Association";
        } else if (otherOrgSub === "religious") {
          otherPrincipalActivity = "Religious Organization";
          otherPrincipalService  = otherOrgOther;
        } else if (otherOrgSub === "socialCivic") {
          otherPrincipalActivity = "Social Organization";
          otherPrincipalService  = otherOrgOther;
        } else {
          otherPrincipalActivity = "Organization";
          otherPrincipalService  = otherOrgOther;
        }
        if (otherOrgSub !== "hoa" && !otherOrgOther) redirect("/irs/ein/apply/activity-and-services");
      } else if (otherSub === "RENTAL") {
        if (!otherRentalSub) redirect("/irs/ein/apply/activity-and-services");
        if (otherRentalSub === "1") {
          // Real estate
          if (!otherRentalReSub) redirect("/irs/ein/apply/activity-and-services");
          principalActivity = "REAL_ESTATE";
          principalService  = otherRentalReSub;
        } else {
          // Goods
          if (!otherRentalGoods) redirect("/irs/ein/apply/activity-and-services");
          principalActivity     = "RENTAL_LEASING";
          principalService      = "OTHER";
          otherPrincipalService = otherRentalGoods;
        }
      } else if (otherSub === "REPAIR") {
        if (!otherRepairText) redirect("/irs/ein/apply/activity-and-services");
        otherPrincipalActivity = "Repair";
        principalService       = "OTHER";
        otherPrincipalService  = otherRepairText;
      } else if (otherSub === "GOODS_SELLER") {
        if (!otherSellSub) redirect("/irs/ein/apply/activity-and-services");
        if (otherSellSub === "1") {
          // Retail sub-flow
          if (!retailSub) redirect("/irs/ein/apply/activity-and-services");
          principalActivity = "RETAIL";
          principalService  = retailSub;
          if (retailSub === "STOREFRONT") {
            if (!retailStorefront) redirect("/irs/ein/apply/activity-and-services");
            otherPrincipalService = retailStorefront;
          } else if (retailSub === "DIRECT_SALES") {
            if (!retailDirect) redirect("/irs/ein/apply/activity-and-services");
            otherPrincipalService = retailDirect;
          } else if (retailSub === "OTHER") {
            if (!retailOther) redirect("/irs/ein/apply/activity-and-services");
            otherPrincipalService = retailOther;
          }
        } else {
          // Wholesale sub-flow
          if (!wholesaleFirst) redirect("/irs/ein/apply/activity-and-services");
          principalActivity = "WHOLESALE";
          if (wholesaleFirst === "yes") {
            if (!wholesaleAgText) redirect("/irs/ein/apply/activity-and-services");
            principalService      = "OTHER";
            otherPrincipalService = wholesaleAgText;
          } else if (wholesaleThird === "yes") {
            principalService = "WHOLESALE_AGENT";
          } else {
            if (!wholesaleFourth) redirect("/irs/ein/apply/activity-and-services");
            principalService      = "OTHER";
            otherPrincipalService = wholesaleFourth;
          }
        }
      } else if (otherSub === "SERVICE") {
        if (!otherServiceText) redirect("/irs/ein/apply/activity-and-services");
        otherPrincipalActivity = "Service";
        principalService       = "OTHER";
        otherPrincipalService  = otherServiceText;
      } else if (otherSub === "OTHER") {
        if (!otherOtherText) redirect("/irs/ein/apply/activity-and-services");
        otherPrincipalActivity = "OTHER";
        principalService       = "OTHER";
        otherPrincipalService  = otherOtherText;
      } else {
        redirect("/irs/ein/apply/activity-and-services");
      }
      break;
    }

    default:
      redirect("/irs/ein/apply/activity-and-services");
  }

  // ── 5. Build payload ──────────────────────────────────────────────────────
  const activityPayload: Record<string, unknown> = {
    principalActivity,
    otherPrincipalActivity: otherPrincipalActivity || null,
    principalService,
    otherPrincipalService:  otherPrincipalService  || null,
  };

  // ── 6. Upsert ein_applications ────────────────────────────────────────────
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("ein_applications")
    .select("id, form_data")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    const merged = {
      ...(existing.form_data as Record<string, unknown>),
      ...activityPayload,
    };
    await admin
      .from("ein_applications")
      .update({
        current_step: "review_and_submit",
        form_data:    merged,
      })
      .eq("id", existing.id);
  } else {
    await admin.from("ein_applications").insert({
      user_id:      user.id,
      current_step: "review_and_submit",
      status:       "in_progress",
      form_data:    activityPayload,
    });
  }

  // ── 7. Advance to W6 — will 404 until Slice 8 ships ──────────────────────
  redirect("/irs/ein/apply/review-and-submit");
}
