import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";

export default function WhyRockstarPage() {
  return (
    <SiteShell
      eyebrow="Why RockStar?"
      title="Train Here. Litigate Anywhere."
      description="Why RockStar Law exists, and what it is meant to fix."
    >
      <div className="grid gap-6">
        <ContentCard title="Opening hook">
          <p>Law school teaches theory...</p>
        </ContentCard>

        <ContentCard title="Tagline">
          <p>Train Here. Litigate Anywhere.</p>
        </ContentCard>

        <ContentCard title="Problem section">
          <p>
            Traditional legal education often leaves students strong on doctrine but light on the
            day-to-day systems, workflows, and practical operating habits that define modern legal
            work.
          </p>
        </ContentCard>

        <ContentCard title="Solution section">
          <p>
            RockStar Law gives students, professors, and institutions a practical bridge between the
            classroom and the real machinery of legal practice through guided onboarding, matching,
            and structured training paths.
          </p>
        </ContentCard>

        <ContentCard title="Core line">
          <p>Train on the systems...</p>
        </ContentCard>

        <ContentCard title="Next step">
          <Link
            className="inline-flex rounded-xl border border-red-700 bg-red-700 px-4 py-3 font-semibold text-white transition hover:bg-red-800"
            href="/register"
          >
            Get Started
          </Link>
        </ContentCard>
      </div>
    </SiteShell>
  );
}
