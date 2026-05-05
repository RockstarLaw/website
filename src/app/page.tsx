import Link from "next/link";

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
    role: "University Administrator",
    quote: "The platform helps us train for the systems lawyers actually touch, not just the cases they read.",
  },
];

const howItWorksSteps = [
  "Register",
  "Train inside real legal systems",
  "Enter practice ready",
];

export default function HomePage() {
  return (
    <SiteShell
      eyebrow="Registration"
      title="RockStar Law"
      description=""
      hideIntro
    >
      <div className="flex flex-col gap-16">
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-xl border border-red-700 bg-red-700 px-4 py-3 font-semibold text-white transition hover:bg-red-800"
              href="/get-started"
            >
              Get Started
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold text-slate-950">Social Proof</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <article
                key={`${item.role}-${item.initials}`}
                className={`social-proof-item social-proof-item-${index + 1} flex flex-col gap-4`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-700 ring-1 ring-slate-200">
                    {item.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">{item.role}</span>
                    <span className="text-sm text-slate-500">Profile placeholder</span>
                  </div>
                </div>
                <p className="max-w-sm text-slate-900">“{item.quote}”</p>
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold text-slate-950">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {howItWorksSteps.map((step, index) => (
              <div key={step} className="flex flex-col gap-2">
                <p className="text-sm text-slate-500">Step {index + 1}</p>
                <p className="text-slate-900">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-slate-950">Why RockStar?</h2>
          <p className="text-slate-900">
            Train on the systems you will actually use after you pass the bar.
          </p>
          <p className="text-slate-600">
            Not on hypotheticals. Not on outdated simulations.
          </p>
          <div>
            <Link
              className="inline-flex rounded-xl border border-red-700 bg-red-700 px-4 py-3 font-semibold text-white transition hover:bg-red-800"
              href="/why-rockstar"
            >
              Learn More
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-slate-950">What you actually do</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            <li className="text-slate-900">File trademarks</li>
            <li className="text-slate-900">Run corporate formations</li>
            <li className="text-slate-900">Manage litigation workflows</li>
            <li className="text-slate-900">Navigate compliance systems</li>
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
