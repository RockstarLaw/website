import Image from "next/image";
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
  {
    step: "STEP 1",
    title: "Students Register at RockStar Law",
    body: "Professors assign registration the same way they assign textbooks. Students create their accounts, connect to their school, and enter the course environment their professor controls. From the first login, they are inside a working legal training system, not a static assignment portal.",
    linkLine: "Professors—learn how your students can begin using RockStar Law today.",
  },
  {
    step: "STEP 2",
    title: "Professors Assign Projects",
    body: "Professors assign their own projects or choose from a library of prebuilt assignments included with RockStar Law. Assignments can be matched to course objectives, practice areas, or the specific systems students need to learn.",
    linkLine: "Explore sample projects that show how RockStar Law gamifies real-world legal work.",
  },
  {
    step: "STEP 3",
    title: "Students Practice on Real-World Systems",
    body: "RockStar Law mirrors the systems students will use as attorneys—including the United States Patent and Trademark Office, the Copyright Office, the Securities and Exchange Commission, the Internal Revenue Service, as well as state-level systems such as business entity registration platforms and local courts.",
    linkLine: "See how RockStar Law replicates real-world legal systems.",
  },
  {
    step: "STEP 4",
    title: "Students & Professors Receive Comprehensive Feedback",
    body: "Professors receive detailed, line-by-line feedback to share with students—at a level that would be impossible to deliver at scale in a traditional classroom. The system helps identify what students did, where they struggled, and how their work product can improve.",
    linkLine: "See a sample of comprehensive line-by-line feedback.",
  },
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
          className="flex flex-col gap-8 pt-2 pb-4 md:pt-4 md:pb-6"
          style={{
            backgroundImage: "url('/images/hero-microphone-background.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "left -10% bottom",
            backgroundSize: "min(78vw, 1080px) auto",
            // min-height ties the section to the image's aspect ratio (916/1717 ≈ 0.5335)
            // so the full microphone stays visible as the viewport widens.
            minHeight: "max(340px, calc(min(78vw, 1080px) * 0.5335))",
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
          <div className="grid gap-y-10 md:grid-cols-3 md:gap-x-10 lg:gap-x-14">
            {testimonials.map((item, index) => (
              <article
                key={`${item.role}-${item.initials}`}
                className={`social-proof-item social-proof-item-${index + 1} flex flex-col gap-5`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-700">
                    {item.initials}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold text-slate-900">{item.role}</span>
                    <span className="text-sm text-slate-500">Profile placeholder</span>
                  </div>
                </div>
                <p className="max-w-[24rem] text-lg leading-7 text-slate-900">“{item.quote}”</p>
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-8 py-2 md:gap-10 md:py-4">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">How it Works</h2>
          <div className="grid items-start gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12">
            {howItWorksSteps.map((item) => (
              <div key={item.step} className="flex flex-col gap-3">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">{item.step}</p>
                <div className="flex flex-col gap-3">
                  <h3 className="text-2xl font-bold leading-tight text-slate-950">{item.title}</h3>
                  <span className="h-1 w-14 rounded-full bg-red-700" aria-hidden="true" />
                </div>
                <div className="min-h-[14rem] md:min-h-[16rem]">
                  <p className="max-w-xl text-base leading-7 text-slate-900">{item.body}</p>
                </div>
                <p className="max-w-xl text-sm leading-6 text-slate-700 underline decoration-red-700/60 underline-offset-4 transition hover:text-red-700">
                  {item.linkLine}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid items-start gap-8 py-2 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:gap-10 md:py-4">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col gap-1.5 md:gap-2">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Why RockStar Law?</h2>
              <p className="max-w-4xl text-lg font-medium leading-tight text-slate-900 md:text-2xl">
                Learn the Systems You’ll Use as a Lawyer.
              </p>
              <p className="max-w-4xl text-base leading-6 text-slate-600 md:text-lg">Not “Pretty Close.”</p>
              <p className="max-w-4xl text-base leading-6 text-slate-600 md:text-lg">No hypotheticals.</p>
              <p className="max-w-4xl text-base leading-6 text-slate-600 md:text-lg">Real 1:1 Simulation Learning.</p>
            </div>
            <div>
              <Link
                className="inline-flex rounded-xl border border-red-700 bg-red-700 px-4 py-3 font-semibold text-white transition hover:bg-red-800"
                href="/why-rockstar"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[360px]">
            <Image
              src="/images/why-rockstar-law-operator.png"
              alt="Why RockStar Law"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 360px, 100vw"
            />
          </div>
        </section>

        <section className="grid items-start gap-8 py-2 md:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] md:gap-10 md:py-4">
          <div className="relative mx-auto aspect-square w-full max-w-[360px]">
            <Image
              src="/images/why-simulation-learning-collab.png"
              alt="Why Simulation Learning"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 360px, 100vw"
            />
          </div>
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col gap-1.5 md:gap-2">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Why Simulation Learning?</h2>
              <p className="max-w-5xl text-lg leading-7 text-slate-900 md:text-xl">Dozens of 1:1 Federal, State & International Agency Simulations.</p>
              <p className="max-w-5xl text-lg leading-7 text-slate-900 md:text-xl">Hundreds of Downloadable Assignments.</p>
              <p className="max-w-5xl text-lg leading-7 text-slate-900 md:text-xl">AI-Powered Grading and Feedback… and more.</p>
            </div>
            <div>
              <Link
                className="inline-flex rounded-xl border border-red-700 bg-red-700 px-4 py-3 font-semibold text-white transition hover:bg-red-800"
                href="/why-simulation-learning"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>


      </div>
    </SiteShell>
  );
}
