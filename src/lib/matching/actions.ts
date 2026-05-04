"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfessorAccess, type AccessContext } from "@/lib/auth/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runRosterMatching } from "@/lib/rosters/matching";

export type MatchActionState = {
  error: string;
  success: string;
};

const matchSchema = z.object({
  rosterId: z.string().trim().uuid("Roster ID is required."),
});

const matchReviewSchema = z.object({
  matchId: z.string().trim().uuid("Match ID is required."),
});

const manualLinkSchema = z.object({
  matchId: z.string().trim().uuid("Match ID is required."),
  studentId: z.string().trim().uuid("Select a student to link."),
});

async function updateMatchRecord(
  input: {
    matchId: string;
    studentId?: string | null;
    status: "confirmed" | "rejected";
    reason: string;
    confidenceScore?: number;
  },
  accessContext?: AccessContext | null,
) {
  const actor = await requireProfessorAccess(accessContext);
  const admin = createSupabaseAdminClient();
  const { data: existingMatch, error: existingMatchError } = await admin
    .from("roster_matches")
    .select("id, professor_id, school_id")
    .eq("id", input.matchId)
    .eq("professor_id", actor.professorId)
    .maybeSingle();

  if (existingMatchError) {
    throw new Error(existingMatchError.message);
  }

  if (!existingMatch) {
    throw new Error("Unauthorized.");
  }
  const updatePayload: {
    match_status: "confirmed" | "rejected";
    student_id?: string | null;
    match_reason: string;
    confidence_score?: number;
    matched_by: "professor";
    reviewed_at: string;
  } = {
    match_status: input.status,
    match_reason: input.reason,
    matched_by: "professor",
    reviewed_at: new Date().toISOString(),
  };

  if (input.studentId !== undefined) {
    const { data: student, error: studentError } = await admin
      .from("student_profiles")
      .select("id")
      .eq("id", input.studentId)
      .eq("university_id", existingMatch.school_id)
      .maybeSingle();

    if (studentError) {
      throw new Error(studentError.message);
    }

    if (!student) {
      throw new Error("Unauthorized.");
    }

    updatePayload.student_id = input.studentId;
  }

  if (input.confidenceScore !== undefined) {
    updatePayload.confidence_score = input.confidenceScore;
  }

  const { error } = await admin.from("roster_matches").update(updatePayload).eq("id", existingMatch.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/professor/matches");
}

export async function runRosterMatchingAction(
  _previousState: MatchActionState,
  formData: FormData,
  accessContext?: AccessContext | null,
): Promise<MatchActionState> {
  const parsed = matchSchema.safeParse({
    rosterId: formData.get("rosterId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid roster ID.", success: "" };
  }

  try {
    const actor = await requireProfessorAccess(accessContext);
    const admin = createSupabaseAdminClient();
    const { data: roster, error: rosterError } = await admin
      .from("rosters")
      .select("id")
      .eq("id", parsed.data.rosterId)
      .eq("professor_id", actor.professorId)
      .maybeSingle();

    if (rosterError) {
      throw new Error(rosterError.message);
    }

    if (!roster) {
      throw new Error("Unauthorized.");
    }

    const result = await runRosterMatching(parsed.data.rosterId);
    return {
      error: "",
      success: `Matching complete. auto_matched=${result.counts.auto_matched}, needs_review=${result.counts.needs_review}, no_match=${result.counts.no_match}`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to run roster matching.",
      success: "",
    };
  }
}

export async function confirmMatchAction(formData: FormData, accessContext?: AccessContext | null) {
  const parsed = matchReviewSchema.safeParse({
    matchId: formData.get("matchId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid match ID.");
  }

  await updateMatchRecord(
    {
      matchId: parsed.data.matchId,
      status: "confirmed",
      reason: "Confirmed by professor.",
      confidenceScore: 1,
    },
    accessContext,
  );
}

export async function rejectMatchAction(formData: FormData, accessContext?: AccessContext | null) {
  const parsed = matchReviewSchema.safeParse({
    matchId: formData.get("matchId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid match ID.");
  }

  await updateMatchRecord(
    {
      matchId: parsed.data.matchId,
      status: "rejected",
      reason: "Rejected by professor.",
      confidenceScore: 0,
    },
    accessContext,
  );
}

export async function manualLinkMatchAction(formData: FormData, accessContext?: AccessContext | null) {
  const parsed = manualLinkSchema.safeParse({
    matchId: formData.get("matchId"),
    studentId: formData.get("studentId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid manual link request.");
  }

  await updateMatchRecord(
    {
      matchId: parsed.data.matchId,
      studentId: parsed.data.studentId,
      status: "confirmed",
      reason: "Manually linked by professor.",
      confidenceScore: 1,
    },
    accessContext,
  );
}
