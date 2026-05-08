/**
 * LLC Filing-Info Page — Retrofit R7b-4
 *
 * 1:1 clone of the real Sunbiz corefile.exe "Filing Information" interstitial.
 * HTML template stored at public/sunbiz/filing-info.html.
 * Served via dangerouslySetInnerHTML — no React rebuild, no StarBizShell.
 *
 * Auth-gated. Reads the most recent in-progress llc filing_session.
 * If none → redirect to disclaimer.
 *
 * Tracking number logic (per 20260507n migration):
 *   If filing_sessions.tracking_number IS NULL:
 *     tracking := UPPER(first 12 chars of session UUID, hyphens stripped)
 *     persist to filing_sessions.tracking_number
 *   Use existing value otherwise.
 *
 * Filing charge logic (matching captured $160.00 with COS + Certified Copy):
 *   Base: $125.00 (includes RA designation — bundled in FL LLC formation fee)
 *   + $5.00  if form_data.cos_num_flag  === 'Y'
 *   + $30.00 if form_data.cert_num_flag === 'Y'
 *   Formatted as "160.00" (template has "$ {{FILING_CHARGE}}")
 *
 * Sets current_step = 'filing-info'. Substitutes {{TRACKING_NUMBER}} and
 * {{FILING_CHARGE}} placeholders before render.
 *
 * Scoped <style> block: verbatim copy of review/page.tsx (987c9e5).
 * Same set of CSS leakage fixes. Same React 19 link hoisting.
 * Added: .efiledata alias — filing-info HTML uses class="efiledata" for
 * tracking number and charge value cells; not defined in Sunbiz CSS.
 * Mirrors .data styling (normal weight, 10pt Arial).
 */

import { readFileSync } from "fs";
import { join } from "path";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import FilingInfoAlert from "./FilingInfoAlert";

export const dynamic = "force-dynamic";

export default async function LLCFilingInfoPage() {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Fetch most recent in-progress LLC session ────────────────────────────────
  const admin = createSupabaseAdminClient();
  const { data: session, error } = await admin
    .from("filing_sessions")
    .select("id, form_data, tracking_number, current_step")
    .eq("user_id", user.id)
    .eq("filing_type", "llc")
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !session) redirect("/starbiz/filing/llc/disclaimer");

  const fd: Record<string, string> = (session.form_data as Record<string, string>) ?? {};

  // ── Generate tracking number if null ─────────────────────────────────────────
  // Per 20260507n migration: first 12 chars of session UUID, uppercase, hyphens stripped.
  let trackingNumber = session.tracking_number;
  if (!trackingNumber) {
    trackingNumber = session.id.replace(/-/g, "").slice(0, 12).toUpperCase();
    await admin
      .from("filing_sessions")
      .update({ tracking_number: trackingNumber, last_saved_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  // ── Update current_step to 'filing-info' ────────────────────────────────────
  if (session.current_step !== "filing-info") {
    await admin
      .from("filing_sessions")
      .update({ current_step: "filing-info", last_saved_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  // ── Compute filing charge ────────────────────────────────────────────────────
  // Base $125.00 (FL LLC articles + RA designation bundled).
  // Optional: +$5.00 COS, +$30.00 certified copy.
  // Source of truth: capture shows $160.00 with both optional items selected.
  let charge = 125.00;
  if (fd.cos_num_flag  === "Y") charge += 5.00;
  if (fd.cert_num_flag === "Y") charge += 30.00;
  const filingCharge = charge.toFixed(2);

  // ── Read template and substitute placeholders ────────────────────────────────
  let html = readFileSync(
    join(process.cwd(), "public/sunbiz/filing-info.html"),
    "utf-8",
  );

  html = html.replaceAll("{{TRACKING_NUMBER}}", trackingNumber);
  html = html.replaceAll("{{FILING_CHARGE}}", filingCharge);

  // Extract body innerHTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/sunbiz/sunbiz_style.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/sunbiz/sunbiz_dos_style.css" />

      {/*
       * Scoped reset — verbatim copy of review/page.tsx (987c9e5).
       * [6] selector stays #MainContentEfiling (same div as review page).
       * [9] .efiledata alias added — filing-info uses this class for tracking
       *     number and charge value cells; not in Sunbiz CSS. Mirrors .data.
       */}
      <style>{`
        body {
          display: block !important;
          flex-direction: initial !important;
          align-items: initial !important;
          min-height: auto !important;
          line-height: normal !important;
        }

        #wrapper table {
          border-collapse: separate !important;
        }

        #wrapper input,
        #wrapper textarea,
        #wrapper select {
          border-width: revert !important;
          border-style: revert !important;
          border-color: revert !important;
          appearance: revert !important;
          -webkit-appearance: revert !important;
          padding: revert !important;
          background-color: revert !important;
        }

        .heading {
          font: bold 13px Arial, sans-serif !important;
          border-bottom: 1px solid #333 !important;
          color: #333 !important;
        }

        .bodytext {
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 9pt !important;
          font-weight: normal;
          color: #000000;
        }

        .redtext {
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 12pt !important;
          font-weight: bold !important;
          color: red !important;
        }

        #wrapper #content {
          font-size: 1em !important;
        }

        /* [6] Same selector as review — filing-info also uses #MainContentEfiling. */
        #wrapper #MainContentEfiling > form > table > tbody > tr > td {
          padding-top: 2px !important;
          padding-bottom: 2px !important;
        }

        #wrapper a:link,
        #wrapper a:visited {
          color: #236faf !important;
          text-decoration: underline !important;
        }
        #wrapper a:hover {
          color: #5582a9 !important;
        }

        /* [9] .efiledata alias — used by filing-info for tracking# and charge values.
               Not defined in Sunbiz CSS. Mirrors .data (normal weight, 10pt Arial). */
        .efiledata {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          font-weight: normal;
          color: #000000;
          vertical-align: top;
        }
      `}</style>

      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />

      {/* Reproduces review_document_alert(true) popup from real Sunbiz corefile.exe */}
      <FilingInfoAlert />
    </>
  );
}
