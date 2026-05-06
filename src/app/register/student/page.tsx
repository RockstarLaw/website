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

      </div>
    </SiteShell>
  );
}
