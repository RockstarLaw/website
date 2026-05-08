/**
 * IRS EIN Wizard Step 1 — Legal Structure (Phase IRS-W1)
 *
 * 1:1 clone of the IRS sa.www4.irs.gov/applyein/legalStructure page.
 * HTML chrome (header, breadcrumbs, stepper, section headings, footer)
 * stored at public/irs/wizard-step-1.html, split at <!-- ##FORM_AREA## -->
 * and served via dangerouslySetInnerHTML. The interactive form area
 * (radio buttons, conditional LLC section, navigation buttons) is rendered
 * by the <LegalStructureForm /> client component.
 *
 * PUBLIC PAGE — no auth gate. Matches W0 convention (the IRS wizard landing
 * page is publicly accessible). Session creation/update happens in the
 * server action (actions.ts) when the user clicks Continue.
 *
 * CSS: Reuses /irs/page-w0/index-D-QGvqqz.css — W1 capture CSS is identical
 * to W0. No separate page-w1/ asset folder needed.
 *
 * Inherited accepted deviation from W0: FA magnifying-glass search icon in
 * the IRS header may not render (same as IRS-I1 through W0).
 */

import { readFileSync } from "fs";
import { join } from "path";

import LegalStructureForm from "./LegalStructureForm";

export const dynamic = "force-dynamic";

export default function IrsEinLegalStructurePage() {
  // ── Read the pre-transformed static HTML ────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/irs/wizard-step-1.html"),
    "utf-8",
  );

  // Extract body innerHTML
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  return (
    <>
      {/*
       * React 19 hoists <link> to <head>.
       * Reuse the W0 CSS bundle — W1 capture CSS is byte-for-byte identical.
       */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" crossOrigin="" href="/irs/page-w0/index-D-QGvqqz.css" />

      {/*
       * Tailwind Preflight + External Icon fix — verbatim from W0 page.tsx.
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
      `}</style>

      {/*
       * Full HTML rendered as a single block — avoids the broken-div-tree
       * problem that occurs when splitting into pre/post chunks.
       * wizard-step-1.html has an empty <div id="w1-form-portal"> inside
       * .container content__container; LegalStructureForm portals its
       * JSX into that target after mount.
       */}
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />

      {/* Portal: renders into #w1-form-portal inside the IRS chrome */}
      <LegalStructureForm />
    </>
  );
}
