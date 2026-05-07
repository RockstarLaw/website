import fs from "fs";
import path from "path";
import Image from "next/image";

import { SiteShell } from "@/components/site-shell";

// Read the static HTML file generated from WHY_SIMULATED_LEARNING.rtf via:
//   textutil -convert html -stdout public/docs/WHY_SIMULATED_LEARNING.rtf
// Regenerate when the RTF changes.
function getRtfHtml(): { css: string; body: string } {
  const filePath = path.join(
    process.cwd(),
    "public/docs/WHY_SIMULATED_LEARNING.html",
  );
  const html = fs.readFileSync(filePath, "utf-8");

  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const css = styleMatch ? styleMatch[1].trim() : "";

  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1].trim() : "";

  return { css, body };
}

// No More Dumping (landscape) moved to text area alongside Superman.
// Bottom row: three full paintings, natural aspect ratios, no crop.
const BOTTOM_PAINTINGS = [
  {
    file: "Braingasm_X_Keep_Girls_Out_of_Male_Sports.jpg",
    title: "Keep Girls Out of Mens Sports",
    width: 1024,
    height: 1536,
  },
  {
    file: "Braingasm_X_The_Perfect_Body.jpg",
    title: "The Perfect Body",
    width: 1024,
    height: 1536,
  },
  {
    file: "Braingasm_X_Love_Is_Love.jpg",
    title: "Love is Love",
    width: 1536,
    height: 1024,
  },
] as const;

export const dynamic = "force-dynamic";

export default async function WhySimulationLearningPage() {
  const { css, body } = getRtfHtml();

  return (
    <SiteShell title="Why Simulation Learning" description="" hideIntro>
      <div className="mx-auto w-full max-w-[760px] px-2">

        {/* Inject the RTF's own CSS so class-based formatting is preserved exactly */}
        <style
          dangerouslySetInnerHTML={{ __html: css }}
        />
        {/* Bring all paragraphs to the 18px size of the first paragraph */}
        <style dangerouslySetInnerHTML={{ __html: "p.p2, p.p3 { font-size: 18px !important; }" }} />

        {/* ── Hero + text block ──────────────────────────────────────── */}
        {/* No More Dumping (landscape) floats left; Superman (portrait) floats right.
            Text wraps in between and continues full-width below both paintings. */}
        <div className="rtf-content overflow-hidden">

          {/* Left float — No More Dumping (landscape 3:2) */}
          <div className="mb-4 mr-0 w-full md:float-left md:mb-2 md:mr-8 md:w-[42%]">
            <Image
              src="/images/projects/braingasm_x/Braingasm_X_No_More_Dumping.jpg"
              alt="No More Dumping"
              title="No More Dumping"
              width={1536}
              height={1024}
              className="w-full h-auto rounded-sm"
              priority
            />
          </div>

          {/* Right float — Superman / The Man in Steel (portrait 2:3) */}
          <div className="mb-4 ml-0 w-full md:float-right md:mb-2 md:ml-8 md:w-[42%]">
            <Image
              src="/images/projects/braingasm_x/Braingasm_X_Superman_Arrested_by_Ice.jpg"
              alt="The Man in Steel — Superman on his knees in the custody of federal agents"
              title="The Man in Steel"
              width={480}
              height={720}
              className="w-full h-auto rounded-sm"
              priority
            />
          </div>

          {/* RTF body — formatting preserved via the injected CSS */}
          <div dangerouslySetInnerHTML={{ __html: body }} />
        </div>

        {/* Clear the floats before the bottom row */}
        <div className="clear-both" />

        {/* ── Three bottom paintings — full images, no crop ─────────── */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {BOTTOM_PAINTINGS.map(({ file, title, width, height }) => (
            <Image
              key={file}
              src={`/images/projects/braingasm_x/${file}`}
              alt={title}
              title={title}
              width={width}
              height={height}
              className="w-full h-auto"
              sizes="(min-width: 768px) 33vw, 100vw"
            />
          ))}
        </div>

      </div>
    </SiteShell>
  );
}
