import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";
import { accountTypes } from "@/lib/registration";

export default function RegisterPage() {
  return (
    <SiteShell
      eyebrow="Registration"
      title="Choose your account type"
      description="Rockstar Law registration begins by routing each user into the correct onboarding flow: student, professor, or school representative."
    >
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300">
        Already have an account? <Link className="text-amber-300 hover:text-amber-200" href="/login">Go to login</Link>.
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {accountTypes.map((type) => (
          <ContentCard key={type.slug} title={type.title}>
            <p>{type.description}</p>
            <Link
              href={type.href}
              className="mt-5 inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 font-medium text-white transition hover:bg-amber-400/20"
            >
              Start {type.title} registration
            </Link>
          </ContentCard>
        ))}
      </div>
    </SiteShell>
  );
}
