import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";

const testimonials = [
  {
    initials: "SP",
    role: "Professor",
    quote: "RockStar Law gives my students a practical bridge between classroom concepts and real workflow expectations.",
  },
  {
    initials: "JL",
    role: "Student",
    quote: "It made the path from law school learning to actual execution feel concrete instead of abstract.",
  },
  {
    initials: "MR",
    role: "Professor",
    quote: "The platform helps us train for the systems lawyers actually touch, not just the cases they read.",
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
        <ContentCard title="Get started">
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
              href="/get-started"
            >
              Get Started
            </Link>
          </div>
        </ContentCard>

        <ContentCard title="Social Proof">
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <div key={`${item.role}-${item.initials}`} className="rounded-xl border border-white/10 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-slate-200">
                  {item.initials}
                </div>
                <p className="text-slate-200">“{item.quote}”</p>
                <p className="mt-3 text-sm text-slate-300">{item.role}</p>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>
    </SiteShell>
  );
}
