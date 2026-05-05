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

const footerLinks = [
  "About RockStar Law",
  "Announcements",
  "Community",
  "Security Center",
  "University Center",
  "Policies",
  "Affiliates",
  "Product Safety",
  "Tips",
  "Help & Contact",
  "Site Map",
];

const legalLinks = [
  "Accessibility",
  "User Agreement",
  "Privacy",
  "Consumer Health Data",
  "Payments Terms of Use",
  "Cookies",
  "CA Privacy Notice",
  "Your Privacy Choices",
];

export default function HomePage() {
  return (
    <SiteShell
      eyebrow="Registration"
      title="RockStar Law"
      description=""
      hideIntro
    >
      <div className="flex flex-col gap-8 pt-2 pb-8 md:gap-12 md:pt-4 md:pb-12">
        <section
          className="flex min-h-[340px] flex-col gap-8 pt-2 pb-4 md:min-h-[440px] md:pt-4 md:pb-6"
          style={{
            backgroundImage: "url('/images/hero-microphone-background.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "left -10% bottom",
            backgroundSize: "min(78vw, 1080px) auto",
          }}
        >
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 md:text-7xl">
            RockStar Law
          </h1>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-xl border border-red-700 bg-red-700 px-4 py-3 font-semibold text-white transition hover:bg-red-800"
              href="/get-started"
            >
              Get Started
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-8 py-2 md:gap-10 md:py-4">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Social Proof</h2>
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
                    <span className="text-base font-semibold text-slate-900">{item.role}</span>
                    <span className="text-sm text-slate-500">Profile placeholder</span>
                  </div>
                </div>
                <p className="max-w-sm text-lg leading-8 text-slate-900">“{item.quote}”</p>
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-8 py-2 md:gap-10 md:py-4">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {howItWorksSteps.map((step, index) => (
              <div key={step} className="flex flex-col gap-3">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Step {index + 1}</p>
                <p className="text-xl font-medium text-slate-900">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6 py-2 md:gap-8 md:py-4">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Why RockStar?</h2>
          <p className="max-w-4xl text-2xl font-medium leading-tight text-slate-900 md:text-4xl">
            Train on the systems you will actually use after you pass the bar.
          </p>
          <p className="max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
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

        <section className="flex flex-col gap-6 py-2 md:gap-8 md:py-4">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">What you actually do</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            <li className="text-lg text-slate-900">File trademarks</li>
            <li className="text-lg text-slate-900">Run corporate formations</li>
            <li className="text-lg text-slate-900">Manage litigation workflows</li>
            <li className="text-lg text-slate-900">Navigate compliance systems</li>
          </ul>
        </section>

        <footer className="mt-10 bg-slate-100 px-6 py-12 text-slate-800 md:px-8 md:py-14">
          <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm leading-7 md:gap-x-10 md:gap-y-5">
            {footerLinks.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <p className="mt-10 text-sm leading-7 text-slate-700 md:mt-12">
            Copyright © 2026 RockStar Law Education Services Inc. All Rights Reserved.
          </p>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm leading-7 text-slate-700 md:mt-6 md:gap-x-8 md:gap-y-4">
            {legalLinks.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </footer>
      </div>
    </SiteShell>
  );
}
