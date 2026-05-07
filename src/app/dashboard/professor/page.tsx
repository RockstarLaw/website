import { SiteShell } from "@/components/site-shell";
import { ProfessorCoursePanel } from "@/components/professor-dashboard-client";
import { ProfessorPhotoWidget } from "@/components/professor-photo-widget";
import { ProfessorProjectsWidget } from "@/components/professor-projects-widget";
import { QuoteWidget } from "@/components/quote-widget";
import { getRandomGreeting } from "@/lib/greetings";
import {
  getCurrentProfessorDashboardData,
  getProfessorDashboardCourses,
  getProfessorProjects,
  getRandomApprovedQuote,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function ProfessorDashboardPage() {
  const dashboard = await getCurrentProfessorDashboardData();

  if (!dashboard) {
    return (
      <SiteShell title="Dashboard" description="" hideIntro>
        <p className="text-slate-600">No active professor session found.</p>
      </SiteShell>
    );
  }

  const [courses, projects, randomQuoteRow] = await Promise.all([
    getProfessorDashboardCourses(dashboard.professorId),
    getProfessorProjects(dashboard.professorId),
    getRandomApprovedQuote(),
  ]);

  const greeting = getRandomGreeting();
  const randomQuote = randomQuoteRow
    ? { text: randomQuoteRow.quote, attribution: randomQuoteRow.attribution }
    : null;

  return (
    <SiteShell title="Professor Dashboard" description="" hideIntro>
      <div className="flex flex-col gap-12">

        {/* ── Top section: two-column on desktop, stacked on mobile ──── */}
        <div className="grid gap-8 md:grid-cols-[3fr_2fr] md:items-start">

          {/* Left: greeting + photo widget */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {greeting} Professor {dashboard.lastName}, Esq.
              </h1>
              <div className="mt-2 h-0.5 w-12 bg-red-700" />
              <p className="mt-4 text-base leading-7 text-slate-600">
                Teaching {courses.length} course{courses.length !== 1 ? "s" : ""} at{" "}
                {dashboard.universityName}.
              </p>
              {/* Subscription pill: deferred until billing slice. */}
            </div>

            <ProfessorPhotoWidget
              photoUrl={dashboard.photoUrl}
              photoPath={dashboard.photoPath}
              professorName={dashboard.professorName}
            />
          </div>

          {/* Right: quote widget */}
          <QuoteWidget quote={randomQuote} />
        </div>

        {/* ── Course panel (full-width below top block) ────────────────── */}
        <ProfessorCoursePanel courses={courses} />

        {/* ── MY PROJECTS widget ──────────────────────────────────────── */}
        <ProfessorProjectsWidget projects={projects} />

      </div>
    </SiteShell>
  );
}
