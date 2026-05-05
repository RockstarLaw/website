import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";
import { accountTypes } from "@/lib/registration";

export default function RegisterPage() {
  return (
    <SiteShell
      eyebrow="Registration"
      title="Choose your account type"
      description="RockStar Law registration begins by routing each user into the correct onboarding flow: student, professor, or school representative."
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        Already have an account? <Link className="text-red-700 hover:text-red-800" href="/login">Go to login</Link>.
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {accountTypes.map((type) => (
          <ContentCard key={type.slug} title={type.title}>
            <p>{type.description}</p>
            <Link
              href={type.href}
              className="mt-5 inline-flex rounded-full border border-red-700 bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800"
            >
              Start {type.title} registration
            </Link>
          </ContentCard>
        ))}
      </div>
    </SiteShell>
  );
}
