/**
 * IRS EIN Wizard Step 7 — EIN Assignment (Slice 9)
 *
 * Verbatim clone of the IRS sa.www4.irs.gov/applyein/einAssignment page.
 * HTML chrome stored at public/irs/wizard-step-7.html.
 * Interactive content rendered by <EinAssignmentDisplay /> client component,
 * portaled into #w7-form-portal.
 *
 * ── Responsibilities ─────────────────────────────────────────────────────────
 *
 * 1. Auth check — redirects to /login if not signed in.
 * 2. Application gate — loads the most-recent submitted application for the
 *    signed-in user. Redirects to /irs/ein/apply/legal-structure if none found.
 *    Gate predicate: status = 'submitted' (set by W6 submitFinalApplication()).
 * 3. EIN generation — if ein_assigned is null (first load after submit),
 *    generates a deterministic simulated EIN in 99-XXXXXXX format per §4 of
 *    SESSION_HANDOFF.md and persists it to the ein_assigned column.
 *    The same EIN is returned on every subsequent load for the same application
 *    (deterministic, never random per-request).
 * 4. Passes EIN + form_data fields to EinAssignmentDisplay for rendering.
 *
 * ── EIN Format (§4) ──────────────────────────────────────────────────────────
 *
 * Simulated EINs use the 99-XXXXXXX format to avoid collision with real EINs.
 * (Real EINs never use 99 as the first two digits in normal allocation.)
 * Deterministic: generateSimulatedEin(user_id, application_id) → stable 7-digit
 * suffix derived from a 32-bit djb2-style hash of the two UUID strings.
 * Formatted: "99-" + 7-digit zero-padded number.
 *
 * ── Name Control ─────────────────────────────────────────────────────────────
 *
 * Derived server-side from form_data.legalName: first 4 uppercase letters,
 * stripping non-alpha characters, zero-padded if shorter than 4.
 * This mirrors the standard IRS name-control derivation for business filers.
 *
 * ── Content sources (HR#1) ───────────────────────────────────────────────────
 *
 * Chrome HTML: adapted from wizard-step-6.html. Changes: portal id w7-form-portal,
 *   progress step 6-of-6 active (EIN Assignment), step 5 (Review & Submit) completed.
 *
 * Display labels + section structure: verbatim from
 *   irs-captures/json/ein__einAssignment.json
 *
 * Post-submit state machine + EIN Assignment renderer:
 *   irs-captures/js/index-ChwXuGQH.js → $7() / k7 export
 *   Redux state keys: a.ein, a.assignedLegalName, a.nameControl,
 *   a.confirmationLetter. Our server-side equivalent: DB columns + form_data.
 *
 * ── Inherited accepted deviations ────────────────────────────────────────────
 * FA magnifying-glass icon (shared chrome, accepted 2026-05-08).
 *
 * ── Out of scope ─────────────────────────────────────────────────────────────
 * CP575G PDF generator — Slice 10.
 * Letter 147C replacement — Phase 4+.
 * Error page rendering — Slice 11.
 */

import { readFileSync }               from "fs";
import { join }                       from "path";
import { redirect }                   from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient }  from "@/lib/supabase/admin";
import EinAssignmentDisplay           from "./EinAssignmentDisplay";

export const dynamic = "force-dynamic";

// ── Simulated EIN generation (§4 of SESSION_HANDOFF.md) ──────────────────────
// Format: 99-XXXXXXX where XXXXXXX is a deterministic 7-digit number derived
// from a djb2-style hash of user_id + application_id. Never random per-request.
function generateSimulatedEin(userId: string, applicationId: string): string {
  const input = `${userId}-${applicationId}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash | 0; // coerce to 32-bit signed integer
  }
  const digits = Math.abs(hash) % 10_000_000;
  return `99-${digits.toString().padStart(7, "0")}`;
}

// ── Name control derivation ───────────────────────────────────────────────────
// Standard IRS business name control: first 4 uppercase letters, non-alpha stripped.
function deriveNameControl(legalName: string): string {
  const letters = legalName.toUpperCase().replace(/[^A-Z]/g, "");
  return letters.slice(0, 4).padEnd(4, " ").trimEnd();
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function IrsEinAssignmentPage() {
  // 1. Auth check
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Load most-recent submitted application
  const admin = createSupabaseAdminClient();
  const { data: app } = await admin
    .from("ein_applications")
    .select("id, user_id, form_data, ein_assigned")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .single();

  if (!app) {
    // No submitted application found — redirect to start of wizard
    redirect("/irs/ein/apply/legal-structure");
  }

  // 3. Generate and persist simulated EIN if not yet assigned
  let ein = app.ein_assigned as string | null;
  if (!ein) {
    ein = generateSimulatedEin(user.id, app.id as string);
    await admin
      .from("ein_applications")
      .update({ ein_assigned: ein })
      .eq("id", app.id);
  }

  // 4. Extract display fields from form_data
  const fd = (app.form_data ?? {}) as Record<string, unknown>;
  const legalName    = (fd.legalName    as string | undefined) ?? "";
  const letterPref   = (fd.confirmation_letter_preference as "DIGITAL" | "MAIL" | undefined) ?? "DIGITAL";
  const nameControl  = deriveNameControl(legalName);

  // 5. Read HTML chrome
  const htmlPath = join(process.cwd(), "public", "irs", "wizard-step-7.html");
  const html     = readFileSync(htmlPath, "utf-8");

  return (
    <>
      {/* Static IRS chrome — portals into #w7-form-portal */}
      <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />

      {/* Client component portals confirmation UI into #w7-form-portal */}
      <EinAssignmentDisplay
        ein={ein}
        legalName={legalName}
        nameControl={nameControl}
        letterPref={letterPref}
      />
    </>
  );
}
