/**
 * IRS EIN Wizard Landing Page — Phase IRS-W0
 *
 * 1:1 clone of the real IRS "Apply for an Employer Identification Number (EIN)"
 * landing page at sa.www4.irs.gov/applyein/.
 * HTML stored as a transformed static asset at public/irs/wizard-landing.html
 * and served verbatim via dangerouslySetInnerHTML — no React wrappers,
 * no SiteShell, no auth gate. The cloned HTML carries its own complete
 * IRS chrome (header, breadcrumbs, footer).
 *
 * NOTE: This page is from sa.www4.irs.gov (NOT www.irs.gov). Different design
 * system — Vite/React SPA with a single aggregated CSS bundle, no Drupal,
 * no Bootstrap, no Font Awesome, no USWDS sidebar or megamenu.
 *
 * Transformations baked into wizard-landing.html (SESSION_HANDOFF §2):
 *   • All script tags stripped (SPA bundle, GTM, analytics, Akamai bot detection)
 *   • All noscript tags stripped (including Akamai tracking pixel)
 *   • Asset paths rewritten: ./..._files/X → /irs/page-w0/X
 *   • CTA href rewired: sa.www4.irs.gov/applyein/ → /irs/ein/apply/legal-structure
 *     (All classes, text, aria-label preserved verbatim)
 *   • alt="IRS logo" → alt="RockStar IRS logo" (header + footer SVG logos)
 *   • aria-label="Return to IRS Home" → aria-label="Return to RockStar IRS Home"
 *   • Body text: "the Internal Revenue Service will limit" →
 *     "the RockStar IRS will limit" (Restrictions section)
 *   • irs.gov hrefs kept as-is (per 00_PLAN.md)
 *   • skip-nav href (sa.www4.irs.gov/applyein/) kept as-is — only the CTA rewired
 *
 * INFRASTRUCTURE:
 *   • Font files at /public/themes/custom/pup_base/fonts/ are IRS-I1/I2/I3
 *     assets; this SPA uses its own font stack defined in index-D-QGvqqz.css.
 *     No font override needed here.
 *   • Only one CSS file: /irs/page-w0/index-D-QGvqqz.css (93K Vite build).
 *
 * CTA NOTE: /irs/ein/apply/legal-structure will 404 until IRS-W1 ships.
 *   That is expected — this phase (W0) is the landing page only.
 *
 * PUBLIC PAGE: No auth gate — this is a public IRS info/launch page.
 */

import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export default function IrsEinApplyPage() {
  // ── Read the pre-transformed static HTML ────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/irs/wizard-landing.html"),
    "utf-8",
  );

  // Extract body innerHTML — React renders inside the root layout's <body>,
  // so we inject only the body's innerHTML. Head CSS link is hoisted below.
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  return (
    <>
      {/*
       * React 19 automatically hoists <link> and <style> to <head>.
       * This SPA uses a single aggregated Vite CSS bundle — no 4-bundle set.
       * Font files are embedded/referenced within index-D-QGvqqz.css itself.
       */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        crossOrigin=""
        href="/irs/page-w0/index-D-QGvqqz.css"
      />

      {/*
       * Tailwind Preflight Collision Fix — same pattern as IRS-I1/I2/I3.
       * Root layout applies display:flex to <body>; this SPA expects block flow.
       * The SPA's own .flex-wrapper handles internal flex layout via its CSS.
       */}
      <style>{`
        body {
          display: block !important;
          flex-direction: initial !important;
          align-items: initial !important;
          min-height: auto !important;
          background-color: initial !important;
        }
        /*
         * EXTERNAL ICON FIX — Vite/SPA page
         * Tailwind preflight resets all SVG to display:block.
         * The SPA CSS sets vertical-align on .external-icon but omits display,
         * so Tailwind wins and the inline external-link icons become block-level
         * (each icon renders on its own line, breaking inline link text + icon).
         * Override: restore inline rendering for external-link icons.
         */
        svg.external-icon {
          display: inline !important;
          vertical-align: text-top !important;
        }
      `}</style>

      {/*
       * Single wrapper div — minimum wrapper React requires for
       * dangerouslySetInnerHTML. The SPA CSS targets #root / .flex-wrapper /
       * .site / header / .wrapper — not this outer div.
       */}
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}
