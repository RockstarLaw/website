"use server";

/**
 * IRS EIN Wizard Step 4 — Additional Details Server Action (Phase IRS-W4a)
 *
 * submitAdditionalDetails(formData: FormData) → void
 *
 * Called when the user clicks Continue on the Additional Details step.
 * Requires auth — page is public, session persistence needs a user.
 *
 * Scope: SINGLE_MEMBER_LLC + MULTI_MEMBER_LLC (Slice 3 expands gate; field sets are identical).
 *
 * ── Fields persisted (key names match bundle's ol() payload builder) ────────
 *
 * Section 1 — Tell us about the LLC:
 *   legalName          (string, required)
 *   dbaName            (string | null — optional)
 *   county             (string, required)
 *   state              (string, required — state location)
 *   stateIncorporated  (string, required — state articles of organization filed)
 *   startMonth         (string, required — e.g. "JANUARY")
 *   startYear          (number, required)
 *
 * Section 2 — Tell us more:
 *   trucking           (boolean, required)
 *   gambling           (boolean, required)
 *   exciseTaxes        (boolean, required)
 *   atf                (boolean, required)
 *   w2Issuer           (boolean, required)
 *
 * Section 3 — Describe your employees (only when w2Issuer = true):
 *   w2Info.firstWagesPaidMonth  (string)
 *   w2Info.firstWagesPaidYear   (number)
 *   w2Info.agEmployeesCount     (number)
 *   w2Info.otherEmployeesCount  (number)
 *   w2Info.over1000TaxLiability (boolean — true when answer is "no" per bundle)
 *
 * Section 4 — Review:
 *   reviewConfirmed    (boolean, required = true)
 *
 * Validation strategy: server-side presence/type checks that mirror the
 * bundle's validation functions. Regex patterns from index-ChwXuGQH.js:
 *   legalNameDefaultPattern: /^.{0,69}$/
 *   tradeNamePattern:        /^.{0,34}$/
 *   countyPattern:           /^.{0,22}$/
 *   startYearPattern:        /^[0-9]{0,4}$/  (input filter; full validation below)
 *
 * On success: merges into ein_applications.form_data, advances current_step
 * to "review", redirects to /irs/ein/apply/review-and-submit
 * (W5 — will 404 until IRS-W5 ships).
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Valid month values (all-caps, from bundle)
const VALID_MONTHS = new Set([
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
]);

// Valid US state/territory values (stateTypes1 from choiceTypes.ts)
const VALID_STATES = new Set([
  "AK","AL","AR","AZ","CA","CO","CT","DE","DC","FL","GA","HI","ID",
  "IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO",
  "MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA",
  "RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "AS","FM","GU","MH","MP","PR","VI","AA","AP","AE",
]);

export async function submitAdditionalDetails(formData: FormData): Promise<void> {
  // ── 1. Auth check ────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 2. Extract fields ────────────────────────────────────────────────────
  const legalName        = formData.get("legalName")?.toString()?.trim()        ?? "";
  const dbaName          = formData.get("dbaName")?.toString()?.trim()          ?? "";
  const county           = formData.get("county")?.toString()?.trim()            ?? "";
  const state            = formData.get("state")?.toString()?.trim()             ?? "";
  const stateIncorporated = formData.get("stateIncorporated")?.toString()?.trim() ?? "";
  const startMonth       = formData.get("startMonth")?.toString()?.trim()        ?? "";
  const startYearStr     = formData.get("startYear")?.toString()?.trim()         ?? "";
  const trucking         = formData.get("trucking")?.toString()                  ?? "";
  const gambling         = formData.get("gambling")?.toString()                  ?? "";
  const exciseTaxes      = formData.get("exciseTaxes")?.toString()               ?? "";
  const atf              = formData.get("atf")?.toString()                       ?? "";
  const w2Issuer         = formData.get("w2Issuer")?.toString()                  ?? "";
  const reviewConfirmed  = formData.get("reviewConfirmed")?.toString()           ?? "";

  // W4b fields (only present when w2Issuer = "yes")
  const firstPayMonth          = formData.get("firstPayMonth")?.toString()?.trim()         ?? "";
  const firstPayYearStr        = formData.get("firstPayYear")?.toString()?.trim()           ?? "";
  const agEmployeesStr         = formData.get("numAgEmployees")?.toString()?.trim()         ?? "0";
  const householdEmployeesStr  = formData.get("numHouseholdEmployees")?.toString()?.trim()  ?? "0";
  const otherEmployeesStr      = formData.get("numOtherEmployees")?.toString()?.trim()      ?? "0";
  const taxLiability           = formData.get("taxLiability")?.toString()                   ?? "";

  // ── 3. Validate Section 1 ────────────────────────────────────────────────
  if (!legalName)              redirect("/irs/ein/apply/additional-details");
  if (legalName.length > 69)   redirect("/irs/ein/apply/additional-details"); // legalNameDefaultPattern max
  if (!county)                  redirect("/irs/ein/apply/additional-details");
  if (county.length > 22)       redirect("/irs/ein/apply/additional-details"); // countyPattern max
  if (!VALID_STATES.has(state)) redirect("/irs/ein/apply/additional-details");
  if (!VALID_STATES.has(stateIncorporated)) redirect("/irs/ein/apply/additional-details");
  if (!VALID_MONTHS.has(startMonth))        redirect("/irs/ein/apply/additional-details");

  const startYear = parseInt(startYearStr, 10);
  if (!startYearStr || !/^[0-9]{4}$/.test(startYearStr)) redirect("/irs/ein/apply/additional-details");
  const currentYear = new Date().getFullYear();
  // bundle error3: "Year cannot be more than 1 year in the future or more than 25 years in the past"
  if (startYear < currentYear - 25 || startYear > currentYear + 1) redirect("/irs/ein/apply/additional-details");

  if (dbaName && dbaName.length > 34) redirect("/irs/ein/apply/additional-details"); // tradeNamePattern max

  // ── 4. Validate Section 2 ────────────────────────────────────────────────
  if (trucking  !== "yes" && trucking  !== "no") redirect("/irs/ein/apply/additional-details");
  if (gambling  !== "yes" && gambling  !== "no") redirect("/irs/ein/apply/additional-details");
  if (exciseTaxes !== "yes" && exciseTaxes !== "no") redirect("/irs/ein/apply/additional-details");
  if (atf       !== "yes" && atf       !== "no") redirect("/irs/ein/apply/additional-details");
  if (w2Issuer  !== "yes" && w2Issuer  !== "no") redirect("/irs/ein/apply/additional-details");

  // ── 5. Validate Section 3 (W4b) if w2Issuer=yes ─────────────────────────
  let w2Info: Record<string, unknown> | null = null;
  if (w2Issuer === "yes") {
    if (!VALID_MONTHS.has(firstPayMonth)) redirect("/irs/ein/apply/additional-details");
    if (!firstPayYearStr || !/^[0-9]{4}$/.test(firstPayYearStr)) redirect("/irs/ein/apply/additional-details");
    const firstPayYear = parseInt(firstPayYearStr, 10);
    if (taxLiability !== "yes" && taxLiability !== "no") redirect("/irs/ein/apply/additional-details");

    const agCount       = agEmployeesStr       ? parseInt(agEmployeesStr, 10)       : 0;
    const householdCount = householdEmployeesStr ? parseInt(householdEmployeesStr, 10) : 0;
    const otherCount    = otherEmployeesStr    ? parseInt(otherEmployeesStr, 10)    : 0;
    // Total must be ≥ 1 (bundle: instructions6 "Total number of employees must be at least 1")
    if (agCount + householdCount + otherCount < 1) redirect("/irs/ein/apply/additional-details");

    w2Info = {
      firstWagesPaidMonth:    firstPayMonth,
      firstWagesPaidYear:     firstPayYear,
      agEmployeesCount:       agCount,
      householdEmployeesCount: householdCount,
      otherEmployeesCount:    otherCount,
      // bundle: over1000TaxLiability = (taxLiability === "no")
      over1000TaxLiability:   taxLiability === "no",
    };
  }

  // ── 6. Validate review checkbox ──────────────────────────────────────────
  if (reviewConfirmed !== "yes") redirect("/irs/ein/apply/additional-details");

  // ── 7. Build payload (key names from bundle's ol() function) ─────────────
  const additionalDetailsPayload: Record<string, unknown> = {
    // businessInfo
    legalName,
    dbaName:         dbaName || null,
    county,
    state,
    stateIncorporated,
    startMonth,
    startYear,
    // additionalDetails
    trucking:        trucking    === "yes",
    gambling:        gambling    === "yes",
    exciseTaxes:     exciseTaxes === "yes",
    atf:             atf         === "yes",
    w2Issuer:        w2Issuer    === "yes",
    w2Info,
  };

  // ── 8. Upsert ein_applications ───────────────────────────────────────────
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
      ...additionalDetailsPayload,
    };
    await admin
      .from("ein_applications")
      .update({
        current_step: "activity_and_services",
        form_data:    merged,
      })
      .eq("id", existing.id);
  } else {
    await admin.from("ein_applications").insert({
      user_id:      user.id,
      current_step: "activity_and_services",
      status:       "in_progress",
      form_data:    additionalDetailsPayload,
    });
  }

  // ── 9. Advance to W5 Activity & Services (Slice 7) ────────────────────
  redirect("/irs/ein/apply/activity-and-services");
}
