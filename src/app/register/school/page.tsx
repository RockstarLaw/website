import { ContentCard } from "@/components/content-card";
import { SchoolRequestForm } from "@/components/school-request-form";
import { SiteShell } from "@/components/site-shell";

export default function SchoolRegistrationPage() {
  return (
    <SiteShell
      title="Open enrollment."
      description="Register your institution. Equip your faculty with real tools. Send graduates into firms ready to do the work, not just talk about it."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContentCard title="Submit a school request">
          <SchoolRequestForm />
        </ContentCard>

      </div>
    </SiteShell>
  );
}
