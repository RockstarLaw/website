/**
 * Profit Corp Form Page — R8-2
 *
 * 1:1 clone of the real Sunbiz coretype.exe form page (DOMP filing type).
 * HTML stored as a transformed static asset at public/sunbiz/profit-corp-form.html.
 * Served verbatim via dangerouslySetInnerHTML — no StarBizShell, no EFilingShell,
 * no React form rebuild.
 *
 * Auth gate enforced before any HTML is returned.
 *
 * Transformations baked into profit-corp-form.html (SESSION_HANDOFF §2 / R8-2):
 *   • Sunbiz.js <script> tag stripped (matches LLC form precedent — R7b-2 d0cd4c8).
 *   • MM_reloadPage <script> block stripped.
 *   • "Florida Department of State" → "RockStar Department of State" (chrome only).
 *   • "Florida Division of Corporations" → "RockStar Division of Corporations" (logo alt).
 *   • Asset paths → /sunbiz/<basename>.
 *   • Form action → /starbiz/filing/profit-corp/review (POST).
 *   • javascript: hrefs → "#".
 *   • track_number value scrubbed.
 *   • filing_type=DOMP, menu_function=ADD preserved verbatim.
 *   • onkeyup / onclick / onkeydown / onblur attributes preserved (no-ops without Sunbiz.js).
 *
 * ─── CSS LEAKAGE FIX ──────────────────────────────────────────────────────────
 * Identical rationale to LLC form page.tsx (R7b-2 d0cd4c8). Same 7 scoped
 * override rules. See that file's header for the full explanation.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfitCorpFormPage() {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Read the pre-transformed static HTML ────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/sunbiz/profit-corp-form.html"),
    "utf-8",
  );

  // Extract body innerHTML for injection.
  // React renders inside the root layout's <body>; inject only body content.
  // <head> stylesheets are added via React 19 <link> hoisting below.
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  return (
    <>
      {/*
       * React 19 hoists <link> and <style> to <head> automatically.
       * Load the two Sunbiz screen stylesheets this way — no FOUC, no layout.tsx changes.
       */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/sunbiz/sunbiz_style.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/sunbiz/sunbiz_dos_style.css" />

      {/*
       * Scoped reset — verbatim copy of LLC form page.tsx (d0cd4c8).
       * [1] layout.tsx body flex/min-height undo
       * [2] Tailwind table { border-collapse: collapse } → restore separate
       * [3] Tailwind * { border-width: 0 } → restore input/textarea default borders
       * [4] Define .heading and .bodytext (lowercase) — form uses lowercase but
       *     sunbiz_style.css only defines .Heading and .BodyText (case-sensitive)
       * [5] Undo sunbiz_dos_style.css #content { font-size: 1.1em } em-inflation
       * [6] Tighten outer table row padding
       * [7] Restore link colours and underlines
       */}
      <style>{`
        /* [1] Undo layout.tsx body flex + min-height. */
        body {
          display: block !important;
          flex-direction: initial !important;
          align-items: initial !important;
          min-height: auto !important;
          line-height: normal !important;
        }

        /* [2] Restore table border-collapse so cellspacing HTML attributes work */
        #wrapper table {
          border-collapse: separate !important;
        }

        /* [3] Restore input/textarea/select default borders and appearance. */
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

        /* [4a] .heading — fix case mismatch + medium font keyword */
        .heading {
          font: bold 13px Arial, sans-serif !important;
          border-bottom: 1px solid #333 !important;
          color: #333 !important;
        }

        /* [4b] .bodytext — fix case mismatch */
        .bodytext {
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 9pt !important;
          font-weight: normal;
          color: #000000;
        }

        /* [5] Undo #content { font-size: 1.1em } em-inflation */
        #wrapper #content {
          font-size: 1em !important;
        }

        /* [6] Tighten outer table row padding */
        #wrapper #detailtable > form > table > tbody > tr > td {
          padding-top: 2px !important;
          padding-bottom: 2px !important;
        }

        /* [7] Restore link colours and underlines */
        #wrapper a:link,
        #wrapper a:visited {
          color: #236faf !important;
          text-decoration: underline !important;
        }
        #wrapper a:hover {
          color: #5582a9 !important;
        }
      `}</style>

      {/*
       * Single wrapper div — minimum React wrapper for dangerouslySetInnerHTML.
       * Sunbiz CSS targets #wrapper / #content / #dosbanner — not this div.
       */}
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}
