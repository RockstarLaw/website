import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";

const entryPoints = [
  {
    label: "I am a Student",
    href: "/register/student",
  },
  {
    label: "I am a Professor or University Administrator",
    href: "/register/professor",
  },
  {
    label: "Register My School / University",
    href: "/register/school",
  },
];

export default function HomePage() {
  return (
    <SiteShell
      eyebrow="Registration"
      title="Rockstar Law"
      description="Choose the path that fits your account status."
    >
      <div className="grid gap-6">
        <ContentCard title="Existing users">
          <Link
            className="inline-flex rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            href="/login"
          >
            Login
          </Link>
        </ContentCard>

        <ContentCard title="First time here? Choose your registration path.">
          <div className="grid gap-3">
            {entryPoints.map((item) => (
              <Link
                key={item.href}
                className="rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </ContentCard>
      </div>
    </SiteShell>
  );
}
