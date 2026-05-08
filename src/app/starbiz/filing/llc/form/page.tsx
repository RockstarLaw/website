/**
 * LLC Form Page — Retrofit R7b-2 (retry)
 *
 * 1:1 clone of the real Sunbiz coretype.exe form page.
 * HTML stored as a transformed static asset at public/sunbiz/form.html.
 * Served verbatim via dangerouslySetInnerHTML — no StarBizShell, no EFilingShell,
 * no React form rebuild.
 *
 * Auth gate enforced before any HTML is returned.
 *
 * Transformations baked into form.html (SESSION_HANDOFF §2 / R7b-2):
 *   • Sunbiz.js <script> tag stripped.
 *   • MM_reloadPage Netscape compat <script> block stripped.
 *   • "Florida Department of State" → "RockStar Department of State" (chrome only).
 *   • "Florida Division of Corporations" → "RockStar Division of Corporations" (logo alt).
 *   • Asset paths → /sunbiz/<basename>.
 *   • Form action → /starbiz/filing/llc/review (POST).
 *   • javascript: hrefs → href="#".
 *   • User input values stripped; track_number cleared.
 *   • Form structure params preserved verbatim (filing_type, menu_function,
 *     off*_name_seq, off*_name_type, counter).
 *   • onkeyup / onclick / onkeydown attributes preserved (no-ops without Sunbiz.js).
 *
 * ─── CSS LEAKAGE FIX (diagnosed in R7b-2 retry) ─────────────────────────────
 *
 * The root layout loads globals.css which imports Tailwind v4 (preflight) and
 * applies Tailwind utility classes to <body>.  Four specific preflight rules
 * break the Sunbiz form rendering:
 *
 * 1. `* { border-width: 0 }`
 *    Tailwind preflight zeroes border-width on every element.  Sunbiz CSS never
 *    explicitly sets border-width on <input> / <textarea> — it relies on browser
 *    UA defaults.  Result: inputs have no visible border.
 *    Fix: `#wrapper input, #wrapper textarea, #wrapper select { border-width: revert }`
 *
 * 2. `table { border-collapse: collapse }`
 *    Makes cellspacing HTML attributes meaningless (collapse mode ignores
 *    border-spacing).  The Sunbiz tables use cellspacing="2" for visual breathing
 *    room; with collapse they become packed together.
 *    Fix: `#wrapper table { border-collapse: separate !important }`
 *
 * 3. NOTE: Tailwind v4 does NOT reset `td { padding: 0 }` (only form elements are
 *    reset). HTML `cellpadding` attributes work via browser presentational-hint cascade.
 *    No fix needed for td; adding `padding: revert !important` on td would override
 *    cellpadding attributes (revert → UA = 0, !important beats presentational hints).
 *
 * 4. `.heading` and `.bodytext` (lowercase) are NOT defined in sunbiz_style.css.
 *    Only `.Heading` and `.BodyText` (mixed case) are defined — CSS class names are
 *    case-sensitive so they do not match.  The form HTML uses the lowercase variants
 *    on 8 heading cells and 5 bodytext cells.
 *    Fix: explicitly define `.heading` and `.bodytext` in the scoped <style> block,
 *    mirroring the rules from `.Heading` and `.BodyText` in the Sunbiz CSS.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LLCFormPage() {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Read the pre-transformed static HTML ────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/sunbiz/form.html"),
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
       * Scoped reset — three fixes (see file header for rationale):
       *
       * [1] layout.tsx body flex/min-height (same fix as disclaimer page)
       * [2] Tailwind table { border-collapse: collapse } → restore separate
       * [3] Tailwind * { border-width: 0 } → restore input/textarea default borders
       * [4] Define .heading and .bodytext (lowercase) — form uses lowercase but
       *     sunbiz_style.css only defines .Heading and .BodyText (case-sensitive)
       */}
      <style>{`
        /* [1] Undo layout.tsx body flex + min-height.
               Also: tighten line-height — sunbiz_dos_style.css sets body{line-height:1.5}
               which inflates every text row vs reference. Reference measured at normal/1.0. */
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

        /* [3] Restore input/textarea/select default borders and appearance.
               Tailwind preflight: * { border-width: 0 } kills UA-default input borders. */
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

        /* [4a] .heading — fix case mismatch (.Heading CSS vs class="heading" HTML) AND
                fix 'medium' font keyword: 'medium' = 16px in modern Chrome but ~13px
                in the old browser that captured the reference. Screenshot-measured: 13px. */
        .heading {
          font: bold 13px Arial, sans-serif !important;
          border-bottom: 1px solid #333 !important;
          color: #333 !important;
        }

        /* [4b] .bodytext — fix case mismatch (.BodyText CSS vs class="bodytext" HTML).
                No !important on color/font-weight: some bodytext cells have inline
                style="color:red; font-weight:bolder" which must be able to override. */
        .bodytext {
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 9pt !important;
          font-weight: normal;
          color: #000000;
        }

        /* [5] Undo sunbiz_dos_style.css #content { font-size: 1.1em } em-inflation.
               Reset to 1em to match screenshot pixel spacing. */
        #wrapper #content {
          font-size: 1em !important;
        }

        /* [6] Tighten outer table row padding to match reference.
               Outer form table has cellpadding="4" (4px top+bottom per cell).
               Reference screenshot shows tighter spacing; reduce outer-row top/bottom to 2px.
               Inner tables keep their own cellpadding (not overridden here). */
        #wrapper #detailtable > form > table > tbody > tr > td {
          padding-top: 2px !important;
          padding-bottom: 2px !important;
        }

        /* [7] Restore link colours and underlines.
               globals.css (@layer base) sets: a { color:inherit; text-decoration:none }
               Layered rules lose to unlayered Sunbiz CSS for colour (#236faf from
               sunbiz_style.css a:link), but Sunbiz CSS has NO explicit text-decoration
               on a:link, so the layered text-decoration:none still wins over UA underline.
               Fix: force underline on links inside #wrapper to match reference. */
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
