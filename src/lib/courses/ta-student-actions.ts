"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/email";
import { taAcceptedEmail, taDeclinedEmail } from "@/lib/notifications/ta-emails";
import type { StudentTAActionState } from "./ta-student-types";

async function getCurrentStudentProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("student_profiles")
    .select("id, user_id, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return profile ?? null;
}

async function updateInvitationStatus(
  assignmentId: string,
  newStatus: "accepted" | "declined",
  timestampField: "accepted_at" | "declined_at",
): Promise<StudentTAActionState> {
  if (!assignmentId) return { error: "Missing assignment ID.", success: "" };

  const student = await getCurrentStudentProfile();
  if (!student) return { error: "Not authenticated.", success: "" };

  const admin = createSupabaseAdminClient();

  const { data: ta } = await admin
    .from("course_tas")
    .select("id, user_id, status, professor_course_id, invited_by_professor")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!ta) return { error: "Invitation not found.", success: "" };
  if (ta.user_id !== student.id) return { error: "Unauthorized.", success: "" };
  if (ta.status !== "pending") {
    return { error: "This invitation is no longer pending.", success: "" };
  }

  try {
    const { error: updateError } = await admin
      .from("course_tas")
      .update({ status: newStatus, [timestampField]: new Date().toISOString() })
      .eq("id", assignmentId);

    if (updateError) throw updateError;
  } catch {
    return { error: "Unable to process. Please try again.", success: "" };
  }

  revalidatePath("/dashboard/student", "page");

  // Best-effort email notification to the professor.
  try {
    const studentFullName = `${student.first_name} ${student.last_name}`.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://rockstarlaw.com";

    // Get professor email + last name + course name
    const { data: pc } = await admin
      .from("professor_courses")
      .select(
        "id, custom_course_name, courses(course_name), professor_profiles(last_name, user_id)",
      )
      .eq("id", ta.professor_course_id)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pcAny = pc as any;
    const courseName =
      pcAny?.custom_course_name ??
      (Array.isArray(pcAny?.courses)
        ? pcAny.courses[0]?.course_name
        : pcAny?.courses?.course_name) ??
      "your course";
    const profProfile = Array.isArray(pcAny?.professor_profiles)
      ? pcAny.professor_profiles[0]
      : pcAny?.professor_profiles;
    const profLastName = profProfile?.last_name ?? "";
    const profUserId = profProfile?.user_id;

    if (profUserId) {
      const { data: profAuthUser } = await admin.auth.admin.getUserById(profUserId);
      const profEmail = profAuthUser?.user?.email;

      if (profEmail) {
        if (newStatus === "accepted") {
          const manageCourseUrl = `${appUrl}/professor/courses/${ta.professor_course_id}/manage`;
          const tmpl = taAcceptedEmail({
            professorLastName: profLastName,
            studentFullName,
            courseName,
            manageCourseUrl,
          });
          await sendEmail({ to: profEmail, ...tmpl });
        } else {
          const tmpl = taDeclinedEmail({
            professorLastName: profLastName,
            studentFullName,
            courseName,
          });
          await sendEmail({ to: profEmail, ...tmpl });
        }
      }
    }
  } catch (e) {
    console.error("[ta-student-actions] email lookup failed:", e);
  }

  return {
    error: "",
    success:
      newStatus === "accepted" ? "TA invitation accepted." : "Invitation declined.",
  };
}

export async function acceptTAInvitation(
  _prev: StudentTAActionState,
  formData: FormData,
): Promise<StudentTAActionState> {
  return updateInvitationStatus(
    String(formData.get("assignmentId") ?? "").trim(),
    "accepted",
    "accepted_at",
  );
}

export async function declineTAInvitation(
  _prev: StudentTAActionState,
  formData: FormData,
): Promise<StudentTAActionState> {
  return updateInvitationStatus(
    String(formData.get("assignmentId") ?? "").trim(),
    "declined",
    "declined_at",
  );
}
