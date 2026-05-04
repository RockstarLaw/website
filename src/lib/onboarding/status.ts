import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type StoredOnboardingStatus = "started" | "incomplete" | "complete" | "needs_review";
export type ProgressState = "incomplete" | "partially complete" | "fully complete";

export async function updateStudentOnboardingStatus(studentId: string) {
  const admin = createSupabaseAdminClient();
  const { data: student, error: studentError } = await admin
    .from("student_profiles")
    .select("id, university_id")
    .eq("id", studentId)
    .single();

  if (studentError || !student) {
    throw new Error(studentError?.message ?? "Student profile not found.");
  }

  const { count: professorCount, error: linksError } = await admin
    .from("student_professor_links")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .neq("status", "inactive");

  if (linksError) {
    throw new Error(linksError.message);
  }

  const nextStatus: StoredOnboardingStatus = student.university_id && (professorCount ?? 0) > 0
    ? "complete"
    : "incomplete";

  const { error: updateError } = await admin
    .from("student_profiles")
    .update({ onboarding_status: nextStatus })
    .eq("id", studentId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    onboardingStatus: nextStatus,
    progressState: nextStatus === "complete" ? "fully complete" : "incomplete",
    professorCount: professorCount ?? 0,
  };
}

export async function updateProfessorOnboardingStatus(professorId: string) {
  const admin = createSupabaseAdminClient();
  const { data: professor, error: professorError } = await admin
    .from("professor_profiles")
    .select("id, university_id")
    .eq("id", professorId)
    .single();

  if (professorError || !professor) {
    throw new Error(professorError?.message ?? "Professor profile not found.");
  }

  const [{ count: courseCount, error: courseError }, { count: rosterCount, error: rosterError }] =
    await Promise.all([
      admin
        .from("professor_courses")
        .select("id", { count: "exact", head: true })
        .eq("professor_id", professorId)
        .neq("status", "inactive"),
      admin
        .from("rosters")
        .select("id", { count: "exact", head: true })
        .eq("professor_id", professorId)
        .neq("status", "archived"),
    ]);

  if (courseError) {
    throw new Error(courseError.message);
  }

  if (rosterError) {
    throw new Error(rosterError.message);
  }

  let nextStatus: StoredOnboardingStatus = "started";
  let progressState: ProgressState = "incomplete";

  if (professor.university_id && (courseCount ?? 0) > 0 && (rosterCount ?? 0) > 0) {
    nextStatus = "complete";
    progressState = "fully complete";
  } else if (professor.university_id && (courseCount ?? 0) > 0) {
    nextStatus = "incomplete";
    progressState = "partially complete";
  }

  const { error: updateError } = await admin
    .from("professor_profiles")
    .update({ onboarding_status: nextStatus })
    .eq("id", professorId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    onboardingStatus: nextStatus,
    progressState,
    courseCount: courseCount ?? 0,
    rosterCount: rosterCount ?? 0,
  };
}
