/**
 * IRS Power of Attorney Info Page — Phase IRS-I3
 *
 * 1:1 clone of the real IRS "Power of attorney and other authorizations" page.
 * HTML stored as a transformed static asset at public/irs/power-of-attorney.html
 * and served verbatim via dangerouslySetInnerHTML — no React wrappers,
 * no SiteShell, no auth gate. The cloned HTML carries its own complete
 * IRS chrome (header, breadcrumbs, nav, footer).
 *
 * Transformations baked into power-of-attorney.html (SESSION_HANDOFF §2):
 *   • Analytics scripts stripped (gtag, gtm, UA, generic, page.js, etc.)
 *   • Drupal runtime JS stripped (drupal-settings-json, js_KDJr..., etc.)
 *   • JS-injected overlays stripped (#addtoany modal, kampyleStyle, sm.25.html)
 *   • Asset paths rewritten: ./..._files/X → /irs/page-3/X
 *   • Title: "… | Internal Revenue Service" → "… | RockStar IRS"
 *   • og:image:alt / twitter:image:alt: "IRS logo" → "RockStar IRS logo"
 *   • irs.gov hrefs kept as-is (per 00_PLAN.md)
 *   • IRS logo SVG kept as-is (no swap — per prior session decision)
 *
 * INFRASTRUCTURE FROM IRS-I1 + IRS-I2 (commits 71dddbf + 0b2e1b1):
 *   • Font Awesome 4.7.0, Glyphicons, Source Sans Pro already on disk at
 *     /public/themes/custom/pup_base/fonts/ — NOT re-downloaded.
 *   • Scoped <style> override pattern proven in src/app/irs/ein/page.tsx.
 *   • Bullet-point Tailwind preflight fix established in IRS-I2.
 *
 * STYLE NOTES:
 *   Same Tailwind preflight collision as IRS-I1/I2:
 *   The root layout applies `display:flex; flex-direction:column` to <body>
 *   via Tailwind utility classes. Overridden in the scoped <style> block.
 *   All other Tailwind resets handled by IRS aggregated CSS specificity.
 *
 * PERMANENTLY ACCEPTED DEVIATION (user-authorized 2026-05-08):
 *   FA magnifying-glass icon in the search submit button does not render.
 *   CSS ::after { content: "\f002" } rule is correct, FA font loads 200,
 *   but icon does not display in real Chrome. Ships as-is — do NOT re-investigate.
 *
 * PUBLIC PAGE: No auth gate — this is a public IRS info page.
 */

import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export default function IrsPowerOfAttorneyPage() {
  // ── Read the pre-transformed static HTML ────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/irs/power-of-attorney.html"),
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
       * IRS CSS paths point to /irs/page-3/ for this page's asset subfolder.
       * Font files at /themes/custom/pup_base/fonts/ are inherited from IRS-I1.
       */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        media="all"
        href="/irs/page-3/css_NVvP9_xN__Mg2RByu9OI--5ZTpMmH8LC8b-qER6dfbU.css"
      />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        media="all"
        href="/irs/page-3/css_yZKZQeQr-6FrHttDTNN7zbNgJyap3lvwbJyU-3QfwV8.css"
      />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        media="print"
        href="/irs/page-3/css_xEYcgzIIMA7tFIeVzSOrKRPyoYDIuxzHyZ88T5D_SPY.css"
      />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        media="all"
        href="/irs/page-3/css_EbWGjClhsStXbsvwOq9iT6yGxHCg86ApUzr4bYwsoHk.css"
      />

      {/*
       * Tailwind Preflight Collision Fix — verbatim from IRS-I1 (src/app/irs/ein/page.tsx).
       * The root layout applies flex layout to <body>; reset to standard block flow.
       * AddToAny overlay modals need display:none restored (a2a CSS was stripped).
       */}
      <style>{`
        body {
          display: block !important;
          flex-direction: initial !important;
          align-items: initial !important;
          min-height: auto !important;
          background-color: initial !important;
        }
        /* AddToAny overlay modals — captured in HTML but a2a CSS stripped.
           Restore display:none so hidden overlays don't pollute layout. */
        .a2a_hide,
        .a2a_menu.a2a_full,
        .a2a_menu.a2a_mini,
        .a2a_overlay {
          display: none !important;
        }
        /*
         * FONT-DISPLAY FIX — IRS-I1 / IRS-I2 / IRS-I3 shared chrome
         * Same override as src/app/irs/ein/page.tsx — see comments there.
         */
        @font-face {
          font-family: FontAwesome;
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('/themes/custom/pup_base/fonts/fontawesome-webfont.woff2?v=4.7.0') format('woff2'),
               url('/themes/custom/pup_base/fonts/fontawesome-webfont.woff?v=4.7.0') format('woff'),
               url('/themes/custom/pup_base/fonts/fontawesome-webfont.ttf?v=4.7.0') format('truetype');
        }
        @font-face {
          font-family: 'Source Sans Pro';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('/themes/custom/pup_base/fonts/source-sans-pro/fonts/sourcesans3-regular.woff2') format('woff2'),
               url('/themes/custom/pup_base/fonts/source-sans-pro/fonts/sourcesans3-regular.woff') format('woff');
        }
        @font-face {
          font-family: 'Source Sans Pro';
          font-style: normal;
          font-weight: 700;
          font-display: swap;
          src: url('/themes/custom/pup_base/fonts/source-sans-pro/fonts/sourcesans3-bold.woff2') format('woff2'),
               url('/themes/custom/pup_base/fonts/source-sans-pro/fonts/sourcesans3-bold.woff') format('woff');
        }
        /*
         * BULLET POINT FIX — IRS article body content
         * Same override as src/app/irs/ein/page.tsx — see comments there.
         */
        .field--name-body ul,
        .field--item ul,
        .pup-article ul {
          list-style: disc !important;
          padding-left: 2em !important;
        }
        .field--name-body ul li,
        .field--item ul li,
        .pup-article ul li {
          list-style: disc !important;
        }
      `}</style>

      {/*
       * Single wrapper div — minimum wrapper React requires for
       * dangerouslySetInnerHTML. IRS CSS targets #navbar / .container /
       * .pup-main-container / footer, not this div.
       */}
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}
