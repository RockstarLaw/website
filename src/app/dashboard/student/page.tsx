import Image from "next/image";
import Link from "next/link";

import { StudentTAInvitations } from "@/components/student-ta-invitations";
import { SiteShell } from "@/components/site-shell";
import {
  getCurrentStudentDashboardData,
  getStudentEnabledModules,
  getStudentTAState,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{children}</h2>
      <div className="mt-1 h-0.5 w-12 bg-red-700" />
    </div>
  );
}

export default async function StudentDashboardPage() {
  const dashboard = await getCurrentStudentDashboardData();

  if (!dashboard) {
    return (
      <SiteShell title="Dashboard" description="" hideIntro>
        <p className="text-slate-600">No active student session found.</p>
      </SiteShell>
    );
  }

  const [modules, taState] = await Promise.all([
    getStudentEnabledModules(dashboard.studentId),
    getStudentTAState(dashboard.studentId),
  ]);

  const displayName = dashboard.preferredName ?? dashboard.firstName;
  const hasProfessors = dashboard.professors.length > 0;
  const professorNames = dashboard.professors.map((p) => p.professorName).join(", ");

  return (
    <SiteShell title="Student Dashboard" description="" hideIntro>
      <div className="flex flex-col gap-12">

        {/* ── Greeting ──────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Hi, {displayName}.
          </h1>
          <div className="mt-2 h-0.5 w-12 bg-red-700" />
          <p className="mt-4 text-base leading-7 text-slate-600">
            {hasProfessors
              ? `You're enrolled with ${professorNames}. Projects will appear here when assigned.`
              : "You haven't selected a professor yet."}
          </p>

          {/* Subscription pill: deferred until billing slice. */}

          {!hasProfessors && (
            <Link
              href="/onboarding/select-professor"
              className="mt-5 inline-flex rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Add a professor
            </Link>
          )}
        </div>

        {/* ── Module launcher ───────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Launch a module</SectionHeading>
          {modules.length > 0 ? (
            <div className="flex flex-wrap gap-5 pt-2">
              {modules.map((mod) => (
                <a
                  key={mod.id}
                  href={mod.module_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={mod.display_name}
                  className="transition hover:opacity-75"
                >
                  <Image
                    src={mod.icon_path}
                    alt={mod.display_name}
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No modules enabled for your courses yet.</p>
          )}
        </section>

        {/* ── TA Invitations (pending — only when non-empty) ──────────────── */}
        {taState.pending.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionHeading>TA Invitations</SectionHeading>
            <StudentTAInvitations pending={taState.pending} />
          </section>
        )}

        {/* ── Your TA Assignments (accepted — only when non-empty) ─────────── */}
        {taState.accepted.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionHeading>Your TA Assignments</SectionHeading>
            <ul className="grid gap-4">
              {taState.accepted.map((row) => (
                <li key={row.assignmentId} className="border-b border-slate-200 pb-4">
                  <p className="font-medium text-slate-950">{row.courseName}</p>
                  <p className="text-sm text-slate-600">{row.professorName}</p>
                  <p className="text-xs text-slate-400">
                    Accepted{" "}
                    {row.acceptedAt
                      ? new Date(row.acceptedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Your courses ──────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Your courses</SectionHeading>
          {hasProfessors ? (
            <ul className="grid gap-2">
              {dashboard.professors.map((item) => (
                <li key={item.professorId} className="text-sm text-slate-700">
                  → {item.courseName} — {item.professorName}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No courses yet.</p>
          )}
        </section>

        {/* ── Your projects ─────────────────────────────────────────────────── */}
        {/* Projects table: future slice. Empty state only. */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Your projects</SectionHeading>
          <p className="text-sm text-slate-500">No projects yet.</p>
        </section>

      </div>
    </SiteShell>
  );
}
