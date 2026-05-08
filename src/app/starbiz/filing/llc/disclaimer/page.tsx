/**
 * LLC Disclaimer Page — Retrofit R7b-1
 *
 * 1:1 clone of the real Sunbiz llc_file.html disclaimer page.
 * The HTML is stored as a transformed static asset at public/sunbiz/disclaimer.html
 * and served verbatim via dangerouslySetInnerHTML — no React component wrappers,
 * no StarBizShell, no EFilingShell.  The cloned HTML carries its own complete
 * chrome (header, breadcrumbs, disclaimer box, footer, dosbanner).
 *
 * Auth gate is enforced here before any HTML is returned.
 *
 * Transformations already baked into disclaimer.html (SESSION_HANDOFF §2):
 *   • Analytics/MM_reloadPage scripts stripped.
 *   • "Florida Department of State" → "RockStar Department of State" (chrome only).
 *   • Asset paths rewritten to /sunbiz/<basename>.
 *   • Form action → /starbiz/filing/llc/form (method=GET).
 *   • "Correct Articles" form disabled.
 *   • Breadcrumb hrefs → /starbiz routes.
 *
 * STYLE NOTES:
 *   The root layout applies Tailwind classes to <body> (flex, min-h-full, bg-white).
 *   We undo those with a scoped <style> block that React 19 hoists to <head>.
 *   The Sunbiz CSS then takes over via its own body / #wrapper / #content rules.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DisclaimerPage() {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Read the pre-transformed static HTML ────────────────────────────────────
  const fullHtml = readFileSync(
    join(process.cwd(), "public/sunbiz/disclaimer.html"),
    "utf-8",
  );

  // Extract the content of <body>…</body> for injection.
  // React renders inside the root layout's <body>, so we inject only the
  // body's innerHTML — the <head> CSS links are added via React 19 <link> hoisting.
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  return (
    <>
      {/*
       * React 19 automatically hoists <link> and <style> to <head>.
       * Loading Sunbiz CSS this way means no FOUC and no layout.tsx changes.
       */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/sunbiz/sunbiz_style.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/sunbiz/sunbiz_dos_style.css" />

      {/*
       * The root layout applies `display:flex; flex-direction:column` to <body>
       * via Tailwind classes.  Those break Sunbiz's `margin:0 auto` centering
       * on #wrapper.  Reset them here — Tailwind classes have no !important so
       * one specificity step is enough, but !important is safest.
       */}
      <style>{`
        body {
          display: block !important;
          flex-direction: initial !important;
          align-items: initial !important;
          min-height: auto !important;
        }
      `}</style>

      {/*
       * Single wrapper div — the minimum wrapper React requires for
       * dangerouslySetInnerHTML.  Sunbiz CSS targets #wrapper / #content /
       * #dosbanner, not this div, so it is visually transparent.
       */}
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}
