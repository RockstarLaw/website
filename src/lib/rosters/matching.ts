import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MatchStatus = "auto_matched" | "needs_review" | "no_match";

type MatchResult = {
  rosterEntryId: string;
  studentId: string | null;
  professorId: string;
  schoolId: string;
  matchStatus: MatchStatus;
  confidenceScore: number;
  matchReason: string;
};

const nicknameGroups = [
  ["alex", "alexander", "alexandra"],
  ["beth", "elizabeth", "liz", "lizzie", "eliza"],
  ["bill", "will", "william", "billy"],
  ["bob", "bobby", "rob", "robert", "robbie"],
  ["chris", "christopher"],
  ["jim", "jimmy", "james"],
  ["joe", "joey", "joseph"],
  ["john", "johnny", "jon", "jonathan", "jack"],
  ["kate", "katie", "katherine", "kathryn", "catherine", "cathy"],
  ["matt", "matthew"],
  ["mike", "michael"],
  ["nick", "nicholas"],
  ["pat", "patrick", "patricia"],
  ["rick", "richard", "ricky", "rich"],
  ["sam", "samuel", "samantha"],
  ["tom", "thomas", "tommy"],
];

const nicknameMap = new Map<string, string>();
for (const group of nicknameGroups) {
  const canonical = group[0];
  for (const name of group) nicknameMap.set(name, canonical);
}

function normalizeNamePart(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\p{P}$+<=>^`|~]/gu, "")
    .replace(/\s+/g, " ");
}

function canonicalFirstName(value: string | null | undefined) {
  const normalized = normalizeNamePart(value);
  return nicknameMap.get(normalized) ?? normalized;
}

function middleNameCompatible(a: string | null | undefined, b: string | null | undefined) {
  const left = normalizeNamePart(a);
  const right = normalizeNamePart(b);
  if (!left || !right) return true;
  return left === right || left[0] === right[0];
}

function findBestMatch(params: {
  entry: {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
  };
  students: Array<{
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
  }>;
  professorId: string;
  schoolId: string;
}): MatchResult {
  const entryFirst = normalizeNamePart(params.entry.first_name);
  const entryLast = normalizeNamePart(params.entry.last_name);
  const entryCanonicalFirst = canonicalFirstName(params.entry.first_name);

  const exactCandidates = params.students.filter((student) => {
    return (
      normalizeNamePart(student.last_name) === entryLast &&
      normalizeNamePart(student.first_name) === entryFirst &&
      middleNameCompatible(student.middle_name, params.entry.middle_name)
    );
  });

  if (exactCandidates.length === 1) {
    return {
      rosterEntryId: params.entry.id,
      studentId: exactCandidates[0].id,
      professorId: params.professorId,
      schoolId: params.schoolId,
      matchStatus: "auto_matched",
      confidenceScore: 1,
      matchReason: "Exact first and last name match within the same university.",
    };
  }

  const reviewCandidates = params.students.filter((student) => {
    const sameLast = normalizeNamePart(student.last_name) === entryLast;
    if (!sameLast) return false;

    const studentFirst = normalizeNamePart(student.first_name);
    const studentCanonicalFirst = canonicalFirstName(student.first_name);

    return (
      studentCanonicalFirst === entryCanonicalFirst ||
      studentFirst.startsWith(entryFirst) ||
      entryFirst.startsWith(studentFirst)
    );
  });

  if (reviewCandidates.length >= 1) {
    const chosen = reviewCandidates[0];
    return {
      rosterEntryId: params.entry.id,
      studentId: chosen.id,
      professorId: params.professorId,
      schoolId: params.schoolId,
      matchStatus: "needs_review",
      confidenceScore: reviewCandidates.length > 1 ? 0.65 : 0.8,
      matchReason:
        reviewCandidates.length > 1
          ? "Multiple plausible student matches found using normalized name and nickname handling."
          : "Likely match based on last name and first-name variation/nickname.",
    };
  }

  return {
    rosterEntryId: params.entry.id,
    studentId: null,
    professorId: params.professorId,
    schoolId: params.schoolId,
    matchStatus: "no_match",
    confidenceScore: 0,
    matchReason: "No student profile in the same university matched the normalized roster name.",
  };
}

export async function runRosterMatching(rosterId: string) {
  const admin = createSupabaseAdminClient();

  const { data: roster, error: rosterError } = await admin
    .from("rosters")
    .select("id, professor_id, school_id")
    .eq("id", rosterId)
    .single();

  if (rosterError || !roster) {
    throw new Error(rosterError?.message ?? "Roster not found.");
  }

  const [{ data: rosterEntries, error: entriesError }, { data: students, error: studentsError }] =
    await Promise.all([
      admin
        .from("roster_entries")
        .select("id, first_name, middle_name, last_name")
        .eq("roster_id", rosterId)
        .order("created_at", { ascending: true }),
      admin
        .from("student_profiles")
        .select("id, first_name, middle_name, last_name")
        .eq("university_id", roster.school_id),
    ]);

  if (entriesError) throw new Error(entriesError.message);
  if (studentsError) throw new Error(studentsError.message);

  const results = (rosterEntries ?? []).map((entry) =>
    findBestMatch({
      entry,
      students: students ?? [],
      professorId: roster.professor_id,
      schoolId: roster.school_id,
    }),
  );

  const entryIds = results.map((result) => result.rosterEntryId);
  const { data: existingMatches, error: existingMatchesError } = entryIds.length
    ? await admin
        .from("roster_matches")
        .select("id, roster_entry_id, student_id, match_status, confidence_score, match_reason")
        .in("roster_entry_id", entryIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (existingMatchesError) {
    throw new Error(existingMatchesError.message);
  }

  const preservedStatuses = new Set(["confirmed", "rejected", "manually_linked"]);
  const existingByEntry = new Map<string, (typeof existingMatches) extends (infer T)[] ? T[] : never>();

  for (const match of existingMatches ?? []) {
    const current = existingByEntry.get(match.roster_entry_id) ?? [];
    current.push(match);
    existingByEntry.set(match.roster_entry_id, current);
  }

  const deleteIds: string[] = [];
  const updatePayloads: Array<{
    id: string;
    student_id: string | null;
    professor_id: string;
    school_id: string;
    match_status: MatchStatus;
    confidence_score: number;
    match_reason: string;
    matched_by: "system";
  }> = [];
  const insertPayload: Array<{
    roster_entry_id: string;
    student_id: string | null;
    professor_id: string;
    school_id: string;
    match_status: MatchStatus;
    confidence_score: number;
    match_reason: string;
    matched_by: "system";
  }> = [];

  for (const result of results) {
    const existingForEntry = existingByEntry.get(result.rosterEntryId) ?? [];
    const preservedRow = existingForEntry.find((row) => preservedStatuses.has(row.match_status));

    if (preservedRow) {
      deleteIds.push(
        ...existingForEntry
          .filter((row) => row.id !== preservedRow.id)
          .map((row) => row.id),
      );
      continue;
    }

    const systemRows = existingForEntry.filter((row) => !preservedStatuses.has(row.match_status));
    const rowToUpdate = systemRows[0];

    if (rowToUpdate) {
      deleteIds.push(...systemRows.slice(1).map((row) => row.id));
      updatePayloads.push({
        id: rowToUpdate.id,
        student_id: result.studentId,
        professor_id: result.professorId,
        school_id: result.schoolId,
        match_status: result.matchStatus,
        confidence_score: result.confidenceScore,
        match_reason: result.matchReason,
        matched_by: "system",
      });
      continue;
    }

    insertPayload.push({
      roster_entry_id: result.rosterEntryId,
      student_id: result.studentId,
      professor_id: result.professorId,
      school_id: result.schoolId,
      match_status: result.matchStatus,
      confidence_score: result.confidenceScore,
      match_reason: result.matchReason,
      matched_by: "system",
    });
  }

  if (deleteIds.length) {
    const { error: deleteError } = await admin.from("roster_matches").delete().in("id", deleteIds);
    if (deleteError) throw new Error(deleteError.message);
  }

  for (const payload of updatePayloads) {
    const { id, ...updateData } = payload;
    const { error: updateError } = await admin.from("roster_matches").update(updateData).eq("id", id);
    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  if (insertPayload.length) {
    const { error: insertError } = await admin.from("roster_matches").insert(insertPayload);
    if (insertError) throw new Error(insertError.message);
  }

  const { data: finalMatches, error: finalMatchesError } = entryIds.length
    ? await admin
        .from("roster_matches")
        .select("roster_entry_id, student_id, match_status, confidence_score, match_reason")
        .in("roster_entry_id", entryIds)
        .order("roster_entry_id", { ascending: true })
    : { data: [], error: null };

  if (finalMatchesError) {
    throw new Error(finalMatchesError.message);
  }

  return {
    counts: {
      auto_matched: (finalMatches ?? []).filter((result) => result.match_status === "auto_matched").length,
      needs_review: (finalMatches ?? []).filter((result) => result.match_status === "needs_review").length,
      no_match: (finalMatches ?? []).filter((result) => result.match_status === "no_match").length,
    },
    matches: finalMatches ?? [],
  };
}
