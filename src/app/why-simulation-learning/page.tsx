import Image from "next/image";
import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
        {children}
      </h2>
      <div className="mt-2 h-0.5 w-12 bg-red-700" />
    </div>
  );
}

export default async function WhySimulationLearningPage() {
  return (
    <SiteShell title="Why Simulation Learning" description="" hideIntro>
      <div className="mx-auto w-full max-w-[760px] space-y-16 px-2 text-base leading-7 text-slate-900 md:text-lg">

        {/* ── Hero image ────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-full max-w-[480px] overflow-hidden rounded-sm">
            <Image
              src="/images/projects/braingasm_x/Braingasm_X_Superman_Arrested_by_Ice.jpg"
              alt="The Man in Steel — Superman on his knees with federal agents behind him. Oil on canvas."
              width={480}
              height={720}
              className="w-full object-cover"
              priority
            />
          </div>
          <p className="text-center text-sm leading-6 text-slate-500">
            <em>The Man in Steel</em> — oil on canvas, 36&Prime; &times; 24&Prime;.
            <br />
            Catalog estimate: $35,000–$55,000.
            <br />
            From the <em>Braingasm-X v. Marvel &amp; DC</em> Supreme Court record.
          </p>
        </div>

        {/* ── Page title + lede ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Why Simulation Learning
          </h1>
          <p className="mt-4 text-xl italic text-slate-600 md:text-2xl">
            Cases teach the law. Simulations teach the work.
          </p>
        </div>

        {/* ── Section 1 ─────────────────────────────────────────────────── */}
        <section>
          <SectionHeading>The Gap Cases Do Not Fill</SectionHeading>

          <div className="space-y-5">
            <p>
              There is a category of professional judgment that no casebook captures. The case at
              the end of a chapter is already sorted: the issues are isolated, the facts are clean,
              the parties are labeled, the answer is in the opinion. Real practice arrives the other
              way around — issues tangled with each other, facts incomplete or wrong, parties
              operating on bad advice or no advice, and the answer not yet existing because the
              lawyer in the room has not figured it out yet.
            </p>
            <p>
              Casebook pedagogy moves case &rarr; rule &rarr; application. The student reads because
              they are assigned to. The motion is downhill — cases are the input, the rule is the
              output, and engagement is whatever the student manages to muster on top of the
              workload.
            </p>
            <p>Simulation pedagogy reverses the motion.</p>
            <p>
              Image first. Question first. Stakes first. The student is no longer reading cases as
              homework. They are reading <em>toward</em> something. The cases stop being the
              curriculum and become the tools the student needs to answer the question they are
              already invested in.
            </p>
            <p>
              That is a structural change to attention, not a presentation change. It is the
              difference between a 1L who can recite the four factors of fair use and a 1L who is
              hunting through <em>Campbell</em>, <em>Cariou</em>, <em>Warhol</em>, and{" "}
              <em>Dr. Seuss</em> because they are looking for the move that wins their argument.
            </p>
          </div>
        </section>

        {/* ── Section 2 ─────────────────────────────────────────────────── */}
        <section>
          <SectionHeading>The Spark</SectionHeading>

          <div className="space-y-5">
            <p>A thirty-second moment can rewire a class period.</p>
            <p>
              Walk into a fair use lecture and project a 36&Prime; &times; 24&Prime; oil painting of
              Superman on his knees with federal agents standing behind him. The painting was sold at
              auction for between $35,000 and $55,000. DC Comics is asking the Supreme Court to
              enjoin further distribution. Ask the room: Is it fair use?
            </p>
            <p>The image carries two questions into the room simultaneously.</p>
            <p>
              The legal question — is this fair use under 17 U.S.C. § 107 — is the one printed in
              the syllabus. The moral question — <em>should this be allowed</em> — is the one every
              student in the room is silently forming an opinion about. Those two questions are
              different. The gap between them is exactly where § 107 and the First Amendment
              actually live in practice.
            </p>
            <p>
              A student who has not seen that gap thinks fair use analysis is a four-factor
              checklist. A student who has seen it understands why Justice Sotomayor and Justice
              Kagan disagreed in <em>Warhol</em>, and why every fair-use case is really an argument
              about that gap.
            </p>
            <p>
              The image makes the gap visible. Then the cases make sense.
            </p>
            <p>
              That is why a $35,000 painting of Superman is a better opening than a hypothetical
              about a generic copyrighted character. The hypothetical is sterile. The painting has
              weight. Once the painting has weight, the cases have purpose.
            </p>
          </div>
        </section>

        {/* ── Section 3 ─────────────────────────────────────────────────── */}
        <section>
          <SectionHeading>What You Can Only Learn By Doing</SectionHeading>

          <div className="space-y-5">
            <p>
              The painting is the spark. The full project is the practice. Three projects from the
              RockStar Law library:
            </p>

            {/* Subsection A */}
            <div className="space-y-4 border-l-2 border-slate-200 pl-6">
              <p>
                <strong>NIKE v. KOOL KIY.</strong> A street artist comes to the firm having already
                been sued by Nike. He has been with another firm for two years and $200,000 in fees.
                That firm has the case both legally and factually wrong. They told him &ldquo;as
                long as you don&apos;t use the Swoosh, you&apos;re safe.&rdquo; They compared his
                situation to Invicta selling Rolex lookalikes — an analogy that breaks down on
                inspection but sounds compelling at a glance. They assured him he could not lose.
                Now Nike is in federal court and he is asking your firm whether to settle, fight, or
                pivot.
              </p>
              <p>
                What does the student have to do? Untangle bad prior advice without telling the
                client his old lawyers were idiots. Explain why the Invicta analogy is wrong without
                losing the client in doctrine. Identify which of his current activities are
                defensible and which are not. Recognize that the parody slipper company his prior
                lawyers suggested he pivot to is more dangerous than what he is doing now. Build a
                strategy that gets the client out of trouble, into a workable business position, and
                possibly into a licensing relationship with the very company suing him.
              </p>
              <p>
                There is no case in the casebook for that. There is no opinion that walks through
                how to inherit a mess and turn it into a deal. The student learns by doing it.
              </p>
            </div>

            {/* Subsection B */}
            <div className="space-y-4 border-l-2 border-slate-200 pl-6">
              <p>
                <strong>THAT&apos;S EAT-ERTAINMENT!</strong> A new restaurant in Boca Raton is
                raking in cash. The owners have ambitious national expansion plans. They also have a
                dozen serious legal problems they do not know about yet. They have used the names
                &ldquo;Frank&rdquo; and &ldquo;Dino&rdquo; without licensing the publicity rights
                of two deceased entertainers. They have a menu item called &ldquo;Chicken
                Sinatra.&rdquo; Their walls are covered with licensed art (good) and unlicensed
                photographs (bad). Their music runs on a Spotify family plan (worse). They have
                received two demand letters — one from &ldquo;Dead to Rights Licensing&rdquo;
                offering to negotiate a deal, and one from &ldquo;Vader, Lecter &amp; Krueger,
                P.A.&rdquo; demanding immediate cessation. The two letters are written in vastly
                different tones for a reason.
              </p>
              <p>
                What does the student have to do? Read those two letters and understand why they are
                different. Recognize that one is a business invitation and the other is a hammer.
                Identify which issues are existential and which are manageable. Counsel a client who
                is making money toward a path that lets them keep making money while neutralizing the
                actual liability. Find the creative middle path — the one where the firm earns its
                fee by solving the problem, not just naming it.
              </p>
              <p>
                That is reading-into-tone. That is choice-of-words analysis. That is strategic
                counseling under commercial pressure. None of it is in any casebook. The student
                learns it by living it.
              </p>
            </div>

            {/* Subsection C */}
            <div className="space-y-4 border-l-2 border-slate-200 pl-6">
              <p>
                <strong>FRUIT FIGHT: THE BATTLE FOR VALENCIA.</strong> Two clients want the same
                thing. Both have legitimate claims. A traditional adversarial posture sets up a
                fight that destroys value for everyone. The sophisticated answer — the one
                experienced lawyers actually reach for in practice — is to figure out how the two
                parties can work together and create something neither could create alone.
              </p>
              <p>
                What does the student have to do? Override the trained instinct to win the case as
                written. Recognize that the smartest move is to change the question being asked.
                Negotiate a structure that satisfies both clients, preserves both businesses, and
                produces better results than litigation could deliver to either party.
              </p>
              <p>
                That instinct — the instinct to find collaboration where the prompt suggests combat
                — is the difference between a lawyer who bills hours and a lawyer clients return to
                for the rest of their careers. It is not taught in any classroom because it is not
                written down anywhere. It is built by repetition under realistic constraints.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 4 ─────────────────────────────────────────────────── */}
        <section>
          <SectionHeading>What the Filing-System Simulations Add</SectionHeading>

          <div className="space-y-5">
            <p>
              Above the strategic layer, every transactional and IP practice runs on the operational
              layer — the actual government filing systems your students will use the day they sit at
              their first client matter.
            </p>
            <p>
              Sunbiz. USPTO. The Copyright Office&apos;s eCO portal. EDGAR. The IRS EIN
              application. State and federal court e-filing.
            </p>
            <p>
              A first copyright filing takes three hours. The tenth takes fifteen minutes. A first
              Form D between the SEC and EDGAR can take a full day. The tenth takes forty minutes.
              That gap is where the operational fluency of a real practitioner gets built — and it
              gets built by repetition, on the actual interfaces, with the actual quirks, until the
              workflow becomes second nature.
            </p>
            <p>
              RockStar Law replicates those systems faithfully. Same fields. Same validation logic.
              Same dated UX that the agencies forgot to update. Students train on what they will
              actually use, not on a sanitized approximation.
            </p>
          </div>
        </section>

        {/* ── Section 5 ─────────────────────────────────────────────────── */}
        <section>
          <SectionHeading>What Graduates Can Do On Day One</SectionHeading>

          <div className="space-y-5">
            <p>
              Your graduates arrive at their first jobs with a portfolio of completed simulated work
              that mirrors what their supervising partners will hand them.
            </p>
            <p>
              They have inherited messy cases from prior counsel and worked out how to fix them.
              They have read demand letters and understood why the tone matters. They have advised
              clients with serious exposure toward solutions that preserved the business. They have
              spotted issues that were not obvious. They have negotiated agreements between parties
              whose interests looked opposed and turned out to overlap. They have filed simulated
              LLCs, prosecuted simulated trademark applications, registered simulated copyrights, and
              drafted Form D filings through faithful replicas of the agency systems.
            </p>
            <p>
              When their supervising partner says &ldquo;go handle this,&rdquo; they have already
              handled something like it.
            </p>
            <p>
              The first weeks of practice stop being a humbling reveal of everything law school did
              not teach them. Instead, they become the moment your school&apos;s reputation gets
              confirmed in the marketplace.
            </p>
          </div>
        </section>

        {/* ── Section 6 ─────────────────────────────────────────────────── */}
        <section>
          <SectionHeading>The Bottom Line</SectionHeading>

          <div className="space-y-5">
            <p>Cases teach the rules.</p>
            <p>Simulations teach the work.</p>
            <p>
              The image makes the gap visible. The cases make sense once the image has weight. The
              full project builds the judgment. The filing systems build the fluency. The graduate
              walks into their first day having already done the work.
            </p>
            <p className="font-semibold text-slate-950">
              Train Here. Litigate Anywhere. Graduate Courtroom Ready.
            </p>
          </div>
        </section>

        {/* ── CTAs ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 pb-8">
          <Link
            href="/contact"
            className="inline-flex rounded-xl border border-red-700 bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800"
          >
            Request Demo Access
          </Link>
          <Link
            href="/four-ways-to-use"
            className="inline-flex rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-red-700 hover:text-slate-950"
          >
            See Four Ways to Use RockStar Law
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center px-2 py-3 text-sm font-medium text-red-700 transition hover:text-red-800"
          >
            Contact Sales
          </Link>
        </div>

      </div>
    </SiteShell>
  );
}
