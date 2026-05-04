import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";

export default function ProfessorRostersPage() {
  return (
    <SiteShell
      eyebrow="Professor workflow"
      title="Roster management"
      description="Create a new roster from manual entry or CSV upload. Matching remains out of scope for this pass."
    >
      <ContentCard title="Roster actions">
        <Link href="/professor/rosters/new">Open roster creation</Link>
      </ContentCard>
    </SiteShell>
  );
}
