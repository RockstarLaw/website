/**
 * IRS EIN Wizard Step 3 — Addresses (Phase IRS-W3)
 *
 * 1:1 clone of the IRS sa.www4.irs.gov/applyein/addAddresses page.
 * HTML chrome (header, breadcrumbs, stepper, section headings, footer)
 * stored at public/irs/wizard-step-3.html and served via
 * dangerouslySetInnerHTML. The interactive form area (address fields,
 * mailing address radio, navigation buttons) is rendered by the
 * <AddressForm /> client component, portaled into #w3-form-portal.
 *
 * PUBLIC PAGE — no auth gate. Same convention as W0/W1/W2. Session
 * persistence requires auth and is handled in the server action (actions.ts).
 *
 * CSS: Reuses /irs/page-w0/index-D-QGvqqz.css — W3 capture CSS bundle is
 * byte-for-byte identical (same filename: index-D-QGvqqz.css). No separate
 * page-w3/ asset folder needed.
 *
 * Inherited accepted deviations from W0/W1/W2: FA magnifying-glass icon
 * (CSS-only, no JS bundle), help-icon line-wrap (minor layout).
 */

import { readFileSync } from "fs";
import { join } from "path";

import AddressForm from "./AddressForm";

export const dynamic = "force-dynamic";

export default function IrsEinAddressPage() {
  // ── Read the pre-transformed static HTML ────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/irs/wizard-step-3.html"),
    "utf-8",
  );

  // Extract body innerHTML
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  return (
    <>
      {/*
       * React 19 hoists <link> to <head>.
       * Reuse the W0 CSS bundle — W3 capture CSS is byte-for-byte identical.
       */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" crossOrigin="" href="/irs/page-w0/index-D-QGvqqz.css" />

      {/*
       * Tailwind Preflight + External Icon fix — verbatim from W0/W1/W2 page.tsx.
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
         * Helptip inline fix — inherited from W2. Same CSS bundle behavior.
         * Forces the _fixHelptipStyling span chain to stay inline with label text.
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
       * wizard-step-3.html has an empty <div id="w3-form-portal"> in place of
       * the captured <div class="undefined"> form wrapper; AddressForm portals
       * its JSX into that target after mount.
       */}
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />

      {/* Portal: renders into #w3-form-portal inside the IRS chrome */}
      <AddressForm />
    </>
  );
}
