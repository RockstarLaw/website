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
      title="I got the brains, you got the looks. Let's make lots of money."
      description="Set up your account, train on the same systems real lawyers use in real life, make millions, buy cool stuff."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContentCard title="Create your student account">
          <StudentRegistrationForm schools={schools} />
        </ContentCard>
        <ContentCard title="Registration notes">
          <ul className="grid gap-2 text-slate-700">
            <li>Choose a school that already exists in the system.</li>
            <li>Use your preferred login email plus your university email.</li>
            <li>Professor selection will be added in the next pass.</li>
          </ul>
          <p className="mt-4">
            Missing school? <Link className="text-red-700 hover:text-red-800" href="/register/school">Submit a school request here.</Link>
          </p>
        </ContentCard>
      </div>
    </SiteShell>
  );
}
