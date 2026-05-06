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

      </div>
    </SiteShell>
  );
}
