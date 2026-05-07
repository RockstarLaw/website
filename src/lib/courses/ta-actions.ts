"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TAActionState = { error: string; success: string };
export const initialTAState: TAActionState = { error: "", success: "" };

async function getCurrentProfessor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data: professor } = await admin
    .from("professor_profiles")
    .select("id, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return professor ?? null;
}

export async function inviteTA(
  _prev: TAActionState,
  formData: FormData,
): Promise<TAActionState> {
  const professorCourseId = String(formData.get("professorCourseId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const slotType = String(formData.get("slotType") ?? "free");

  if (!professorCourseId || !email) {
    return { error: "Missing required fields.", success: "" };
  }

  if (slotType === "paid") {
    return {
      error: "Paid TA slots require an active subscription. Coming soon.",
      success: "",
    };
  }

  const professor = await getCurrentProfessor();
  if (!professor) return { error: "Not authenticated.", success: "" };

  const admin = createSupabaseAdminClient();

  // Verify professor owns this professor_course
  const { data: profCourse } = await admin
    .from("professor_courses")
    .select("id")
    .eq("id", professorCourseId)
    .eq("professor_id", professor.id)
    .maybeSingle();

  if (!profCourse) return { error: "Unauthorized.", success: "" };

  // Look up student by university email
  const { data: studentProfile } = await admin
    .from("student_profiles")
    .select("id, user_id, university_email")
    .eq("university_email", email)
    .maybeSingle();

  if (!studentProfile) {
    return {
      error: "No student account found with that university email address.",
      success: "",
    };
  }

  // Verify role is student
  const { data: appUser } = await admin
    .from("app_users")
    .select("primary_role")
    .eq("user_id", studentProfile.user_id)
    .maybeSingle();

  if (!appUser || appUser.primary_role !== "student") {
    return { error: "That account is not registered as a student.", success: "" };
  }

  // Cannot invite yourself
  if (studentProfile.user_id === professor.user_id) {
    return { error: "You cannot invite yourself as a TA.", success: "" };
  }

  // App-layer slot check (DB trigger is the authoritative guard)
  const { count: activeCount } = await admin
    .from("course_tas")
    .select("id", { count: "exact", head: true })
    .eq("professor_course_id", professorCourseId)
    .eq("slot_type", "free")
    .in("status", ["pending", "accepted"]);

  if ((activeCount ?? 0) >= 2) {
    return { error: "Free TA slots are full for this course.", success: "" };
  }

  // Check for existing active invite (not revoked or declined)
  const { data: existing } = await admin
    .from("course_tas")
    .select("id")
    .eq("professor_course_id", professorCourseId)
    .eq("user_id", studentProfile.id)
    .neq("status", "revoked")
    .neq("status", "declined")
    .maybeSingle();

  if (existing) {
    return {
      error: "This student has already been invited to this course.",
      success: "",
    };
  }

  const { error: insertError } = await admin.from("course_tas").insert({
    professor_course_id: professorCourseId,
    user_id: studentProfile.id,
    slot_type: "free",
    status: "pending",
    invited_by_professor: professor.id,
  });

  if (insertError) {
    // Trigger exception message contains "slot limit"
    if (insertError.message.includes("slot limit")) {
      return { error: "Free TA slots are full for this course.", success: "" };
    }
    return { error: insertError.message, success: "" };
  }

  revalidatePath("/professor/courses", "layout");
  return { error: "", success: "Invitation sent." };
}

export async function revokeTA(
  _prev: TAActionState,
  formData: FormData,
): Promise<TAActionState> {
  const assignmentId = String(formData.get("assignmentId") ?? "").trim();
  if (!assignmentId) return { error: "Missing assignment ID.", success: "" };

  const professor = await getCurrentProfessor();
  if (!professor) return { error: "Not authenticated.", success: "" };

  const admin = createSupabaseAdminClient();

  const { data: ta } = await admin
    .from("course_tas")
    .select("id, professor_course_id, status")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!ta) return { error: "TA assignment not found.", success: "" };
  if (ta.status === "revoked") return { error: "Already revoked.", success: "" };

  // Verify professor owns the course section
  const { data: profCourse } = await admin
    .from("professor_courses")
    .select("id")
    .eq("id", ta.professor_course_id)
    .eq("professor_id", professor.id)
    .maybeSingle();

  if (!profCourse) return { error: "Unauthorized.", success: "" };

  const { error: updateError } = await admin
    .from("course_tas")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", assignmentId);

  if (updateError) return { error: updateError.message, success: "" };

  revalidatePath("/professor/courses", "layout");
  return { error: "", success: "TA access revoked." };
}
