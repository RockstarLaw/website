import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";

export default function HomePage() {
  return (
    <SiteShell
      eyebrow="Registration"
      title="Rockstar Law"
      description="Choose the path that fits your account status."
    >
      <ContentCard title="Get started">
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            href="/get-started"
          >
            Get Started
          </Link>
        </div>
      </ContentCard>
    </SiteShell>
  );
}
