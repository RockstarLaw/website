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
        <ContentCard title="What happens next">
          <ul className="grid gap-2 text-slate-700">
            <li>The school is saved with pending_review status.</li>
            <li>Admins can later approve, reject, or normalize it.</li>
            <li>Students and professors can select approved or placeholder schools.</li>
          </ul>
        </ContentCard>
      </div>
    </SiteShell>
  );
}
