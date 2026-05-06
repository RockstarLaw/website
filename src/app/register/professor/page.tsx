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
      title="There's No Eddie Van Halen Without Jimi Hendrix."
      description="Set up your faculty account, build your class roster, and assign work that increases student engagement by gamifying education."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContentCard title="Create your professor account">
          <ProfessorRegistrationForm schools={schools} />
        </ContentCard>
        <ContentCard title="Registration notes">
          <ul className="grid gap-2 text-slate-700">
            <li>Professor records are tied to a selected school.</li>
            <li>Approval status begins as pending.</li>
            <li>Course and roster setup comes next.</li>
          </ul>
          <p className="mt-4">
            Missing school? <Link className="text-red-700 hover:text-red-800" href="/register/school">Submit a school request here.</Link>
          </p>
        </ContentCard>
      </div>
    </SiteShell>
  );
}
