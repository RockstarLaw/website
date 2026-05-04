import { ContentCard } from "@/components/content-card";
import { RosterCreateForm } from "@/components/roster-create-form";
import { SiteShell } from "@/components/site-shell";
import { getProfessorCourseOptions } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function NewRosterPage() {
  const professorCourses = await getProfessorCourseOptions();

  return (
    <SiteShell
      eyebrow="Roster upload"
      title="Upload or create a roster"
      description="This MVP page now creates a roster record plus roster entry records from either manual entry or a CSV upload."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContentCard title="Create roster">
          <RosterCreateForm professorCourses={professorCourses} />
        </ContentCard>
        <ContentCard title="CSV format">
          <p>Header row must include: first_name, middle_name, last_name</p>
          <p>middle_name is optional.</p>
        </ContentCard>
      </div>
    </SiteShell>
  );
}
