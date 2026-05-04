import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { ProfessorRegistrationForm } from "@/components/professor-registration-form";
import { SiteShell } from "@/components/site-shell";
import { getSchoolOptions } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function ProfessorRegistrationPage() {
  const schools = await getSchoolOptions();

  return (
    <SiteShell
      eyebrow="Professor onboarding"
      title="Professor registration"
      description="This page now creates a real professor auth account and professor profile row in Supabase. New professor accounts start pending approval."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContentCard title="Create your professor account">
          <ProfessorRegistrationForm schools={schools} />
        </ContentCard>
        <ContentCard title="Registration notes">
          <ul className="grid gap-2 text-slate-200">
            <li>Professor records are tied to a selected school.</li>
            <li>Approval status begins as pending.</li>
            <li>Course and roster setup comes next.</li>
          </ul>
          <p className="mt-4">
            Missing school? <Link className="text-amber-300 hover:text-amber-200" href="/register/school">Submit a school request here.</Link>
          </p>
        </ContentCard>
      </div>
    </SiteShell>
  );
}
