/**
 * IRS EIN Info Page — Phase IRS-I1
 *
 * 1:1 clone of the real IRS "Get an employer identification number" page.
 * HTML stored as a transformed static asset at public/irs/ein-info.html
 * and served verbatim via dangerouslySetInnerHTML — no React wrappers,
 * no SiteShell, no auth gate. The cloned HTML carries its own complete
 * IRS chrome (header, breadcrumbs, nav, footer).
 *
 * Transformations baked into ein-info.html (SESSION_HANDOFF §2):
 *   • Analytics scripts stripped (gtag, gtm, UA, generic, page.js, etc.)
 *   • Chat scripts stripped (egain, launchva, custoffers)
 *   • JS-injected overlays stripped (#addtoany, #egain-chat-wrapper)
 *   • Asset paths rewritten: ./..._files/X → /irs/page-1/X
 *   • Title: "… | Internal Revenue Service" → "… | RockStar IRS"
 *   • irs.gov hrefs kept as-is (per 00_PLAN.md)
 *   • IRS logo SVG kept as-is (no swap — per diagnosis-step decision)
 *
 * STYLE NOTES:
 *   The root layout applies Tailwind classes to <body> (flex, min-h-full).
 *   We undo those with a scoped <style> block that React 19 hoists to <head>.
 *   IRS USWDS/Drupal CSS then takes over via its own body and layout rules.
 *
 * PUBLIC PAGE: No auth gate — this is a public IRS info page. Matches the
 * public info pattern documented in 00_PLAN.md.
 */

import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export default function IrsEinPage() {
  // ── Read the pre-transformed static HTML ────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/irs/ein-info.html"),
    "utf-8",
  );

  // Extract body innerHTML — React renders inside the root layout's <body>,
  // so we inject only the body's innerHTML. Head CSS links are hoisted below.
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  return (
    <>
      {/*
       * React 19 automatically hoists <link> and <style> to <head>.
       * Loading IRS CSS this way prevents FOUC and requires no layout.tsx
       * changes. The 4 files are Drupal-aggregated bundles containing
       * USWDS + Bootstrap + all IRS custom styles.
       */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        media="all"
        href="/irs/page-1/css_NVvP9_xN__Mg2RByu9OI--5ZTpMmH8LC8b-qER6dfbU.css"
      />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        media="all"
        href="/irs/page-1/css_yZKZQeQr-6FrHttDTNN7zbNgJyap3lvwbJyU-3QfwV8.css"
      />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        media="print"
        href="/irs/page-1/css_xEYcgzIIMA7tFIeVzSOrKRPyoYDIuxzHyZ88T5D_SPY.css"
      />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        media="all"
        href="/irs/page-1/css_EbWGjClhsStXbsvwOq9iT6yGxHCg86ApUzr4bYwsoHk.css"
      />

      {/*
       * Tailwind Preflight Collision Fix
       *
       * The root layout applies `display:flex; flex-direction:column;
       * min-height:100vh` to <body> via Tailwind utility classes.
       * Those break the IRS USWDS/Bootstrap container centering which
       * relies on standard block-level flow. Reset them here.
       *
       * All other Tailwind resets (heading margins, list-style, link colors)
       * are overridden by the IRS aggregated CSS's own specificity.
       */}
      <style>{`
        body {
          display: block !important;
          flex-direction: initial !important;
          align-items: initial !important;
          min-height: auto !important;
          background-color: initial !important;
        }
        /* AddToAny overlay modals survived the HTML strip (nested-div regex limit).
           The a2a CSS that gave them display:none was stripped with analytics;
           restore the minimal hide rule. The visible Share/Print button
           (.a2a_kit.addtoany_list) is not affected by these selectors. */
        .a2a_hide,
        .a2a_menu.a2a_full,
        .a2a_menu.a2a_mini,
        .a2a_overlay {
          display: none !important;
        }
      `}</style>

      {/*
       * Single wrapper div — minimum wrapper React requires for
       * dangerouslySetInnerHTML. IRS CSS targets #navbar / .container /
       * .pup-main-container / footer, not this div, so it is transparent.
       */}
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}
