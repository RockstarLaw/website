/**
 * LLC Payment Page — Retrofit R7b-5
 *
 * 1:1 clone of the real Sunbiz corenrtn.exe payment page.
 * HTML template stored at public/sunbiz/payment.html.
 * Served via dangerouslySetInnerHTML — no React rebuild, no StarBizShell.
 *
 * Auth-gated. Reads the most recent in-progress llc filing_session.
 * If none → redirect to disclaimer.
 *
 * Injects {{TRACKING_NUMBER}} and {{FILING_CHARGE}} from session data.
 * Charge formula: $125.00 + $5.00 if COS + $30.00 if certified copy
 * (matches filing-info/page.tsx formula and capture value of $160.00).
 *
 * Sets current_step = 'payment' before render.
 *
 * Cash register easter egg: PaymentCashRegister client component intercepts
 * both submit buttons, plays the ka-ching sound, then submits with 250ms delay.
 *
 * Scoped <style> block: verbatim copy of filing-info/page.tsx (58e34f9).
 */

import { readFileSync } from "fs";
import { join } from "path";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { PaymentCashRegister } from "./PaymentCashRegister";

export const dynamic = "force-dynamic";

export default async function LLCPaymentPage() {
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

  // ── Tracking number (should already exist from filing-info visit) ─────────────
  let trackingNumber = session.tracking_number;
  if (!trackingNumber) {
    trackingNumber = session.id.replace(/-/g, "").slice(0, 12).toUpperCase();
    await admin
      .from("filing_sessions")
      .update({ tracking_number: trackingNumber, last_saved_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  // ── Update current_step to 'payment' ────────────────────────────────────────
  if (session.current_step !== "payment") {
    await admin
      .from("filing_sessions")
      .update({ current_step: "payment", last_saved_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  // ── Compute filing charge (same formula as filing-info/page.tsx) ─────────────
  let charge = 125.00;
  if (fd.cos_num_flag  === "Y") charge += 5.00;
  if (fd.cert_num_flag === "Y") charge += 30.00;
  const filingCharge = charge.toFixed(2);

  // ── Read template and substitute placeholders ────────────────────────────────
  let html = readFileSync(
    join(process.cwd(), "public/sunbiz/payment.html"),
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
       * Scoped reset — verbatim copy of filing-info/page.tsx (58e34f9).
       * Same set of CSS leakage fixes + .efiledata alias.
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

        /* .efiledata — payment page uses this class for tracking# and charge values.
               Not in Sunbiz CSS. Mirrors .data (normal weight).
               !important on font-weight prevents bold inheritance from adjacent .descript. */
        .efiledata {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          font-weight: normal !important;
          color: #000000;
          vertical-align: top;
        }
      `}</style>

      {/* Cash register easter egg — attaches click handlers to both submit buttons */}
      <PaymentCashRegister />

      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}
