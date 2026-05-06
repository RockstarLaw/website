import { ContentCard } from "@/components/content-card";
import { SchoolRequestForm } from "@/components/school-request-form";
import { SiteShell } from "@/components/site-shell";

export default function SchoolRegistrationPage() {
  return (
    <SiteShell
      title="Open enrollment."
      description="Law school administrators' number one priority is graduate employment outcomes. You built the rocket. We sell the fuel."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContentCard title="Submit a school request">
          <SchoolRequestForm />
        </ContentCard>

      </div>
    </SiteShell>
  );
}
