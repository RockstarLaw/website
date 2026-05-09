"use client";

import { useActionState, useState } from "react";

import { createRoster } from "@/lib/rosters/actions";
import { initialRosterState } from "@/lib/rosters/types";
import type { ProfessorCourseOption } from "@/lib/supabase/queries";

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-700";

export function RosterCreateForm({
  professorCourses,
}: {
  professorCourses: ProfessorCourseOption[];
}) {
  const [state, formAction, pending] = useActionState(createRoster, initialRosterState);
  const [entryMode, setEntryMode] = useState<"csv" | "manual">("manual");

  // Empty-courses guard: with `required` on the course <select>, an empty
  // option list silently blocks submit (HTML5 validation tooltip is subtle).
  // Surface this state explicitly so the professor knows they need to add a
  // course before they can create a roster.
  if (professorCourses.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">No courses on file for this professor.</p>
        <p className="mt-1 text-amber-800">
          Add a course from the dashboard&rsquo;s course panel before creating
          a roster.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Course</span>
        <select
          name="professorCourseId"
          required
          defaultValue=""
          className={inputClassName}
        >
          <option value="" disabled>
            Select course
          </option>
          {professorCourses.map((option) => {
            const professorProfile = option.professor_profiles?.[0] ?? null;
            const course = option.courses?.[0] ?? null;
            const professorName = professorProfile
              ? `${professorProfile.first_name} ${professorProfile.last_name}`
              : "Professor";
            const courseName = option.custom_course_name || course?.course_name || "Course";
            return (
              <option key={option.id} value={option.id}>
                {professorName} — {courseName}
              </option>
            );
          })}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Section name</span>
        <input name="sectionName" required className={inputClassName} placeholder="A" />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Term</span>
        <input name="term" required placeholder="Fall 2026" className={inputClassName} />
      </label>

      <fieldset className="grid gap-2 rounded-xl border border-slate-200 p-3">
        <legend className="px-2 text-sm font-medium text-slate-700">Entry mode</legend>
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="radio"
            name="entryMode"
            value="manual"
            checked={entryMode === "manual"}
            onChange={() => setEntryMode("manual")}
            className="accent-red-700"
          />
          Manual entry
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="radio"
            name="entryMode"
            value="csv"
            checked={entryMode === "csv"}
            onChange={() => setEntryMode("csv")}
            className="accent-red-700"
          />
          CSV upload
        </label>
      </fieldset>

      {entryMode === "manual" ? (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Manual entries</span>
          <textarea
            name="manualEntries"
            rows={8}
            placeholder={"Jane,Marie,Doe\nJohn,,Smith"}
            className={`${inputClassName} font-mono text-sm`}
          />
          <span className="text-xs text-slate-500">
            One student per line: <code>first,middle,last</code> (middle optional).
          </span>
        </label>
      ) : (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">CSV file</span>
          <input
            type="file"
            name="csvFile"
            accept=".csv,text/csv"
            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-red-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-red-800"
          />
        </label>
      )}

      {state.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          ⚠ {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-red-700 bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating roster..." : "Create roster"}
      </button>
    </form>
  );
}
