import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";
import { StudentRegistrationForm } from "@/components/student-registration-form";
import { getSchoolOptions } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function StudentRegistrationPage() {
  const schools = await getSchoolOptions();

  return (
    <SiteShell
      eyebrow="Student onboarding"
      title="Student registration"
      description="This page now creates a real student auth account and student profile record in Supabase, then signs the student into the Rockstar shell."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContentCard title="Create your student account">
          <StudentRegistrationForm schools={schools} />
        </ContentCard>
        <ContentCard title="Registration notes">
          <ul className="grid gap-2 text-slate-200">
            <li>Choose a school that already exists in the system.</li>
            <li>Use your preferred login email plus your university email.</li>
            <li>Professor selection will be added in the next pass.</li>
          </ul>
          <p className="mt-4">
            Missing school? <Link className="text-amber-300 hover:text-amber-200" href="/register/school">Submit a school request here.</Link>
          </p>
        </ContentCard>
      </div>
    </SiteShell>
  );
}
