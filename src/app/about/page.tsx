import Image from "next/image";

import { SiteShell } from "@/components/site-shell";

const modules = [
  {
    name: "StarBiz",
    iconSrc: "/images/modules/icon_florida_starbiz.png",
    description:
      "RockStar Law's Portal based upon the State of Florida's Business Filings Portal. File articles of incorporations, articles of organization (LLCs), bylaws, membership agreements, annual reports, amendments, fictitious name filings, state trademark applications and more.",
  },
  {
    name: "USPTO",
    iconSrc: "/images/modules/icon_federal_uspto.png",
    description:
      "Search the trademark database, file trademark applications, receive and answer office actions, file renewals, file for incontestability and more.",
  },
  {
    name: "U.S. Copyright Office.",
    iconSrc: "/images/modules/icon_federal_copyright_office.png",
    description:
      "File copyright applications, assign rights, record security interests, file DMCA designated agent registrations, file DMCA Section 1201 exemption petitions, file Notices of Intention and more.",
  },
  {
    name: "Securities Exchange Commission",
    iconSrc: "/images/modules/icon_federal_sec.png",
    description: "File Form Ds, 10-Ks, 10-Qs, 8-Ks, insider transaction reports and more.",
  },
  {
    name: "Internal Revenue Service",
    iconSrc: "/images/modules/icon_federal_irs.png",
    description: "File for Employer Identification Numbers & more",
  },
  {
    name: "State, Federal and International Courts",
    iconSrc: "/images/modules/icon_broward_county_courts.png",
    description:
      "We're adding more state, federal and international courts every month. If we do not feature them already, your local court systems can be ready within five (5) business days of registration.",
  },
];

const modes = [
  {
    name: "Guided",
    description: "Full hints visible. Definitions, warnings, examples. First exposure.",
  },
  {
    name: "Assisted",
    description:
      "Hints on demand. Students attempt independently and ask for help when needed. Where most learning happens.",
  },
  {
    name: "Exam",
    description: "No hints. Real-world conditions. Final assessment.",
  },
] as const;

const dayOneItems = [
  "They have filed LLCs.",
  "They have prosecuted trademark applications through publication.",
  "They have registered copyrights across multiple work types.",
  "They have drafted Form D filings and submitted them through a faithful EDGAR replica.",
  "They have responded to cease-and-desist letters.",
  "They have negotiated entertainment contracts under realistic client constraints.",
] as const;

function SectionHeading({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-semibold uppercase tracking-[0.08em] text-slate-950 md:text-3xl">
        {children}
      </h2>
      <span className="mx-auto block h-0.5 w-10 bg-red-700" aria-hidden="true" />
    </div>
  );
}

function EllipsisDivider() {
  return (
    <div className="my-4 text-center text-xl font-bold leading-none tracking-[0.5em] text-red-700 md:my-5">
      . . .
    </div>
  );
}

export default function AboutPage() {
  return (
    <SiteShell title="About RockStar Law" description="" hideIntro>
      <section className="flex justify-center py-2 md:py-4">
        <div className="w-full max-w-[760px] space-y-8 px-2 text-base leading-7 text-slate-900 md:space-y-10 md:text-lg">
          <header className="space-y-6 border-b border-slate-300 pb-6 text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              ABOUT ROCKSTAR LAW
            </h1>
            <p className="space-y-1 text-lg italic leading-7 text-slate-700 md:text-xl">
              <span className="block">Train Here. Litigate Anywhere.</span>
              <span className="block font-semibold not-italic text-slate-950">Graduate Courtroom Ready.</span>
            </p>
          </header>

          <section className="space-y-8">
            <p className="text-center text-xl font-semibold leading-8 text-slate-950 md:text-2xl">
              Every new lawyer remembers their first real filing.
            </p>

            <p>
              The client signs the engagement letter. The supervising partner says go file this. And
              the new lawyer — top of their class in Business Associations, Trademarks, or Securities
              Reg — opens the actual government system for the first time and discovers that knowing
              the law is not the same as knowing the form.
            </p>

            <div className="overflow-x-auto">
              <div className="flex justify-center gap-6 md:gap-8">
                {[
                  { src: "/images/modules/icon_florida_starbiz.png",          name: "SUNBIZ" },
                  { src: "/images/modules/icon_federal_uspto.png",            name: "USPTO" },
                  { src: "/images/modules/icon_federal_copyright_office.png", name: "eCO" },
                  { src: "/images/modules/icon_federal_sec.png",              name: "EDGAR" },
                  { src: "/images/modules/icon_federal_irs.png",              name: "IRS" },
                  { src: "/images/modules/icon_broward_county_courts.png",   name: "Court e-Filing" },
                ].map(({ src, name }) => (
                  <Image
                    key={name}
                    src={src}
                    alt={name}
                    title={name}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p>
                Each one has its own logic, its own terminology, its own quirks, its own buried
                buttons and inscrutable validation rules.
              </p>
              <p>Each one takes hours to navigate the first time and minutes once you know it.</p>
            </div>

            <div className="space-y-4 border-y border-slate-300 py-8 text-center">
              <p className="text-slate-700">
                A first copyright filing can take <span className="font-semibold text-red-700">three hours.</span>
              </p>
              <p className="font-semibold text-slate-950">The tenth takes fifteen minutes.</p>
              <p className="pt-2 text-slate-700">
                A first Form D between the SEC and EDGAR can take <span className="font-semibold text-red-700">a full day.</span>
              </p>
              <p className="font-semibold text-slate-950">The tenth takes forty minutes.</p>
            </div>

            <p>
              That gap is where billable hours go to die — or where new lawyers build the operational
              fluency that defines the rest of their careers.
            </p>

            <p className="text-center text-xl font-semibold italic leading-8 text-red-700 md:text-2xl">
              Rockstar Law moves that learning curve into law school.
            </p>

            <p className="text-center text-lg italic leading-8 text-slate-950 md:text-xl">
              Rockstar Law is the first platform that lets law students train on faithful replicas of
              the actual filing systems they will use in practice.
            </p>

            <div className="space-y-3 text-center italic text-slate-900">
              <p>Not slideshow walkthroughs.</p>
              <p>Not screenshots in a casebook.</p>
              <p>Not abstract descriptions of what the system &ldquo;does.&rdquo;</p>
            </div>

            <p>
              The actual interface — same fields, same validation rules, same workflow, same dated
              government UX — recreated as a training environment where students can fail, retry, and
              develop fluency without a client&apos;s clock running.
            </p>

            <p className="text-center text-sm font-semibold uppercase tracking-[0.12em] text-red-700">
              Six modules, expanding
            </p>

            <div className="border-t border-slate-300">
              {modules.map((module) => (
                <div
                  key={module.name}
                  className="grid gap-1 border-b border-slate-300 py-5 md:grid-cols-[160px_1fr] md:gap-6"
                >
                  <div className="flex items-center">
                    <Image
                      src={module.iconSrc}
                      alt={module.name}
                      title={module.name}
                      width={120}
                      height={120}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="italic text-slate-700">{module.description}</div>
                </div>
              ))}
            </div>

            <p>
              Plus a growing library of practice simulation projects — drafted by working
              entertainment, IP, and business attorneys based on real matters. Contract drafting,
              multi-party negotiation, client counseling, issue-spotting across overlapping areas of
              law. The work that fills a transactional lawyer&apos;s actual day.
            </p>
          </section>

          <EllipsisDivider />

          <section className="space-y-8">
            <SectionHeading>WHY THE UGLY UX IS THE POINT</SectionHeading>

            <p>
              A reasonable person looking at our replicas might ask why the interface looks like it
              was designed in 1998.
            </p>

            <p className="text-center text-xl font-semibold italic leading-8 text-red-700 md:text-2xl">
              Because that&apos;s exactly what it looks like in real life.
            </p>

            <p>
              This is the most important design decision the platform has made. The instinct to
              &ldquo;modernize&rdquo; government UX would feel impressive in a demo. It would also be useless
              training. A graduate who has practiced on a clean redesign of Sunbiz will be slowed
              down on every line of the actual Sunbiz on day one of practice. A graduate who has
              practiced on a faithful replica recognizes the patterns immediately.
            </p>

            <div className="space-y-3 text-center">
              <p className="text-lg font-semibold leading-8 text-slate-950 md:text-xl">
                Government interfaces are dated, inconvenient, and sometimes genuinely confusing.
              </p>
              <p className="text-lg italic leading-8 text-slate-950 md:text-xl">
                They are also <span className="font-semibold not-italic">where the work happens.</span>
              </p>
            </div>

            <p className="text-center">
              We replicate them as they are
              <br />
              because <span className="font-semibold">that&apos;s the point of training.</span>
            </p>
          </section>

          <EllipsisDivider />

          <section className="space-y-8">
            <SectionHeading>HOW THE PLATFORM WORKS FOR PROFESSORS</SectionHeading>

            <p className="text-center text-lg font-semibold leading-8 text-slate-950 md:text-xl">
              Three modes for every module.
              <br />
              The interface never changes — only the <span className="italic font-normal">support layer</span>{" "}
              does.
            </p>

            <div className="border-t border-slate-300">
              {modes.map((mode) => (
                <div key={mode.name} className="border-b border-slate-300 py-6">
                  <p className="mb-2 text-lg font-semibold uppercase tracking-[0.1em] text-red-700 md:text-xl">
                    {mode.name}
                  </p>
                  <p className="text-[17px] leading-7 text-slate-700">{mode.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <p>
                Professors set the mode per assignment. Same module covers introduction, mid-course
                practice, and final exam.
              </p>
              <p>
                AI-assisted grading runs against rubrics built by practicing attorneys, refined
                through real student submissions. Field-level accuracy on filings. Substantive
                evaluation on memoranda and contracts. Final grading authority always rests with the
                professor.
              </p>
              <p>
                Roster matching handles the inevitable name variations between official enrollment
                lists and the names students actually go by. Submissions, grades, and feedback flow
                through the platform.
              </p>
              <p>
                Free professor accounts. Student subscriptions individually or through institutional
                licensing. Institutional registration unlocks course catalog integration and
                FERPA-compliant data handling.
              </p>
            </div>
          </section>

          <EllipsisDivider />

          <section className="space-y-8">
            <SectionHeading>YOUR GRADUATES CAN BE COURTROOM READY DAY ONE</SectionHeading>

            <p className="text-center text-lg italic leading-8 text-slate-950 md:text-xl">
              Adopt Rockstar Law and your graduates arrive at their first job already fluent in the
              systems that consume the first six months of every new lawyer&apos;s career.
            </p>

            <ul className="space-y-4">
              {dayOneItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="font-semibold leading-7 text-red-700" aria-hidden="true">
                    →
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-4">
              <p>When their supervising partner says go file this, they know what that actually means.</p>
              <p>They know what to ask before they touch the system.</p>
              <p>They know how long it should take.</p>
              <p>
                They know what mistakes to avoid because they have already made those mistakes — in
                the classroom, where the cost of a mistake is a learning moment instead of a
                malpractice exposure.
              </p>
            </div>

            <p className="text-center text-xl font-semibold italic leading-8 text-red-700 md:text-2xl">
              Finding work as a lawyer is easy if you can earn your firm money on your first day...that&apos;s why RockStar Law was created.
            </p>
          </section>

          <EllipsisDivider />

          <section className="space-y-8">
            <SectionHeading>THE BOTTOM LINE</SectionHeading>

            <div className="space-y-4">
              <p>Practice does not make perfect. It makes permanent. &ldquo;How&rdquo; you practice is important.</p>
            </div>

            <p className="space-y-1 text-center text-xl font-semibold uppercase tracking-[0.05em] text-slate-950 md:text-2xl">
              <span className="block">Train Here. Litigate Anywhere.</span>
              <span className="block">Graduate Courtroom Ready.</span>
            </p>
          </section>
        </div>
      </section>
    </SiteShell>
  );
}
