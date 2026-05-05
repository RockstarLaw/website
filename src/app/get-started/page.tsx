import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";

const options = [
  {
    label: "I am a Student",
    href: "/register/student",
  },
  {
    label: "I am a Professor or University Administrator",
    href: "/register/professor",
  },
  {
    label: "I represent a School / University",
    href: "/register/school",
  },
];

export default function GetStartedPage() {
  return (
    <SiteShell
      eyebrow="Get Started"
      title="How do you want to use Rockstar Law?"
      description="Choose the registration path that matches your role."
    >
      <ContentCard title="Choose one option">
        <div className="grid gap-3">
          {options.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            >
              {option.label}
            </Link>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-300">
          Already have an account?{" "}
          <Link className="text-amber-300 hover:text-amber-200" href="/login">
            Log in
          </Link>
        </p>
      </ContentCard>
    </SiteShell>
  );
}
