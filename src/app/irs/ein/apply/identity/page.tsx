/**
 * IRS EIN Wizard Step 2 — Identity / Responsible Party (Phase IRS-W2)
 *
 * 1:1 clone of the IRS sa.www4.irs.gov/applyein/identityOfEntities page.
 * HTML chrome (header, breadcrumbs, stepper, section headings, footer)
 * stored at public/irs/wizard-step-2.html and served via
 * dangerouslySetInnerHTML. The interactive form area (name fields, SSN/ITIN,
 * role radio, navigation buttons) is rendered by the <IdentityForm /> client
 * component, portaled into #w2-form-portal.
 *
 * PUBLIC PAGE — no auth gate. Same convention as W0/W1. Session persistence
 * requires auth and is handled in the server action (actions.ts).
 *
 * CSS: Reuses /irs/page-w0/index-D-QGvqqz.css — W2 capture CSS bundle is
 * byte-for-byte identical (same filename: index-D-QGvqqz.css). No separate
 * page-w2/ asset folder needed.
 *
 * Inherited accepted deviation from W0/W1: FA magnifying-glass search icon
 * in the IRS header may not render (same root cause, same accepted state).
 */

import { readFileSync } from "fs";
import { join } from "path";

import IdentityForm from "./IdentityForm";

export const dynamic = "force-dynamic";

export default function IrsEinIdentityPage() {
  // ── Read the pre-transformed static HTML ────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/irs/wizard-step-2.html"),
    "utf-8",
  );

  // Extract body innerHTML
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  return (
    <>
      {/*
       * React 19 hoists <link> to <head>.
       * Reuse the W0 CSS bundle — W2 capture CSS is byte-for-byte identical.
       */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" crossOrigin="" href="/irs/page-w0/index-D-QGvqqz.css" />

      {/*
       * Tailwind Preflight + External Icon fix — verbatim from W0/W1 page.tsx.
       * Root layout applies display:flex to <body>; this SPA expects block flow.
       * External-link SVG icons need inline display to render within link text.
       */}
      <style>{`
        body {
          display: block !important;
          flex-direction: initial !important;
          align-items: initial !important;
          min-height: auto !important;
          background-color: initial !important;
        }
        svg.external-icon {
          display: inline !important;
          vertical-align: text-top !important;
        }
        /*
         * Helptip inline fix — the IRS SPA CSS rule
         * ._fixHelptipStyling_bppll_24 span>h3{display:inline-block!important}
         * does not fire correctly in server-rendered context because the outer
         * span chain defaults to block. Force inline so the ? icon sits on the
         * same line as the label text, matching the reference screenshot.
         */
        ._fixHelptipStyling_bppll_24,
        ._fixHelptipStyling_bppll_24 > span {
          display: inline !important;
          vertical-align: middle !important;
        }
      `}</style>

      {/*
       * Full HTML rendered as a single block — avoids the broken-div-tree
       * problem that occurs when splitting into pre/post chunks.
       * wizard-step-2.html has an empty <div id="w2-form-portal"> in place of
       * the captured .personInputs div; IdentityForm portals its JSX into that
       * target after mount.
       */}
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />

      {/* Portal: renders into #w2-form-portal inside the IRS chrome */}
      <IdentityForm />
    </>
  );
}
