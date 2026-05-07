"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
    .select("id, user_id")
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
    .select("id, user_id, status")
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
