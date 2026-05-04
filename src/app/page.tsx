import Link from "next/link";

import { Checklist } from "@/components/checklist";
import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";

const pillars = [
  "Student onboarding tied to university and professor selection",
  "Professor onboarding with course setup and roster upload",
  "School records that support registered and placeholder institutions",
  "Admin review for ambiguous matches, placeholder schools, and approvals",
];

export default function HomePage() {
  return (
    <SiteShell
      eyebrow="Registration MVP"
      title="Rockstar Law main onboarding system"
      description="This app is the Rockstar shell for student, professor, school, and admin registration flows. It is intentionally separate from the government filing simulation modules."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ContentCard title="MVP focus">
          <Checklist items={pillars} />
        </ContentCard>
        <ContentCard title="Start here">
          <div className="grid gap-3">
            <Link className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 font-medium text-white transition hover:bg-amber-400/20" href="/register">
              Choose account type
            </Link>
            <Link className="rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5" href="/login">
              Login placeholder
            </Link>
            <Link className="rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5" href="/dashboard/admin">
              View admin shell
            </Link>
          </div>
        </ContentCard>
      </div>
    </SiteShell>
  );
}
