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
      title="How do you want to use RockStar Law?"
      description="Choose the registration path that matches your role."
    >
      <ContentCard title="Choose one option">
        <div className="grid gap-3">
          {options.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-900 transition hover:border-red-700 hover:bg-slate-50"
            >
              {option.label}
            </Link>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="text-red-700 hover:text-red-800" href="/login">
            Log in
          </Link>
        </p>
      </ContentCard>
    </SiteShell>
  );
}
