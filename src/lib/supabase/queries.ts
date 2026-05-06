import { assertStudentAccess, getAccessContext, requireAdminAccess, requireProfessorAccess, type AccessContext } from "@/lib/auth/access";
import type { AppRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SchoolOption = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  address_line_1: string;
  postal_code: string;
  country: string;
};

export async function getSchoolOptions() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, city, state, status, address_line_1, postal_code, country")
    .in("status", ["registered", "placeholder", "pending_review"])
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SchoolOption[];
}

export type ProfessorOption = {
  id: string;
  first_name: string;
  last_name: string;
  university_id: string;
};

export async function getProfessorOptions(): Promise<ProfessorOption[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("professor_profiles")
    .select("id, first_name, last_name, university_id")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProfessorOption[];
}

export type ProfessorCourseOption = {
  id: string;
  professor_id: string;
  custom_course_name: string | null;
  term: string | null;
  section_name: string | null;
  professor_profiles:
    | {
        first_name: string;
        last_name: string;
      }[]
    | null;
  courses:
    | {
        id: string;
        school_id: string;
        course_name: string;
      }[]
    | null;
};

export async function getProfessorCourseOptions(accessContext?: AccessContext | null) {
  const actor = await requireProfessorAccess(accessContext);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("professor_courses")
    .select(
      "id, professor_id, custom_course_name, term, section_name, professor_profiles(first_name, last_name), courses(id, school_id, course_name)",
    )
    .eq("professor_id", actor.professorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProfessorCourseOption[];
}

export type StudentProfileOption = {
  id: string;
  university_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
};

export type ProfessorMatchReviewItem = {
  id: string;
  roster_entry_id: string;
  student_id: string | null;
  professor_id: string;
  school_id: string;
  match_status: string;
  confidence_score: number | null;
  match_reason: string | null;
  roster_entries:
    | {
        id: string;
        roster_id: string;
        first_name: string;
        middle_name: string | null;
        last_name: string;
        rosters:
          | {
              id: string;
              roster_name: string;
              term: string | null;
              section_name: string | null;
            }[]
          | null;
      }[]
    | null;
  student_profiles:
    | {
        id: string;
        university_id: string;
        first_name: string;
        middle_name: string | null;
        last_name: string;
      }[]
    | null;
};

export async function getProfessorMatchReviewData(accessContext?: AccessContext | null) {
  const actor = await requireProfessorAccess(accessContext);
  const supabase = createSupabaseAdminClient();
  const [{ data: matches, error: matchesError }, { data: students, error: studentsError }] =
    await Promise.all([
      supabase
        .from("roster_matches")
        .select(
          "id, roster_entry_id, student_id, professor_id, school_id, match_status, confidence_score, match_reason, roster_entries(id, roster_id, first_name, middle_name, last_name, rosters(id, roster_name, term, section_name)), student_profiles(id, university_id, first_name, middle_name, last_name)",
        )
        .eq("professor_id", actor.professorId)
        .order("created_at", { ascending: false }),
      supabase
        .from("student_profiles")
        .select("id, university_id, first_name, middle_name, last_name")
        .eq("university_id", actor.universityId)
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true }),
    ]);

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  return {
    matches: (matches ?? []) as ProfessorMatchReviewItem[],
    students: (students ?? []) as StudentProfileOption[],
  };
}

export type StudentDashboardProfessorItem = {
  professorId: string;
  professorName: string;
  courseName: string;
  rosterStatus: string;
  matchStatus: string;
  dashboardStatus: "matched" | "pending review" | "not found in roster";
  matchReason: string;
  confidenceScore: number;
  message: string;
};

export type StudentDashboardData = {
  studentId: string;
  studentName: string;
  universityName: string;
  universityAddress: Record<string, unknown> | null;
  onboardingStatus: string;
  progressState: "incomplete" | "fully complete";
  professors: StudentDashboardProfessorItem[];
};

export type ProfessorDashboardData = {
  professorId: string;
  professorName: string;
  universityName: string;
  onboardingStatus: string;
  progressState: "incomplete" | "partially complete" | "fully complete";
  courseCount: number;
  rosterCount: number;
};

export async function getStudentDashboardDataForUser(
  userId: string,
  accessContext?: AccessContext | null,
): Promise<StudentDashboardData | null> {
  await assertStudentAccess(userId, accessContext);
  const supabase = createSupabaseAdminClient();
  const { data: student, error: studentError } = await supabase
    .from("student_profiles")
    .select("id, first_name, last_name, university_id, university_name_snapshot, university_address_snapshot, onboarding_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (!student) {
    return null;
  }

  const [{ data: links, error: linksError }, { data: matches, error: matchesError }] =
    await Promise.all([
      supabase
        .from("student_professor_links")
        .select("id, professor_id, status")
        .eq("student_id", student.id),
      supabase
        .from("roster_matches")
        .select(
          "id, roster_entry_id, student_id, professor_id, school_id, match_status, confidence_score, match_reason",
        )
        .eq("student_id", student.id),
    ]);

  if (linksError) {
    throw new Error(linksError.message);
  }

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const professorIds = Array.from(
    new Set([
      ...(links ?? []).map((link) => link.professor_id),
      ...(matches ?? []).map((match) => match.professor_id),
    ]),
  );

  if (!professorIds.length) {
    return {
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      universityName: student.university_name_snapshot,
      universityAddress: (student.university_address_snapshot as Record<string, unknown> | null) ?? null,
      onboardingStatus: student.onboarding_status,
      progressState: student.onboarding_status === "complete" ? "fully complete" : "incomplete",
      professors: [],
    };
  }

  const rosterEntryIds = (matches ?? []).map((match) => match.roster_entry_id);

  const [
    { data: professorProfiles, error: professorProfilesError },
    { data: professorCourses, error: professorCoursesError },
    { data: rosterEntries, error: rosterEntriesError },
  ] = await Promise.all([
    supabase
      .from("professor_profiles")
      .select("id, first_name, last_name")
      .in("id", professorIds),
    supabase
      .from("professor_courses")
      .select("id, professor_id, custom_course_name, courses(id, course_name)")
      .in("professor_id", professorIds)
      .order("created_at", { ascending: true }),
    rosterEntryIds.length
      ? supabase
          .from("roster_entries")
          .select("id, roster_id")
          .in("id", rosterEntryIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (professorProfilesError) {
    throw new Error(professorProfilesError.message);
  }

  if (professorCoursesError) {
    throw new Error(professorCoursesError.message);
  }

  if (rosterEntriesError) {
    throw new Error(rosterEntriesError.message);
  }

  const rosterIds = (rosterEntries ?? []).map((entry) => entry.roster_id);
  const { data: rosters, error: rostersError } = rosterIds.length
    ? await supabase
        .from("rosters")
        .select("id, roster_name, status, professor_course_id")
        .in("id", rosterIds)
    : { data: [], error: null };

  if (rostersError) {
    throw new Error(rostersError.message);
  }

  const professorProfileMap = new Map((professorProfiles ?? []).map((item) => [item.id, item]));
  const professorCoursesByProfessor = new Map<string, (typeof professorCourses)>(
    professorIds.map((professorId) => [
      professorId,
      (professorCourses ?? []).filter((course) => course.professor_id === professorId),
    ]),
  );
  const rosterEntryMap = new Map((rosterEntries ?? []).map((item) => [item.id, item]));
  const rosterMap = new Map((rosters ?? []).map((item) => [item.id, item]));

  const professors = professorIds.map((professorId) => {
    const profile = professorProfileMap.get(professorId);
    const professorName = profile
      ? `${profile.first_name} ${profile.last_name}`
      : "Professor";
    const professorMatchRows = (matches ?? []).filter((match) => match.professor_id === professorId);
    const chosenMatch =
      professorMatchRows.find((match) => match.match_status === "confirmed") ??
      professorMatchRows.find(
        (match) => match.match_status === "needs_review" || match.match_status === "auto_matched",
      ) ??
      professorMatchRows.find(
        (match) => match.match_status === "no_match" || match.match_status === "rejected",
      ) ??
      null;

    const rosterEntry = chosenMatch ? rosterEntryMap.get(chosenMatch.roster_entry_id) : null;
    const roster = rosterEntry ? rosterMap.get(rosterEntry.roster_id) : null;
    const professorCourseList = professorCoursesByProfessor.get(professorId) ?? [];
    const rosterCourse = roster
      ? professorCourseList.find((course) => course.id === roster.professor_course_id)
      : null;
    const fallbackCourse = professorCourseList[0] ?? null;
    const rosterCourseName = Array.isArray(rosterCourse?.courses)
      ? rosterCourse.courses[0]?.course_name
      : null;
    const fallbackCourseName = Array.isArray(fallbackCourse?.courses)
      ? fallbackCourse.courses[0]?.course_name
      : null;
    const courseName =
      rosterCourse?.custom_course_name ||
      rosterCourseName ||
      fallbackCourse?.custom_course_name ||
      fallbackCourseName ||
      "Course not assigned";

    let dashboardStatus: StudentDashboardProfessorItem["dashboardStatus"] = "not found in roster";
    let message = "You are not yet matched to your professor’s roster";
    const matchStatus = chosenMatch?.match_status ?? "no_match";

    if (chosenMatch?.match_status === "confirmed") {
      dashboardStatus = "matched";
      message = "Matched to professor roster";
    } else if (
      chosenMatch?.match_status === "needs_review" ||
      chosenMatch?.match_status === "auto_matched"
    ) {
      dashboardStatus = "pending review";
      message = "Your enrollment is pending professor confirmation";
    }

    return {
      professorId,
      professorName,
      courseName,
      rosterStatus: roster?.status ?? "not found in roster",
      matchStatus,
      dashboardStatus,
      matchReason: chosenMatch?.match_reason ?? "No roster match found yet.",
      confidenceScore: chosenMatch?.confidence_score ?? 0,
      message,
    } satisfies StudentDashboardProfessorItem;
  });

  return {
    studentId: student.id,
    studentName: `${student.first_name} ${student.last_name}`,
    universityName: student.university_name_snapshot,
    universityAddress: (student.university_address_snapshot as Record<string, unknown> | null) ?? null,
    onboardingStatus: student.onboarding_status,
    progressState: student.onboarding_status === "complete" ? "fully complete" : "incomplete",
    professors,
  };
}

export async function getCurrentStudentDashboardData(): Promise<StudentDashboardData | null> {
  const accessContext = await getAccessContext();

  if (!accessContext) {
    return null;
  }

  return getStudentDashboardDataForUser(accessContext.userId, accessContext);
}

export type AdminMatchQueueItem = {
  id: string;
  match_status: string;
  confidence_score: number | null;
  match_reason: string | null;
  roster_entries:
    | {
        id: string;
        first_name: string;
        middle_name: string | null;
        last_name: string;
        rosters:
          | {
              id: string;
              roster_name: string;
              status: string;
            }[]
          | null;
      }[]
    | null;
  professor_profiles:
    | {
        id: string;
        first_name: string;
        last_name: string;
      }[]
    | null;
  student_profiles:
    | {
        id: string;
        first_name: string;
        middle_name: string | null;
        last_name: string;
      }[]
    | null;
  schools:
    | {
        id: string;
        name: string;
      }[]
    | null;
};

export type AdminSchoolQueueItem = {
  id: string;
  name: string;
  status: string;
  city: string;
  state: string;
  address_line_1: string;
  postal_code: string;
  country: string;
};

export type AdminDashboardData = {
  counts: {
    totalStudents: number;
    totalProfessors: number;
    totalSchools: number;
    totalRosters: number;
    totalMatches: number;
    unmatchedStudents: number;
    pendingMatches: number;
    placeholderSchools: number;
  };
  queues: {
    unmatchedStudents: AdminMatchQueueItem[];
    pendingMatches: AdminMatchQueueItem[];
    placeholderSchools: AdminSchoolQueueItem[];
  };
};

export async function getAdminDashboardData(accessContext?: AccessContext | null): Promise<AdminDashboardData> {
  await requireAdminAccess(accessContext);
  const supabase = createSupabaseAdminClient();
  const [
    studentsCountResult,
    professorsCountResult,
    schoolsCountResult,
    rostersCountResult,
    matchesCountResult,
    unmatchedCountResult,
    pendingCountResult,
    placeholderCountResult,
    unmatchedQueueResult,
    pendingQueueResult,
    placeholderQueueResult,
  ] = await Promise.all([
    supabase.from("student_profiles").select("id", { count: "exact", head: true }),
    supabase.from("professor_profiles").select("id", { count: "exact", head: true }),
    supabase.from("schools").select("id", { count: "exact", head: true }),
    supabase.from("rosters").select("id", { count: "exact", head: true }),
    supabase.from("roster_matches").select("id", { count: "exact", head: true }),
    supabase.from("roster_matches").select("id", { count: "exact", head: true }).eq("match_status", "no_match"),
    supabase.from("roster_matches").select("id", { count: "exact", head: true }).eq("match_status", "needs_review"),
    supabase.from("schools").select("id", { count: "exact", head: true }).eq("status", "placeholder"),
    supabase
      .from("roster_matches")
      .select(
        "id, match_status, confidence_score, match_reason, roster_entries(id, first_name, middle_name, last_name, rosters(id, roster_name, status)), professor_profiles(id, first_name, last_name), student_profiles(id, first_name, middle_name, last_name), schools(id, name)",
      )
      .eq("match_status", "no_match")
      .order("created_at", { ascending: false }),
    supabase
      .from("roster_matches")
      .select(
        "id, match_status, confidence_score, match_reason, roster_entries(id, first_name, middle_name, last_name, rosters(id, roster_name, status)), professor_profiles(id, first_name, last_name), student_profiles(id, first_name, middle_name, last_name), schools(id, name)",
      )
      .eq("match_status", "needs_review")
      .order("created_at", { ascending: false }),
    supabase
      .from("schools")
      .select("id, name, status, city, state, address_line_1, postal_code, country")
      .eq("status", "placeholder")
      .order("name", { ascending: true }),
  ]);

  const allResults = [
    studentsCountResult,
    professorsCountResult,
    schoolsCountResult,
    rostersCountResult,
    matchesCountResult,
    unmatchedCountResult,
    pendingCountResult,
    placeholderCountResult,
    unmatchedQueueResult,
    pendingQueueResult,
    placeholderQueueResult,
  ];

  for (const result of allResults) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    counts: {
      totalStudents: studentsCountResult.count ?? 0,
      totalProfessors: professorsCountResult.count ?? 0,
      totalSchools: schoolsCountResult.count ?? 0,
      totalRosters: rostersCountResult.count ?? 0,
      totalMatches: matchesCountResult.count ?? 0,
      unmatchedStudents: unmatchedCountResult.count ?? 0,
      pendingMatches: pendingCountResult.count ?? 0,
      placeholderSchools: placeholderCountResult.count ?? 0,
    },
    queues: {
      unmatchedStudents: (unmatchedQueueResult.data ?? []) as AdminMatchQueueItem[],
      pendingMatches: (pendingQueueResult.data ?? []) as AdminMatchQueueItem[],
      placeholderSchools: (placeholderQueueResult.data ?? []) as AdminSchoolQueueItem[],
    },
  };
}

export async function getCurrentProfessorDashboardData(): Promise<ProfessorDashboardData | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data: professor, error: professorError } = await admin
    .from("professor_profiles")
    .select("id, first_name, last_name, university_name_snapshot, onboarding_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (professorError) {
    throw new Error(professorError.message);
  }

  if (!professor) {
    return null;
  }

  const [{ count: courseCount, error: courseError }, { count: rosterCount, error: rosterError }] =
    await Promise.all([
      admin
        .from("professor_courses")
        .select("id", { count: "exact", head: true })
        .eq("professor_id", professor.id)
        .neq("status", "inactive"),
      admin
        .from("rosters")
        .select("id", { count: "exact", head: true })
        .eq("professor_id", professor.id)
        .neq("status", "archived"),
    ]);

  if (courseError) {
    throw new Error(courseError.message);
  }

  if (rosterError) {
    throw new Error(rosterError.message);
  }

  const progressState =
    professor.onboarding_status === "complete"
      ? "fully complete"
      : (courseCount ?? 0) > 0
        ? "partially complete"
        : "incomplete";

  return {
    professorId: professor.id,
    professorName: `${professor.first_name} ${professor.last_name}`,
    universityName: professor.university_name_snapshot,
    onboardingStatus: professor.onboarding_status,
    progressState,
    courseCount: courseCount ?? 0,
    rosterCount: rosterCount ?? 0,
  };
}

export async function getCurrentAppUserRole(): Promise<AppRole | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("app_users")
    .select("primary_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.primary_role as AppRole | undefined) ?? null;
}
