/**
 * GET /irs/ein/apply/ein-assignment/download
 *
 * Auth-gated signed-URL endpoint for the CP575G EIN Confirmation Letter PDF.
 *
 * ── Behaviour ────────────────────────────────────────────────────────────────
 * 1. Auth check — 401 if not signed in.
 * 2. Load the user's most-recent submitted ein_application (same predicate as
 *    the W7 page.tsx: status = 'submitted', ordered by submitted_at DESC).
 *    404 if none found.
 * 3. Check ein_documents for an existing cp575g row for this application.
 *    – If present: skip generation, go straight to step 5.
 *    – If absent: generate the PDF, upload it, insert the ein_documents row.
 * 4. PDF generation data sourced entirely from the application row:
 *    entityName   ← form_data.legalName
 *    officerName  ← form_data.responsibleFirstName + " " + form_data.responsibleLastName
 *    ein          ← ein_assigned
 *    nameControl  ← first 4 uppercase letters of legalName (matches W7 derivation)
 *    dateIssued   ← submitted_at formatted as "Month DD, YYYY"
 *    street       ← form_data.physicalStreet
 *    city         ← form_data.physicalCity
 *    state        ← form_data.physicalState
 *    zip          ← form_data.physicalZipCode
 * 5. Issue a 60-second signed URL for the storage path (download-only).
 * 6. Return 302 redirect to the signed URL — browser triggers native download.
 *
 * ── Error responses ──────────────────────────────────────────────────────────
 * 401 — not authenticated
 * 404 — no submitted application found
 * 500 — PDF generation or storage failure (message included for dev diagnosis)
 */

import { NextResponse }               from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient }  from "@/lib/supabase/admin";
import { renderCp575gPdf }            from "@/lib/irs/pdf/render";
import { uploadCp575gPdf }            from "@/lib/irs/pdf/upload";

export const dynamic = "force-dynamic";

// ── Name control derivation (mirrors W7 page.tsx) ─────────────────────────────
function deriveNameControl(legalName: string): string {
  const letters = legalName.toUpperCase().replace(/[^A-Z]/g, "");
  return letters.slice(0, 4).padEnd(4, " ").trimEnd();
}

// ── Date formatter: Date → "Month DD, YYYY" ───────────────────────────────────
function formatDateIssued(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year:  "numeric",
    month: "long",
    day:   "numeric",
    timeZone: "America/New_York",
  });
}

export async function GET() {
  // 1. Auth check
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Load most-recent submitted application
  const admin = createSupabaseAdminClient();
  const { data: app, error: appError } = await admin
    .from("ein_applications")
    .select("id, user_id, form_data, ein_assigned, submitted_at")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .single();

  if (appError || !app || !app.ein_assigned) {
    return NextResponse.json(
      { error: "No submitted EIN application found." },
      { status: 404 },
    );
  }

  const ein = app.ein_assigned as string;
  const fd  = (app.form_data ?? {}) as Record<string, unknown>;

  // 3. Check for existing ein_documents row
  const { data: existingDoc } = await admin
    .from("ein_documents")
    .select("id, storage_path")
    .eq("ein_application_id", app.id)
    .eq("document_kind", "cp575g")
    .maybeSingle();

  let storagePath: string;

  if (existingDoc) {
    // Already generated — reuse the stored path.
    storagePath = existingDoc.storage_path as string;
  } else {
    // 4. Build PDF data from application row
    const legalName     = (fd.legalName             as string | undefined) ?? "";
    const firstName     = (fd.responsibleFirstName   as string | undefined) ?? "";
    const lastName      = (fd.responsibleLastName    as string | undefined) ?? "";
    const officerName   = `${firstName} ${lastName}`.trim();
    const nameControl   = deriveNameControl(legalName);
    const dateIssued    = formatDateIssued(
      (app.submitted_at as string | null) ?? new Date().toISOString()
    );

    const pdfData = {
      entityName:  legalName,
      officerName: officerName || legalName,   // fallback if names missing
      ein,
      nameControl,
      dateIssued,
      street: (fd.physicalStreet   as string | undefined) ?? "",
      city:   (fd.physicalCity     as string | undefined) ?? "",
      state:  (fd.physicalState    as string | undefined) ?? "",
      zip:    (fd.physicalZipCode  as string | undefined) ?? "",
    };

    // Generate PDF buffer
    let buffer: Buffer;
    try {
      buffer = await renderCp575gPdf(pdfData);
    } catch (err) {
      console.error("[download/route] renderCp575gPdf failed:", err);
      return NextResponse.json(
        { error: "PDF generation failed." },
        { status: 500 },
      );
    }

    // Upload to storage + upsert ein_documents row
    try {
      const result = await uploadCp575gPdf({
        einApplicationId: app.id as string,
        ein,
        buffer,
      });
      storagePath = result.storagePath;
    } catch (err) {
      console.error("[download/route] uploadCp575gPdf failed:", err);
      return NextResponse.json(
        { error: "PDF upload failed." },
        { status: 500 },
      );
    }
  }

  // 5. Issue 60-second signed URL (download-only)
  const { data: signedData, error: signedError } = await admin.storage
    .from("irs-documents")
    .createSignedUrl(storagePath, 60, {
      download: `cp575g-ein-${ein.replace("-", "")}.pdf`,
    });

  if (signedError || !signedData?.signedUrl) {
    console.error("[download/route] createSignedUrl failed:", signedError);
    return NextResponse.json(
      { error: "Could not generate download link." },
      { status: 500 },
    );
  }

  // 6. Redirect — browser triggers native file download
  return NextResponse.redirect(signedData.signedUrl, { status: 302 });
}
