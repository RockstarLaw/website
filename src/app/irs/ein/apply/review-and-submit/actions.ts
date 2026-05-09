"use server";

/**
 * IRS EIN Wizard Step 6 — Review & Submit Server Action (Slice 8)
 *
 * submitFinalApplication() → void
 *
 * Called when the user clicks "Submit EIN Request" on the Review & Submit page.
 * Requires auth. Validates that the confirmation_letter_preference radio is set.
 *
 * ── Fields persisted ─────────────────────────────────────────────────────────
 *
 * confirmation_letter_preference  — "DIGITAL" | "MAIL"
 *   Source: confirmationLetterInputControl radio in ein__reviewAndSubmit.json.
 *   Stored into form_data for downstream use (W7 EIN Assignment, CP575 PDF).
 *
 * ── State transitions ─────────────────────────────────────────────────────────
 *
 * current_step → "ein_assignment"
 * status       → "submitted"
 * submitted_at → now()
 *
 * On success: redirects to /irs/ein/apply/ein-assignment (W7 — will 404 until Slice 9).
 *
 * ── Content sources (HR#1) ───────────────────────────────────────────────────
 *
 * Field names and state values:
 *   irs-captures/js/index-ChwXuGQH.js → E7() submit handler (Ee function),
 *   tt() payload builder, and gt() result handler.
 *   Confirmation letter delivery: letterDelivery field in tt() payload.
 *   Destination route: pt(r.push, "EinAssignment", ...) after httpStatus 200.
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient }  from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitFinalApplication(formData: FormData): Promise<void> {
  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 2. Extract + validate confirmation letter preference ──────────────────
  // Source: confirmationLetterInputControl choices in ein__reviewAndSubmit.json
  //   { value: "DIGITAL", text: "Receive letter digitally in the next step" }
  //   { value: "MAIL",    text: "Receive letter by mail (allow up to 4 weeks for delivery)" }
  const letterPref = formData.get("confirmationLetterPreference")?.toString()?.trim() ?? "";

  if (letterPref !== "DIGITAL" && letterPref !== "MAIL") {
    // Validation error — redirect back. Client-side validation catches this
    // first (matching bundle behavior: confirmationLetterInputControl.inputErrorMessages[0])
    // but server validates as a safety net.
    redirect("/irs/ein/apply/review-and-submit");
  }

  // ── 3. Load in-progress application ──────────────────────────────────────
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("ein_applications")
    .select("id, form_data")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (!existing) {
    // No in-progress application found — redirect to start
    redirect("/irs/ein/apply/legal-structure");
  }

  // ── 4. Merge confirmation_letter_preference into form_data ────────────────
  const merged = {
    ...(existing.form_data as Record<string, unknown>),
    confirmation_letter_preference: letterPref,
  };

  // ── 5. Persist submission state ───────────────────────────────────────────
  await admin
    .from("ein_applications")
    .update({
      current_step: "ein_assignment",
      status:       "submitted",
      submitted_at: new Date().toISOString(),
      form_data:    merged,
    })
    .eq("id", existing.id);

  // ── 6. Advance to W7 — will 404 until Slice 9 ships ──────────────────────
  redirect("/irs/ein/apply/ein-assignment");
}
