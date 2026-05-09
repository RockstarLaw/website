"use server";

import { z } from "zod";

import { requireProfessorAccess, type AccessContext } from "@/lib/auth/access";
import { updateProfessorOnboardingStatus } from "@/lib/onboarding/status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RosterActionState } from "./types";

const rosterSchema = z.object({
  professorCourseId: z.string().trim().uuid("Select a course."),
  sectionName: z.string().trim().min(1, "Section name is required."),
  term: z.string().trim().min(1, "Term is required."),
  entryMode: z.enum(["csv", "manual"]),
  manualEntries: z.string().trim().optional(),
});

type ParsedRosterEntry = {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name_raw: string;
};

function splitCsvLine(line: string) {
  return line
    .split(",")
    .map((part) => part.trim())
    .map((part) => part.replace(/^"|"$/g, ""));
}

function parseManualEntries(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const entries = lines.map((line) => {
    const parts = splitCsvLine(line);

    if (parts.length < 2) {
      throw new Error("Manual entries must include first name and last name.");
    }

    if (parts.length === 2) {
      return {
        first_name: parts[0],
        middle_name: null,
        last_name: parts[1],
        full_name_raw: `${parts[0]} ${parts[1]}`,
      } satisfies ParsedRosterEntry;
    }

    return {
      first_name: parts[0],
      middle_name: parts[1] || null,
      last_name: parts.slice(2).join(" "),
      full_name_raw: line,
    } satisfies ParsedRosterEntry;
  });

  return entries;
}

function parseCsvEntries(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV upload must include a header row and at least one entry.");
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  const firstNameIndex = headers.indexOf("first_name");
  const middleNameIndex = headers.indexOf("middle_name");
  const lastNameIndex = headers.indexOf("last_name");

  if (firstNameIndex === -1 || lastNameIndex === -1) {
    throw new Error("CSV headers must include first_name and last_name.");
  }

  return lines.slice(1).map((line) => {
    const parts = splitCsvLine(line);
    const firstName = parts[firstNameIndex]?.trim();
    const lastName = parts[lastNameIndex]?.trim();

    if (!firstName || !lastName) {
      throw new Error("Each CSV row must include first_name and last_name values.");
    }

    return {
      first_name: firstName,
      middle_name: middleNameIndex === -1 ? null : parts[middleNameIndex]?.trim() || null,
      last_name: lastName,
      full_name_raw: line,
    } satisfies ParsedRosterEntry;
  });
}

export async function createRoster(
  _previousState: RosterActionState,
  formData: FormData,
  accessContext?: AccessContext | null,
): Promise<RosterActionState> {
  // formData.get() returns null for fields that aren't in the DOM at submit
  // time (e.g. manualEntries when CSV mode is selected, hiding the textarea).
  // Zod's z.string().optional() rejects null — coerce to "" / undefined here
  // so the optional field validates regardless of which entry mode is active.
  const parsed = rosterSchema.safeParse({
    professorCourseId: formData.get("professorCourseId"),
    sectionName: formData.get("sectionName"),
    term: formData.get("term"),
    entryMode: formData.get("entryMode"),
    manualEntries: formData.get("manualEntries") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid roster data.",
      success: "",
    };
  }

  try {
    const actor = await requireProfessorAccess(accessContext);
    const admin = createSupabaseAdminClient();
    const { data: professorCourse, error: professorCourseError } = await admin
      .from("professor_courses")
      .select("id, professor_id, course_id, custom_course_name, courses(id, school_id, course_name)")
      .eq("id", parsed.data.professorCourseId)
      .eq("professor_id", actor.professorId)
      .maybeSingle();

    if (professorCourseError) {
      throw new Error(professorCourseError.message);
    }

    if (!professorCourse) {
      throw new Error("Unauthorized.");
    }

    const csvFile = formData.get("csvFile");
    let entries: ParsedRosterEntry[] = [];

    if (parsed.data.entryMode === "csv") {
      if (!(csvFile instanceof File) || csvFile.size === 0) {
        throw new Error("Upload a CSV file.");
      }

      const csvText = await csvFile.text();
      entries = parseCsvEntries(csvText);
    } else {
      entries = parseManualEntries(parsed.data.manualEntries ?? "");
    }

    if (!entries.length) {
      throw new Error("No roster entries were parsed.");
    }

    const course = Array.isArray(professorCourse.courses)
      ? professorCourse.courses[0]
      : professorCourse.courses;

    if (!course) {
      throw new Error("Selected course details were not found.");
    }

    const rosterName = `${course.course_name} - ${parsed.data.term} - ${parsed.data.sectionName}`;

    const { data: roster, error: rosterError } = await admin
      .from("rosters")
      .insert({
        professor_id: professorCourse.professor_id,
        professor_course_id: professorCourse.id,
        school_id: course.school_id,
        roster_name: rosterName,
        term: parsed.data.term,
        section_name: parsed.data.sectionName,
        upload_source: parsed.data.entryMode,
        status: "active",
      })
      .select("id, roster_name, term, section_name, upload_source, status")
      .single();

    if (rosterError || !roster) {
      throw new Error(rosterError?.message ?? "Unable to create roster.");
    }

    const rosterEntriesPayload = entries.map((entry) => ({
      roster_id: roster.id,
      first_name: entry.first_name,
      middle_name: entry.middle_name,
      last_name: entry.last_name,
      full_name_raw: entry.full_name_raw,
      status: "active",
    }));

    const { error: entriesError } = await admin.from("roster_entries").insert(rosterEntriesPayload);

    if (entriesError) {
      throw new Error(entriesError.message);
    }

    const onboarding = await updateProfessorOnboardingStatus(professorCourse.professor_id);

    return {
      error: "",
      success: `Roster created successfully. Roster ID: ${roster.id}. Entries stored: ${rosterEntriesPayload.length}. Professor onboarding status: ${onboarding.onboardingStatus}`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create roster.",
      success: "",
    };
  }
}
