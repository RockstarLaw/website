import Module from "node:module";

import type { AccessContext } from "./src/lib/auth/access.ts";
import {
  registerProfessor,
  registerStudent,
} from "./src/lib/registration/actions.ts";
import type { RegistrationActionState } from "./src/lib/registration/types.ts";
import { createSupabaseAdminClient } from "./src/lib/supabase/admin.ts";
import { getStudentDashboardDataForUser } from "./src/lib/supabase/queries.ts";

const originalLoad = (Module as any)._load;
(Module as any)._load = function patchedLoad(
  request: string,
  parent: NodeModule | null,
  isMain: boolean,
) {
  if (request === "next/cache") {
    return { revalidatePath: () => {} };
  }

  return originalLoad.call(this, request, parent, isMain);
};

type MatchActionState = {
  error: string;
  success: string;
};

type RosterActionState = {
  error: string;
  success: string;
};

const initialRegistrationState: RegistrationActionState = { error: "", success: "" };
const initialRosterState: RosterActionState = { error: "", success: "" };
const initialMatchState: MatchActionState = { error: "", success: "" };

function logStep(message: string, data?: unknown) {
  console.log(`\n=== ${message} ===`);
  if (data !== undefined) {
    console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
  }
}

function requireId(value: string | null, label: string) {
  if (!value) {
    throw new Error(`Unable to determine ${label}.`);
  }

  return value;
}

function makeStudentForm(schoolId: string, email: string, firstName: string, lastName: string) {
  const form = new FormData();
  form.set("firstName", firstName);
  form.set("middleName", "");
  form.set("lastName", lastName);
  form.set("preferredName", "");
  form.set("email", email);
  form.set("password", "Password123!");
  form.set("mobilePhone", "555-000-1000");
  form.set("addressLine1", "123 MVP Run Way");
  form.set("addressLine2", "");
  form.set("city", "Fort Lauderdale");
  form.set("state", "FL");
  form.set("postalCode", "33314");
  form.set("country", "USA");
  form.set("schoolId", schoolId);
  form.set("universityEmail", email);
  form.set("lawSchoolYear", "2L");
  form.set("enrollmentStatus", "full_time");
  form.set("undergraduateInstitution", "MVP Run University");
  return form;
}

function makeProfessorForm(
  schoolId: string,
  email: string,
  firstName: string,
  lastName: string,
  courseName: string,
) {
  const form = new FormData();
  form.set("firstName", firstName);
  form.set("lastName", lastName);
  form.set("email", email);
  form.set("password", "Password123!");
  form.set("mobilePhone", "555-000-2000");
  form.set("addressLine1", "500 Faculty Row");
  form.set("addressLine2", "");
  form.set("city", "Fort Lauderdale");
  form.set("state", "FL");
  form.set("postalCode", "33314");
  form.set("country", "USA");
  form.set("schoolId", schoolId);
  form.set("title", "Professor");
  form.set("selectedCourses", courseName);
  return form;
}

function makeRosterForm(professorCourseId: string, lastName: string, suffix: string) {
  const form = new FormData();
  form.set("professorCourseId", professorCourseId);
  form.set("sectionName", `MVP Section ${suffix}`);
  form.set("term", `MVP Term ${suffix}`);
  form.set("entryMode", "manual");
  form.set("manualEntries", [`John,${lastName}`, `Johnny,${lastName}`, `Noah,Missing${suffix}`].join("\n"));
  return form;
}

async function main() {
  const admin = createSupabaseAdminClient();
  const { createRoster } = await import("./src/lib/rosters/actions.ts");
  const { confirmMatchAction, runRosterMatchingAction } = await import("./src/lib/matching/actions.ts");

  const { data: school, error: schoolError } = await admin
    .from("schools")
    .select("id, name")
    .in("status", ["registered", "placeholder", "pending_review"])
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (schoolError || !school) {
    throw new Error(schoolError?.message ?? "No school available for MVP run.");
  }

  const suffix = Date.now().toString();
  const lastName = `MvpRun${suffix}`;
  const studentEmail = `student.mvp.${suffix}@example.com`;
  const professorEmail = `professor.mvp.${suffix}@example.com`;
  const courseName = `Civil Procedure MVP ${suffix}`;

  logStep("Starting MVP run", {
    schoolId: school.id,
    schoolName: school.name,
    suffix,
  });

  const studentResult = await registerStudent(
    initialRegistrationState,
    makeStudentForm(school.id, studentEmail, "John", lastName),
  );

  if (studentResult.error) {
    throw new Error(studentResult.error);
  }

  logStep("Student created", studentResult.success);

  const { data: studentProfile, error: studentProfileError } = await admin
    .from("student_profiles")
    .select("id, user_id, university_email, onboarding_status")
    .eq("university_email", studentEmail)
    .single();

  if (studentProfileError || !studentProfile) {
    throw new Error(studentProfileError?.message ?? "Student profile not found after registration.");
  }

  const professorResult = await registerProfessor(
    initialRegistrationState,
    makeProfessorForm(school.id, professorEmail, "Pat", `Professor${suffix}`, courseName),
  );

  if (professorResult.error) {
    throw new Error(professorResult.error);
  }

  logStep("Professor created", professorResult.success);

  const { data: professorProfile, error: professorProfileError } = await admin
    .from("professor_profiles")
    .select("id, user_id, email, onboarding_status")
    .eq("email", professorEmail)
    .single();

  if (professorProfileError || !professorProfile) {
    throw new Error(professorProfileError?.message ?? "Professor profile not found after registration.");
  }

  const { data: professorCourse, error: professorCourseError } = await admin
    .from("professor_courses")
    .select("id, course_id, custom_course_name, courses(id, course_name)")
    .eq("professor_id", professorProfile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (professorCourseError || !professorCourse) {
    throw new Error(professorCourseError?.message ?? "Professor course not found after registration.");
  }

  const professorContext: AccessContext = {
    userId: professorProfile.user_id,
    role: "professor",
  };
  const studentContext: AccessContext = {
    userId: studentProfile.user_id,
    role: "student",
  };

  const professorCourseRelation = professorCourse.courses as
    | { course_name?: string }[]
    | { course_name?: string }
    | null;

  logStep("Course created via existing professor registration flow", {
    professorCourseId: professorCourse.id,
    courseId: professorCourse.course_id,
    courseName:
      professorCourse.custom_course_name ||
      (Array.isArray(professorCourseRelation)
        ? professorCourseRelation[0]?.course_name
        : professorCourseRelation?.course_name) ||
      null,
  });

  const rosterResult = await createRoster(
    initialRosterState,
    makeRosterForm(professorCourse.id, lastName, suffix),
    professorContext,
  );

  if (rosterResult.error) {
    throw new Error(rosterResult.error);
  }

  logStep("Roster uploaded", rosterResult.success);

  const { data: roster, error: rosterError } = await admin
    .from("rosters")
    .select("id, roster_name")
    .eq("professor_id", professorProfile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (rosterError || !roster) {
    throw new Error(rosterError?.message ?? "Roster not found after upload.");
  }

  const matchingForm = new FormData();
  matchingForm.set("rosterId", roster.id);
  const matchingResult = await runRosterMatchingAction(
    initialMatchState,
    matchingForm,
    professorContext,
  );

  if (matchingResult.error) {
    throw new Error(matchingResult.error);
  }

  logStep("Matching executed", matchingResult.success);

  const { data: rosterEntries, error: rosterEntriesError } = await admin
    .from("roster_entries")
    .select("id")
    .eq("roster_id", roster.id);

  if (rosterEntriesError) {
    throw new Error(rosterEntriesError.message);
  }

  const rosterEntryIds = (rosterEntries ?? []).map((item) => item.id);
  const { data: matches, error: matchesError } = await admin
    .from("roster_matches")
    .select("id, match_status, match_reason, confidence_score")
    .in("roster_entry_id", rosterEntryIds)
    .order("created_at", { ascending: true });

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  logStep("Match records created", matches);

  const matchToConfirm =
    matches?.find((match) => match.match_status === "needs_review") ??
    matches?.find((match) => match.match_status === "auto_matched") ??
    null;

  const confirmForm = new FormData();
  confirmForm.set("matchId", requireId(matchToConfirm?.id ?? null, "match to confirm"));
  await confirmMatchAction(confirmForm, professorContext);

  const { data: confirmedMatch, error: confirmedMatchError } = await admin
    .from("roster_matches")
    .select("id, match_status, match_reason, confidence_score")
    .eq("id", requireId(matchToConfirm?.id ?? null, "confirmed match id"))
    .single();

  if (confirmedMatchError || !confirmedMatch) {
    throw new Error(confirmedMatchError?.message ?? "Confirmed match could not be reloaded.");
  }

  logStep("Professor confirm action completed", confirmedMatch);

  const studentDashboard = await getStudentDashboardDataForUser(
    studentProfile.user_id,
    studentContext,
  );

  if (!studentDashboard) {
    throw new Error("Student dashboard could not be loaded.");
  }

  logStep("Final student-visible result", studentDashboard);
}

main().catch((error) => {
  console.error("\n=== MVP run failed ===");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});