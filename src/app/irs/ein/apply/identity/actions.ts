"use server";

/**
 * IRS EIN Wizard Step 2 — Identity Server Action (Phase IRS-W2)
 *
 * submitIdentity(formData: FormData) → void
 *
 * Called when the user clicks Continue on the Identity step.
 * Requires auth — page is public, but session persistence needs a user.
 *
 * Validates required fields:
 *   - responsibleSsn     (required)
 *   - responsibleFirstName (required)
 *   - responsibleLastName  (required)
 *   - entityRoleRadioInput (required: "yes" | "no")
 *
 * Optional fields persisted if present:
 *   - responsibleMiddleName
 *   - responsibleSuffix
 *
 * Merges into ein_applications.form_data — does NOT overwrite W1 fields
 * (legal_structure, members_of_llc, llc_state). Advances current_step to
 * 'address' and redirects to /irs/ein/apply/address (W3 — will 404 until
 * IRS-W3 ships; this is expected per spec).
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitIdentity(formData: FormData): Promise<void> {
  // 1. Auth check — page is public but session persistence requires identity
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Extract + validate fields
  const responsibleSsn        = formData.get("responsibleSsn")?.toString()?.trim()        ?? "";
  const responsibleFirstName  = formData.get("responsibleFirstName")?.toString()?.trim()  ?? "";
  const responsibleMiddleName = formData.get("responsibleMiddleName")?.toString()?.trim() ?? "";
  const responsibleLastName   = formData.get("responsibleLastName")?.toString()?.trim()   ?? "";
  const responsibleSuffix     = formData.get("responsibleSuffix")?.toString()?.trim()     ?? "";
  const entityRole            = formData.get("entityRoleRadioInput")?.toString()?.trim()  ?? "";

  if (!responsibleSsn || !responsibleFirstName || !responsibleLastName) {
    redirect("/irs/ein/apply/identity");
  }
  // Exact 9-digit validation (strip dashes, check digit count)
  const ssnDigits = responsibleSsn.replace(/-/g, "");
  if (ssnDigits.length !== 9) {
    redirect("/irs/ein/apply/identity");
  }
  if (entityRole !== "yes" && entityRole !== "no") {
    redirect("/irs/ein/apply/identity");
  }

  // 3. Build form_data payload (only include optional fields if non-empty)
  const payload: Record<string, string> = {
    responsibleSsn,
    responsibleFirstName,
    responsibleLastName,
    entityRoleRadioInput: entityRole,
  };
  if (responsibleMiddleName) payload.responsibleMiddleName = responsibleMiddleName;
  if (responsibleSuffix)     payload.responsibleSuffix     = responsibleSuffix;

  // 4. Upsert ein_applications — merge into existing in-progress session
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
    // Merge — preserves W1 fields (legal_structure, members_of_llc, llc_state)
    const merged = {
      ...(existing.form_data as Record<string, unknown>),
      ...payload,
    };
    await admin
      .from("ein_applications")
      .update({
        current_step: "address",
        form_data:    merged,
      })
      .eq("id", existing.id);
  } else {
    // No in-progress session found — create one (handles direct-navigation edge case)
    await admin.from("ein_applications").insert({
      user_id:      user.id,
      current_step: "address",
      status:       "in_progress",
      form_data:    payload,
    });
  }

  // 5. Advance to W3 — will 404 until IRS-W3 ships
  redirect("/irs/ein/apply/address");
}
