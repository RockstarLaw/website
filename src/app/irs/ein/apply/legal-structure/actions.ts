"use server";

/**
 * IRS EIN Wizard Step 1 — Legal Structure Server Action (Phase IRS-W1)
 *
 * submitLegalStructure(formData: FormData) → void
 *
 * Called when the user clicks Continue on the Legal Structure step.
 * Requires auth — the page itself is public, but session persistence
 * needs a user identity.
 *
 * Validates the selected legal_structure value against the 7 allowed
 * IRS enum values. For LLC, also persists members_of_llc and llc_state.
 *
 * Creates a new ein_applications row if none exists for the user;
 * updates the existing in-progress row otherwise. Advances current_step
 * to 'identity' and redirects to /irs/ein/apply/identity (W2 — will 404
 * until W2 ships; this is expected).
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_STRUCTURES = [
  "SOLE_PROPRIETOR",
  "PARTNERSHIP",
  "CORPORATION",
  "LLC",
  "ESTATE",
  "ALL_OTHERS_TRUST",
  "OTHER_NON_PROFIT",
] as const;

type LegalStructure = (typeof VALID_STRUCTURES)[number];

export async function submitLegalStructure(formData: FormData): Promise<void> {
  // 1. Auth check — page is public but session persistence requires identity
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Validate legal_structure
  const rawStructure = formData.get("legal_structure")?.toString() ?? "";
  if (!VALID_STRUCTURES.includes(rawStructure as LegalStructure)) {
    // Invalid value — bounce back to step
    redirect("/irs/ein/apply/legal-structure");
  }
  const legal_structure = rawStructure as LegalStructure;

  // 3. Build form_data payload
  const formDataPayload: Record<string, string> = { legal_structure };
  if (legal_structure === "LLC") {
    const members          = formData.get("members_of_llc")?.toString()?.trim()    ?? "";
    const state            = formData.get("state")?.toString()?.trim()             ?? "";
    const spousesAsMembers = formData.get("spouses_as_members")?.toString()?.trim() ?? "";
    const qjvElection      = formData.get("qjv_election")?.toString()?.trim()      ?? "";

    if (members) formDataPayload.members_of_llc = members;
    if (state)   formDataPayload.llc_state       = state;

    // Derive community_property_state from the 9-state set (verbatim from bundle `nr` function)
    const CP_STATES = new Set(["AZ","CA","ID","LA","NV","NM","TX","WA","WI"]);
    const isCommunityProperty = CP_STATES.has(state);
    if (isCommunityProperty) formDataPayload.community_property_state = "true";

    // Persist spouse and QJV election fields when present
    if (spousesAsMembers) formDataPayload.spouses_as_members = spousesAsMembers;
    if (qjvElection)      formDataPayload.qjv_election       = qjvElection;

    // Resolve final entity_type per bundle settle logic:
    //   members=1                              → SINGLE_MEMBER_LLC
    //   members=2, !CP                         → MULTI_MEMBER_LLC
    //   members=2, CP, spouses=yes, qjv set    → qjv election value
    //   members=2, CP, spouses=no or blank     → MULTI_MEMBER_LLC
    //   members=3+, state set                  → MULTI_MEMBER_LLC
    let entity_type = "";
    if (members === "1") {
      entity_type = "SINGLE_MEMBER_LLC";
    } else if (members !== "") {
      if (members === "2" && isCommunityProperty && spousesAsMembers === "yes" && qjvElection) {
        entity_type = qjvElection; // SINGLE_MEMBER_LLC or MULTI_MEMBER_LLC per Rev. Proc. 2002-69
      } else {
        entity_type = "MULTI_MEMBER_LLC";
      }
    }
    if (entity_type) formDataPayload.entity_type = entity_type;
  }

  // 4. Upsert ein_applications — find existing in-progress session or create
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
    // Merge new fields into existing form_data
    const merged = {
      ...(existing.form_data as Record<string, unknown>),
      ...formDataPayload,
    };
    await admin
      .from("ein_applications")
      .update({
        current_step: "identity",
        form_data:    merged,
      })
      .eq("id", existing.id);
  } else {
    // Create new session
    await admin.from("ein_applications").insert({
      user_id:      user.id,
      current_step: "identity",
      status:       "in_progress",
      form_data:    formDataPayload,
    });
  }

  // 5. Advance to W2 — will 404 until IRS-W2 ships
  redirect("/irs/ein/apply/identity");
}
