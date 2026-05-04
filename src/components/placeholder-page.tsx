import { ReactNode } from "react";

import { Checklist } from "@/components/checklist";
import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  highlights,
  nextSteps,
  extra,
}: {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  nextSteps: string[];
  extra?: ReactNode;
}) {
  return (
    <SiteShell eyebrow={eyebrow} title={title} description={description}>
      <div className="grid gap-6 lg:grid-cols-2">
        <ContentCard title="Current shell scope">
          <Checklist items={highlights} />
        </ContentCard>
        <ContentCard title="Next implementation steps">
          <Checklist items={nextSteps} />
        </ContentCard>
      </div>
      {extra ? <ContentCard title="Implementation notes">{extra}</ContentCard> : null}
    </SiteShell>
  );
}
