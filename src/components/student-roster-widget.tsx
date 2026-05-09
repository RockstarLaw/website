import Link from "next/link";

import type {
  ProfessorCourseDetail,
  StudentRosterRow,
} from "@/lib/supabase/queries";

// ─── DASH-2: Student Roster widget ────────────────────────────────────────
// Centerpiece widget on the professor dashboard. Course selector at top,
// 6-column grid below. TAs appear inline with a "TA" chip. Reserved columns
// (4–6) are placeholders for future per-student data — kept blank for now.
//
// Course selection is URL-state via the ?course=<professorCourseId> query
// param so deep-linking and back/forward work without client-side state.

const inputClassName =
  "rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 transition hover:border-red-700 hover:text-red-700";
const inputClassNameActive =
  "rounded-full border border-red-700 bg-red-700 px-3 py-1 text-sm font-semibold text-white";

function courseLabel(c: ProfessorCourseDetail): string {
  const parts = [c.courseName];
  if (c.sectionName) parts.push(`§ ${c.sectionName}`);
  if (c.term) parts.push(c.term);
  return parts.join(" · ");
}

function fullName(row: StudentRosterRow): string {
  const middle = row.middleName ? ` ${row.middleName}` : "";
  return `${row.firstName}${middle} ${row.lastName}`.trim();
}

export function StudentRosterWidget({
  courses,
  selectedCourseId,
  rosterRows,
}: {
  courses: ProfessorCourseDetail[];
  selectedCourseId: string | null;
  rosterRows: StudentRosterRow[];
}) {
  const selectedCourse = courses.find(
    (c) => c.professorCourseId === selectedCourseId,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      {/* ── Header: title + course selector ─────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Student Roster
          </h2>
          {selectedCourse ? (
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {rosterRows.length} {rosterRows.length === 1 ? "student" : "students"}
            </span>
          ) : null}
        </div>

        {courses.length === 0 ? (
          <p className="text-sm text-slate-500">
            No courses yet. Add a course to start building rosters.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => {
              const isActive = c.professorCourseId === selectedCourseId;
              return (
                <Link
                  key={c.professorCourseId}
                  href={`/dashboard/professor?course=${encodeURIComponent(c.professorCourseId)}#roster`}
                  className={isActive ? inputClassNameActive : inputClassName}
                  aria-current={isActive ? "page" : undefined}
                >
                  {courseLabel(c)}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Body: roster table ──────────────────────────────────────────── */}
      <div id="roster" className="pt-4">
        {!selectedCourseId ? (
          <p className="text-sm text-slate-500">
            Select a course above to view its roster.
          </p>
        ) : rosterRows.length === 0 ? (
          <p className="text-sm text-slate-500">
            No active roster for{" "}
            <span className="font-medium text-slate-700">
              {selectedCourse ? courseLabel(selectedCourse) : "this course"}
            </span>
            . Upload a CSV roster from the course panel to populate this list.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="w-12 py-2 pr-2">#</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="w-28 py-2 pr-3">Year</th>
                  <th className="py-2 pr-3 text-slate-300">Reserved</th>
                  <th className="py-2 pr-3 text-slate-300">Reserved</th>
                  <th className="py-2 pr-3 text-slate-300">Reserved</th>
                </tr>
              </thead>
              <tbody>
                {rosterRows.map((row, idx) => (
                  <tr
                    key={row.rosterEntryId}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-2 pr-2 text-slate-500">{idx + 1}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900">{fullName(row)}</span>
                        {row.isTA && (
                          <span
                            className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800"
                            title={
                              row.taStatus === "accepted"
                                ? "Teaching assistant"
                                : "TA invitation pending"
                            }
                          >
                            {row.taStatus === "pending" ? "TA · pending" : "TA"}
                          </span>
                        )}
                        {row.matchStatus === "needs_review" && (
                          <span
                            className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
                            title="Roster entry pending professor review"
                          >
                            Review
                          </span>
                        )}
                        {row.matchStatus === "no_match" && (
                          <span
                            className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                            title="No matching student account"
                          >
                            Unmatched
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-700">
                      {row.lawSchoolYear ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2 pr-3 text-slate-300">—</td>
                    <td className="py-2 pr-3 text-slate-300">—</td>
                    <td className="py-2 pr-3 text-slate-300">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
