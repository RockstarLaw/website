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

const BOTTOM_PAINTINGS = [
  {
    file: "Braingasm_X_Keep_Girls_Out_of_Male_Sports.jpg",
    title: "Keep Girls Out of Mens Sports",
  },
  {
    file: "Braingasm_X_The_Perfect_Body.jpg",
    title: "The Perfect Body",
  },
  {
    file: "Braingasm_X_Love_Is_Love.jpg",
    title: "Love is Love",
  },
  {
    file: "Braingasm_X_No_More_Dumping.jpg",
    title: "No More Dumping",
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

        {/* ── Hero + text block ──────────────────────────────────────── */}
        {/*
          Desktop: painting floats right, prose wraps alongside it (magazine spread).
          Mobile: stacked — painting full-width on top, prose below.
          overflow-hidden on the outer div allows the float to work within the prose.
        */}
        <div className="rtf-content overflow-hidden">
          {/* Float the painting right so prose wraps alongside it on desktop */}
          <div
            className="mb-4 ml-0 w-full md:float-right md:mb-2 md:ml-8 md:w-[45%]"
          >
            <Image
              src="/images/projects/braingasm_x/Braingasm_X_Superman_Arrested_by_Ice.jpg"
              alt="The Man in Steel — Superman on his knees in the custody of federal agents"
              title="The Man in Steel"
              width={480}
              height={720}
              className="w-full rounded-sm object-cover"
              priority
            />
          </div>

          {/* RTF body — formatting preserved via the injected CSS */}
          <div
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>

        {/* Clear the float before the bottom row */}
        <div className="clear-both" />

        {/* ── Four bottom paintings ─────────────────────────────────── */}
        <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {BOTTOM_PAINTINGS.map(({ file, title }) => (
            <div key={file} className="aspect-[2/3] relative overflow-hidden">
              <Image
                src={`/images/projects/braingasm_x/${file}`}
                alt={title}
                title={title}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 25vw, 50vw"
              />
            </div>
          ))}
        </div>

      </div>
    </SiteShell>
  );
}
