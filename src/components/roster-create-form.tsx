"use client";

import { useActionState, useState } from "react";

import { createRoster, initialRosterState } from "@/lib/rosters/actions";
import type { ProfessorCourseOption } from "@/lib/supabase/queries";

export function RosterCreateForm({
  professorCourses,
}: {
  professorCourses: ProfessorCourseOption[];
}) {
  const [state, formAction, pending] = useActionState(createRoster, initialRosterState);
  const [entryMode, setEntryMode] = useState<"csv" | "manual">("manual");

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2">
        <span>Course</span>
        <select name="professorCourseId" required>
          <option value="" disabled defaultValue="">
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
        <span>Section name</span>
        <input name="sectionName" required />
      </label>

      <label className="grid gap-2">
        <span>Term</span>
        <input name="term" required placeholder="Fall 2026" />
      </label>

      <fieldset className="grid gap-2">
        <legend>Entry mode</legend>
        <label>
          <input
            type="radio"
            name="entryMode"
            value="manual"
            checked={entryMode === "manual"}
            onChange={() => setEntryMode("manual")}
          />
          Manual entry
        </label>
        <label>
          <input
            type="radio"
            name="entryMode"
            value="csv"
            checked={entryMode === "csv"}
            onChange={() => setEntryMode("csv")}
          />
          CSV upload
        </label>
      </fieldset>

      {entryMode === "manual" ? (
        <label className="grid gap-2">
          <span>Manual entries</span>
          <textarea
            name="manualEntries"
            rows={8}
            placeholder={"Jane,Marie,Doe\nJohn,,Smith"}
          />
        </label>
      ) : (
        <label className="grid gap-2">
          <span>CSV file</span>
          <input type="file" name="csvFile" accept=".csv,text/csv" />
        </label>
      )}

      {state.error ? <p>{state.error}</p> : null}
      {state.success ? <p>{state.success}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Creating roster..." : "Create roster"}
      </button>
    </form>
  );
}
