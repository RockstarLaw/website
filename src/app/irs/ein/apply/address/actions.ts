"use server";

/**
 * IRS EIN Wizard Step 3 — Addresses Server Action (Phase IRS-W3)
 *
 * submitAddress(formData: FormData) → void
 *
 * Called when the user clicks Continue on the Addresses step.
 * Requires auth — page is public, but session persistence needs a user.
 *
 * Validates required fields:
 *   - physicalStreet   (required)
 *   - physicalCity     (required)
 *   - physicalState    (required)
 *   - physicalZipCode  (required)
 *   - thePhone         (required)
 *   - otherAddress     (required: "yes" | "no")
 *
 * Merges into ein_applications.form_data — does NOT overwrite W1/W2 fields
 * (legal_structure, identity fields, etc.). Advances current_step to
 * 'additional_details' and redirects to /irs/ein/apply/additional-details
 * (W4 — will 404 until IRS-W4 ships; this is expected per spec).
 *
 * Note: If otherAddress="yes", the conditional mailing address form is not
 * yet implemented (capture not available). The "yes" choice is persisted
 * for forward compatibility; the mailing address entry will be added when
 * the W3-mailing-address capture is available.
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitAddress(formData: FormData): Promise<void> {
  // 1. Auth check — page is public but session persistence requires identity
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Extract + validate fields
  const physicalStreet  = formData.get("physicalStreet")?.toString()?.trim()  ?? "";
  const physicalCity    = formData.get("physicalCity")?.toString()?.trim()    ?? "";
  const physicalState   = formData.get("physicalState")?.toString()?.trim()   ?? "";
  const physicalZipCode = formData.get("physicalZipCode")?.toString()?.trim() ?? "";
  const thePhone        = formData.get("thePhone")?.toString()?.trim()        ?? "";
  const otherAddress    = formData.get("otherAddress")?.toString()?.trim()    ?? "";

  if (
    !physicalStreet ||
    !physicalCity   ||
    !physicalState  ||
    !physicalZipCode||
    !thePhone
  ) {
    redirect("/irs/ein/apply/address");
  }
  if (otherAddress !== "yes" && otherAddress !== "no") {
    redirect("/irs/ein/apply/address");
  }

  // 3. Build form_data payload
  const payload: Record<string, string> = {
    physicalStreet,
    physicalCity,
    physicalState,
    physicalZipCode,
    thePhone,
    otherAddress,
  };

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
    // Merge — preserves W1 fields (legal_structure, etc.) and W2 fields (identity)
    const merged = {
      ...(existing.form_data as Record<string, unknown>),
      ...payload,
    };
    await admin
      .from("ein_applications")
      .update({
        current_step: "additional_details",
        form_data:    merged,
      })
      .eq("id", existing.id);
  } else {
    // No in-progress session found — create one (handles direct-navigation edge case)
    await admin.from("ein_applications").insert({
      user_id:      user.id,
      current_step: "additional_details",
      status:       "in_progress",
      form_data:    payload,
    });
  }

  // 5. Advance to W4 — will 404 until IRS-W4 ships
  redirect("/irs/ein/apply/additional-details");
}
