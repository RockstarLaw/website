"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { ProfessorCourseDetail } from "@/lib/supabase/queries";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{children}</h3>
      <div className="mt-1 h-0.5 w-8 bg-red-700" />
    </div>
  );
}

function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function ProfessorCoursePanel({ courses }: { courses: ProfessorCourseDetail[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const selected = courses[selectedIdx];

  return (
    <div className="flex flex-col gap-10">

      {/* ── Three primary CTAs ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/project-shop"
          className="inline-flex rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
        >
          PROJECT SHOP
        </Link>
        <Link
          href="/professor/rosters/new"
          className="inline-flex rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
        >
          Upload Class Roster
        </Link>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("upload-project-form")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="inline-flex rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
        >
          Upload a Project
        </button>
      </div>

      {/* ── Course panel ───────────────────────────────────────────────── */}
      {courses.length === 0 ? (
        <p className="text-sm text-slate-500">No courses yet.</p>
      ) : (
        <>
          {/* Course pulldown bar */}
          <div className="flex items-center gap-4">
            <select
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(Number(e.target.value))}
              className="w-full max-w-sm rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-950 outline-none transition focus:border-red-700"
            >
              {courses.map((course, idx) => (
                <option key={course.professorCourseId} value={idx}>
                  {course.courseName}
                  {course.sectionName ? ` — ${course.sectionName}` : ""}
                  {course.term ? ` (${course.term})` : ""}
                </option>
              ))}
            </select>
            {selected && (
              <Link
                href={`/professor/courses/${selected.professorCourseId}/manage`}
                className="shrink-0 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-red-700 hover:text-slate-950"
              >
                Manage course
              </Link>
            )}
          </div>

          {/* Course body */}
          {selected && (
            <div className="flex flex-col gap-10">

              {/* Roster stats */}
              <section className="flex flex-col gap-4">
                <SectionHeading>Roster</SectionHeading>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatTile
                    label="Matched"
                    value={selected.rosterStats.matched}
                    color="text-green-700"
                  />
                  <StatTile
                    label="Pending review"
                    value={selected.rosterStats.pendingReview}
                    color="text-amber-600"
                  />
                  <StatTile
                    label="Unmatched"
                    value={selected.rosterStats.unmatched}
                    color="text-red-700"
                  />
                  <StatTile
                    label="Not yet registered"
                    value={selected.rosterStats.notRegistered}
                    color="text-slate-500"
                  />
                </div>
              </section>

              {/* Modules */}
              <section className="flex flex-col gap-4">
                <SectionHeading>Modules</SectionHeading>
                {selected.enabledModules.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {selected.enabledModules.map((mod) => (
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
                          width={56}
                          height={56}
                          className="rounded-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No modules enabled for this course.</p>
                )}
              </section>

              {/* Assigned projects */}
              <section className="flex flex-col gap-4">
                <SectionHeading>Assigned projects</SectionHeading>
                <p className="text-sm text-slate-500">No projects assigned to this course yet.</p>
              </section>

            </div>
          )}
        </>
      )}
    </div>
  );
}
