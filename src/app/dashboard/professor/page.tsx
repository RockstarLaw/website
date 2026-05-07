import { SiteShell } from "@/components/site-shell";
import { ProfessorCoursePanel } from "@/components/professor-dashboard-client";
import { ProfessorProjectsWidget } from "@/components/professor-projects-widget";
import { getRandomGreeting } from "@/lib/greetings";
import {
  getCurrentProfessorDashboardData,
  getProfessorDashboardCourses,
  getProfessorProjects,
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

  const [courses, projects] = await Promise.all([
    getProfessorDashboardCourses(dashboard.professorId),
    getProfessorProjects(dashboard.professorId),
  ]);
  const greeting = getRandomGreeting();

  return (
    <SiteShell title="Professor Dashboard" description="" hideIntro>
      <div className="flex flex-col gap-12">

        {/* ── Greeting ────────────────────────────────────────────────── */}
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

        {/* ── Course panel (client: CTAs + selector + body) ───────────── */}
        <ProfessorCoursePanel courses={courses} />

        {/* ── MY PROJECTS widget ──────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              MY PROJECTS
            </h2>
            <div className="mt-1 h-0.5 w-12 bg-red-700" />
          </div>
          <ProfessorProjectsWidget projects={projects} />
        </section>

      </div>
    </SiteShell>
  );
}
