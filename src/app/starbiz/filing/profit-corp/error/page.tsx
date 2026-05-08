/**
 * Profit Corp Validation-Error Page — Retrofit R8-7
 *
 * 1:1 clone of the real Sunbiz coredisp.exe validation-error page (the
 * "INFORMATION MISSING" variant shown when a required field is empty).
 * HTML template stored at public/sunbiz/profit-corp-error.html.
 * Served via dangerouslySetInnerHTML — no React rebuild, no StarBizShell.
 *
 * Auth-gated. Reads the error message from the `msg` query param (URL-encoded).
 * Query param is safe here: the message is user-facing only; real validation
 * is enforced server-side in form/actions.ts. A tampered ?msg= only changes
 * the displayed string — no security impact.
 *
 * Falls back to a generic message if no `msg` param is present.
 *
 * Error page layout: centered Sunbiz chrome + `#errorcontent` div with:
 *   - .errortext  → dark red, 14pt Arial (alias for CSS .ErrorText, case-mismatch fix)
 *   - .msgtext    → black, 10pt Arial (not in Sunbiz CSS; rendered unstyled in capture)
 *
 * Scoped <style> block:
 *   - Same body/table/input resets as other R8 Profit Corp pages.
 *   - Adds .errortext alias (CSS defines .ErrorText PascalCase; capture HTML uses
 *     lowercase class="errortext" — same mismatch pattern as .redtext in review page).
 *   - Adds .msgtext definition (class used in capture HTML but absent from Sunbiz CSS;
 *     renders as black body-size text matching the screenshot).
 */

import { readFileSync } from "fs";
import { join } from "path";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ msg?: string }>;
}

const FALLBACK_ERROR = "An error occurred. Please return to the form and try again.";

export default async function ProfitCorpErrorPage({ searchParams }: Props) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Read error message from query param ──────────────────────────────────────
  const params = await searchParams;
  const rawMsg = params.msg ?? "";
  const errorMessage = rawMsg.trim() ? decodeURIComponent(rawMsg).trim() : FALLBACK_ERROR;

  // ── Read template and substitute placeholder ────────────────────────────────
  let html = readFileSync(
    join(process.cwd(), "public/sunbiz/profit-corp-error.html"),
    "utf-8",
  );

  html = html.replaceAll("{{ERROR_MESSAGE}}", errorMessage);

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
       * Scoped reset — same base as other R8 Profit Corp pages.
       *
       * [A] .errortext alias — capture HTML uses class="errortext" (lowercase);
       *     Sunbiz CSS defines .ErrorText (PascalCase, case-sensitive mismatch).
       *     Mirrors .ErrorText: Arial, 14pt, normal weight, color #992000.
       *     Same fix pattern as .redtext in review/page.tsx (R8-3).
       *
       * [B] .msgtext definition — used in capture HTML but absent from Sunbiz CSS.
       *     Renders as browser-default unstyled <p> in the capture (black, normal
       *     weight). Define explicitly to survive our global CSS resets.
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

        #wrapper #content {
          font-size: 1em !important;
        }

        #wrapper a:link,
        #wrapper a:visited {
          color: #236faf !important;
          text-decoration: underline !important;
        }
        #wrapper a:hover {
          color: #5582a9 !important;
        }

        /* [A] .errortext — lowercase alias for .ErrorText in sunbiz_style.css.
               CSS class matching is case-sensitive; capture HTML uses lowercase.
               Same mismatch + fix as .redtext in review/page.tsx (R8-3). */
        .errortext {
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 14pt !important;
          font-weight: normal !important;
          color: #992000 !important;
        }

        /* [B] .msgtext — absent from Sunbiz CSS; renders as unstyled <p> in capture.
               Screenshot shows black, normal-weight, same-size-as-body text. */
        .msgtext {
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 10pt !important;
          font-weight: normal !important;
          color: #000000 !important;
        }
      `}</style>

      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}
