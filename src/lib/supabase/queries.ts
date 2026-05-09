import { assertStudentAccess, getAccessContext, requireAdminAccess, requireProfessorAccess, type AccessContext } from "@/lib/auth/access";
import type { AppRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Image URL resolver ───────────────────────────────────────────────────────
// Project images can come from two sources:
//   • Supabase Storage `projects` bucket — for user-uploaded images via the
//     dashboard CreateProject form. Path is a Storage object key. We sign it.
//   • Next.js /public/images/ folder — for seed projects with images checked
//     into the repo. Path starts with "/images/" and is served directly by
//     Next.js (no signing, no auth — public folder is always public).
//
// Use this helper everywhere we resolve image_1_path / image_2_path / image_3_path
// to a URL the browser can load.

function resolveImageUrl(
  path: string | null | undefined,
  signedUrlMap: Map<string, string>,
): string | null {
  if (!path) return null;
  if (path.startsWith("/images/")) return path; // direct-serve from public folder
  return signedUrlMap.get(path) ?? null;          // Supabase Storage signed URL
}

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
  firstName: string;
  preferredName: string | null;
  universityName: string;
  universityAddress: Record<string, unknown> | null;
  onboardingStatus: string;
  progressState: "incomplete" | "fully complete";
  professors: StudentDashboardProfessorItem[];
};

export type StudentModule = {
  id: string;
  slug: string;
  display_name: string;
  icon_path: string;
  module_url: string;
  category: string;
  jurisdiction: string;
};

export async function getStudentEnabledModules(studentId: string): Promise<StudentModule[]> {
  const admin = createSupabaseAdminClient();

  // Step 1: professor IDs linked to this student
  const { data: links, error: linksError } = await admin
    .from("student_professor_links")
    .select("professor_id")
    .eq("student_id", studentId)
    .neq("status", "inactive");

  if (linksError) throw new Error(linksError.message);
  if (!links || links.length === 0) return [];

  const professorIds = links.map((l) => l.professor_id);

  // Step 2: course IDs taught by those professors
  const { data: profCourses, error: profCoursesError } = await admin
    .from("professor_courses")
    .select("course_id")
    .in("professor_id", professorIds)
    .neq("status", "inactive");

  if (profCoursesError) throw new Error(profCoursesError.message);
  if (!profCourses || profCourses.length === 0) return [];

  const courseIds = [...new Set(profCourses.map((pc) => pc.course_id))];

  // Step 3: modules enabled for those courses (join course_modules → modules)
  const { data: courseModules, error: courseModulesError } = await admin
    .from("course_modules")
    .select("module_id, modules(id, slug, display_name, icon_path, module_url, category, jurisdiction)")
    .in("course_id", courseIds);

  if (courseModulesError) throw new Error(courseModulesError.message);
  if (!courseModules || courseModules.length === 0) return [];

  // Deduplicate by module id
  const seen = new Set<string>();
  const modules: StudentModule[] = [];

  for (const cm of courseModules) {
    const mod = Array.isArray(cm.modules) ? cm.modules[0] : cm.modules;
    if (!mod || seen.has((mod as StudentModule).id)) continue;
    seen.add((mod as StudentModule).id);
    modules.push(mod as StudentModule);
  }

  // Sort: federal → state → county → international, then display_name
  const categoryOrder: Record<string, number> = { federal: 0, state: 1, county: 2, international: 3 };
  modules.sort((a, b) => {
    const aOrd = categoryOrder[a.category] ?? 4;
    const bOrd = categoryOrder[b.category] ?? 4;
    if (aOrd !== bOrd) return aOrd - bOrd;
    return a.display_name.localeCompare(b.display_name);
  });

  return modules;
}

export type ProfessorDashboardData = {
  professorId: string;
  professorName: string;
  lastName: string;
  universityName: string;
  onboardingStatus: string;
  progressState: "incomplete" | "partially complete" | "fully complete";
  courseCount: number;
  rosterCount: number;
  photoPath: string | null;
  photoUrl: string | null; // signed URL (1h TTL) for professor-photos bucket
};

export type ProfessorCourseDetail = {
  professorCourseId: string;
  courseName: string;
  sectionName: string | null;
  term: string | null;
  courseId: string;
  rosterStats: {
    matched: number;
    pendingReview: number;
    unmatched: number;
    notRegistered: number;
    total: number;
  };
  enabledModules: StudentModule[];
};

export async function getProfessorDashboardCourses(
  professorId: string,
): Promise<ProfessorCourseDetail[]> {
  const admin = createSupabaseAdminClient();

  // 1. Professor's courses
  const { data: profCourses, error: profCoursesError } = await admin
    .from("professor_courses")
    .select("id, custom_course_name, section_name, term, course_id, courses(id, course_name)")
    .eq("professor_id", professorId)
    .neq("status", "inactive")
    .order("created_at", { ascending: true });

  if (profCoursesError) throw new Error(profCoursesError.message);
  if (!profCourses || profCourses.length === 0) return [];

  const profCourseIds = profCourses.map((pc) => pc.id);
  const courseIds = [...new Set(profCourses.map((pc) => pc.course_id))];

  // 2. Rosters for these professor_courses, plus course_modules — parallel
  const [{ data: rosters, error: rostersError }, { data: courseModulesData, error: courseModulesError }] =
    await Promise.all([
      admin
        .from("rosters")
        .select("id, professor_course_id")
        .in("professor_course_id", profCourseIds)
        .neq("status", "archived"),
      admin
        .from("course_modules")
        .select(
          "course_id, modules(id, slug, display_name, icon_path, module_url, category, jurisdiction)",
        )
        .in("course_id", courseIds),
    ]);

  if (rostersError) throw new Error(rostersError.message);
  if (courseModulesError) throw new Error(courseModulesError.message);

  const rosterIds = (rosters ?? []).map((r) => r.id);

  // 3. Roster entries for those rosters
  const { data: entries, error: entriesError } = rosterIds.length
    ? await admin
        .from("roster_entries")
        .select("id, roster_id")
        .in("roster_id", rosterIds)
        .neq("status", "inactive")
    : { data: [], error: null };

  if (entriesError) throw new Error(entriesError.message);

  const entryIds = (entries ?? []).map((e) => e.id);

  // 4. Roster matches for those entries
  const { data: matchRows, error: matchesError } = entryIds.length
    ? await admin
        .from("roster_matches")
        .select("id, roster_entry_id, match_status")
        .in("roster_entry_id", entryIds)
    : { data: [], error: null };

  if (matchesError) throw new Error(matchesError.message);

  // Build lookup maps
  const rosterToProfCourse = new Map<string, string>();
  for (const r of rosters ?? []) rosterToProfCourse.set(r.id, r.professor_course_id);

  const entryToProfCourse = new Map<string, string>();
  const entryCountByProfCourse = new Map<string, number>();
  for (const e of entries ?? []) {
    const pcId = rosterToProfCourse.get(e.roster_id);
    if (!pcId) continue;
    entryToProfCourse.set(e.id, pcId);
    entryCountByProfCourse.set(pcId, (entryCountByProfCourse.get(pcId) ?? 0) + 1);
  }

  const matchCountsByProfCourse = new Map<string, Record<string, number>>();
  for (const m of matchRows ?? []) {
    const pcId = entryToProfCourse.get(m.roster_entry_id);
    if (!pcId) continue;
    if (!matchCountsByProfCourse.has(pcId)) matchCountsByProfCourse.set(pcId, {});
    const c = matchCountsByProfCourse.get(pcId)!;
    c[m.match_status] = (c[m.match_status] ?? 0) + 1;
  }

  // course_id → deduplicated sorted modules
  const categoryOrder: Record<string, number> = {
    federal: 0,
    state: 1,
    county: 2,
    international: 3,
  };
  const modulesByCourseId = new Map<string, StudentModule[]>();
  for (const cm of courseModulesData ?? []) {
    const mod = Array.isArray(cm.modules) ? cm.modules[0] : cm.modules;
    if (!mod) continue;
    const list = modulesByCourseId.get(cm.course_id) ?? [];
    if (!list.find((m) => m.id === (mod as StudentModule).id)) {
      list.push(mod as StudentModule);
    }
    modulesByCourseId.set(cm.course_id, list);
  }
  for (const mods of modulesByCourseId.values()) {
    mods.sort((a, b) => {
      const diff = (categoryOrder[a.category] ?? 4) - (categoryOrder[b.category] ?? 4);
      return diff !== 0 ? diff : a.display_name.localeCompare(b.display_name);
    });
  }

  return profCourses.map((pc) => {
    const counts = matchCountsByProfCourse.get(pc.id) ?? {};
    const matched = (counts["confirmed"] ?? 0) + (counts["auto_matched"] ?? 0);
    const pendingReview = counts["needs_review"] ?? 0;
    const unmatched = (counts["no_match"] ?? 0) + (counts["rejected"] ?? 0);
    const totalEntries = entryCountByProfCourse.get(pc.id) ?? 0;
    // Proxy: notRegistered = entries with no match row at all
    const notRegistered = Math.max(0, totalEntries - matched - pendingReview - unmatched);

    const courseData = Array.isArray(pc.courses) ? pc.courses[0] : pc.courses;
    const courseName =
      pc.custom_course_name ??
      (courseData as { course_name: string } | null)?.course_name ??
      "Unnamed course";

    return {
      professorCourseId: pc.id,
      courseName,
      sectionName: pc.section_name ?? null,
      term: pc.term ?? null,
      courseId: pc.course_id,
      rosterStats: { matched, pendingReview, unmatched, notRegistered, total: totalEntries },
      enabledModules: modulesByCourseId.get(pc.course_id) ?? [],
    };
  });
}

export async function getStudentDashboardDataForUser(
  userId: string,
  accessContext?: AccessContext | null,
): Promise<StudentDashboardData | null> {
  await assertStudentAccess(userId, accessContext);
  const supabase = createSupabaseAdminClient();
  const { data: student, error: studentError } = await supabase
    .from("student_profiles")
    .select("id, first_name, last_name, preferred_name, university_id, university_name_snapshot, university_address_snapshot, onboarding_status")
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
      firstName: student.first_name,
      preferredName: (student.preferred_name as string | null) ?? null,
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
    firstName: student.first_name,
    preferredName: (student.preferred_name as string | null) ?? null,
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
    .select("id, first_name, last_name, university_name_snapshot, onboarding_status, photo_path")
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

  // Generate signed URL for professor photo (private bucket, 1h TTL)
  let photoUrl: string | null = null;
  const photoPath = (professor.photo_path as string | null) ?? null;
  if (photoPath) {
    const { data: signedPhoto } = await admin.storage
      .from("professor-photos")
      .createSignedUrl(photoPath, 3600);
    photoUrl = signedPhoto?.signedUrl ?? null;
  }

  return {
    professorId: professor.id,
    professorName: `${professor.first_name} ${professor.last_name}`,
    lastName: professor.last_name,
    universityName: professor.university_name_snapshot,
    onboardingStatus: professor.onboarding_status,
    progressState,
    courseCount: courseCount ?? 0,
    rosterCount: rosterCount ?? 0,
    photoPath,
    photoUrl,
  };
}

export type CourseTARow = {
  id: string;
  professorCourseId: string;
  userId: string;
  slotType: "free" | "paid";
  status: "pending" | "accepted" | "declined";
  invitedAt: string;
  acceptedAt: string | null;
  student: {
    firstName: string;
    lastName: string;
    universityEmail: string;
  };
};

export type StudentTARow = {
  assignmentId: string;
  professorCourseId: string;
  courseName: string;
  professorName: string; // "Professor {lastName}, Esq."
  invitedAt: string;
  acceptedAt: string | null;
};

export async function getStudentTAState(
  studentProfileId: string,
): Promise<{ pending: StudentTARow[]; accepted: StudentTARow[] }> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("course_tas")
    .select(
      "id, status, invited_at, accepted_at, professor_course_id, professor_courses(custom_course_name, courses(course_name), professor_profiles(last_name))",
    )
    .eq("user_id", studentProfileId)
    .in("status", ["pending", "accepted"])
    .order("invited_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows: StudentTARow[] = (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pc = (Array.isArray(row.professor_courses) ? row.professor_courses[0] : row.professor_courses) as any;
    const course = Array.isArray(pc?.courses) ? pc.courses[0] : pc?.courses;
    const prof = Array.isArray(pc?.professor_profiles) ? pc.professor_profiles[0] : pc?.professor_profiles;
    const courseName = pc?.custom_course_name ?? course?.course_name ?? "Course";
    const lastName = prof?.last_name ?? "";
    return {
      assignmentId: row.id,
      professorCourseId: row.professor_course_id,
      courseName,
      professorName: `Professor ${lastName}, Esq.`,
      invitedAt: row.invited_at,
      acceptedAt: (row.accepted_at as string | null) ?? null,
    };
  });

  return {
    pending: rows.filter((r) => {
      const raw = (data ?? []).find((d) => d.id === r.assignmentId);
      return raw?.status === "pending";
    }),
    accepted: rows.filter((r) => {
      const raw = (data ?? []).find((d) => d.id === r.assignmentId);
      return raw?.status === "accepted";
    }),
  };
}

export async function getCourseTAs(professorCourseId: string): Promise<CourseTARow[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("course_tas")
    .select(
      "id, professor_course_id, user_id, slot_type, status, invited_at, accepted_at, student_profiles(first_name, last_name, university_email)",
    )
    .eq("professor_course_id", professorCourseId)
    .neq("status", "revoked")
    .order("invited_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const sp = Array.isArray(row.student_profiles)
      ? row.student_profiles[0]
      : row.student_profiles;
    return {
      id: row.id,
      professorCourseId: row.professor_course_id,
      userId: row.user_id,
      slotType: row.slot_type as "free" | "paid",
      status: row.status as "pending" | "accepted" | "declined",
      invitedAt: row.invited_at,
      acceptedAt: (row.accepted_at as string | null) ?? null,
      student: {
        firstName: (sp as { first_name: string } | null)?.first_name ?? "",
        lastName: (sp as { last_name: string } | null)?.last_name ?? "",
        universityEmail: (sp as { university_email: string } | null)?.university_email ?? "",
      },
    };
  });
}

export type ProjectFile = {
  id: string;
  label: string;
  audienceTag: "general" | "side_a" | "side_b" | "team_a" | "team_b" | "solo" | "ta_only";
  originalFilename: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  downloadUrl: string; // signed URL, 24h TTL
};

export type ProfessorProject = {
  id: string;
  title: string;
  tagline: string;
  pitch: string;
  modes: {
    versus: boolean;
    drafting: boolean;
    oralArgument: boolean;
    solo: boolean;
    team: boolean;
    creativity: boolean;
  };
  duration: "1hr" | "3hr" | "1wk" | "2wk" | "30day" | "semester";
  realWorld: boolean;
  worldRankQualifying: boolean;
  popularity: number;
  imagePaths: { image1: string | null; image2: string | null; image3: string | null };
  imageUrls:  { image1: string | null; image2: string | null; image3: string | null };
  areaOfLaw: string[];
  createdAt: string;
  files: ProjectFile[];
};

export async function getProfessorProjects(
  professorId: string,
): Promise<ProfessorProject[]> {
  const admin = createSupabaseAdminClient();

  // Query 1: all projects for this professor
  const { data: projects, error: projError } = await admin
    .from("projects")
    .select(
      "id, title, tagline, pitch, versus, drafting, oral_argument, solo, team, creativity, duration, real_world, world_rank_qualifying, popularity, image_1_path, image_2_path, image_3_path, area_of_law, created_at",
    )
    .eq("professor_id", professorId)
    .order("created_at", { ascending: false });

  if (projError) throw new Error(projError.message);
  if (!projects || projects.length === 0) return [];

  // Query 2: all project_files for those projects
  const projectIds = projects.map((p) => p.id);
  const { data: fileRows, error: fileError } = await admin
    .from("project_files")
    .select("id, project_id, label, audience_tag, original_filename, file_size_bytes, mime_type, storage_path, uploaded_at")
    .in("project_id", projectIds)
    .order("uploaded_at", { ascending: true });

  if (fileError) throw new Error(fileError.message);

  // Batch-generate signed URLs for all files (24h)
  const filePaths = (fileRows ?? []).map((f) => f.storage_path);
  const { data: fileSignedData } = filePaths.length
    ? await admin.storage.from("projects").createSignedUrls(filePaths, 86400)
    : { data: [] };
  const fileUrlMap = new Map((fileSignedData ?? []).map((s) => [s.path, s.signedUrl]));

  // Batch-generate signed URLs for catalog images (24h)
  const imagePaths = projects
    .flatMap((p) => [p.image_1_path, p.image_2_path, p.image_3_path])
    .filter(Boolean) as string[];
  const { data: imgSignedData } = imagePaths.length
    ? await admin.storage.from("projects").createSignedUrls(imagePaths, 86400)
    : { data: [] };
  const imgUrlMap = new Map((imgSignedData ?? []).map((s) => [s.path, s.signedUrl]));

  // Group files by project
  const filesByProject = new Map<string, ProjectFile[]>();
  for (const f of fileRows ?? []) {
    const list = filesByProject.get(f.project_id) ?? [];
    list.push({
      id: f.id,
      label: f.label,
      audienceTag: f.audience_tag as ProjectFile["audienceTag"],
      originalFilename: f.original_filename,
      fileSizeBytes: f.file_size_bytes,
      mimeType: f.mime_type,
      uploadedAt: f.uploaded_at,
      downloadUrl: fileUrlMap.get(f.storage_path) ?? "",
    });
    filesByProject.set(f.project_id, list);
  }

  return projects.map((p) => ({
    id: p.id,
    title: p.title,
    tagline: p.tagline,
    pitch: p.pitch,
    modes: {
      versus:       p.versus,
      drafting:     p.drafting,
      oralArgument: p.oral_argument,
      solo:         p.solo,
      team:         p.team,
      creativity:   p.creativity,
    },
    duration: p.duration as ProfessorProject["duration"],
    realWorld:            p.real_world,
    worldRankQualifying:  p.world_rank_qualifying,
    popularity:           p.popularity,
    imagePaths: {
      image1: (p.image_1_path as string | null) ?? null,
      image2: (p.image_2_path as string | null) ?? null,
      image3: (p.image_3_path as string | null) ?? null,
    },
    imageUrls: {
      image1: resolveImageUrl(p.image_1_path, imgUrlMap),
      image2: resolveImageUrl(p.image_2_path, imgUrlMap),
      image3: resolveImageUrl(p.image_3_path, imgUrlMap),
    },
    areaOfLaw: Array.isArray(p.area_of_law) ? (p.area_of_law as string[]) : [],
    createdAt: p.created_at,
    files: filesByProject.get(p.id) ?? [],
  }));
}

// ─── Project Shop — professor's library (downloaded projects) ────────────────

export async function getProfessorLibrary(
  professorId: string,
): Promise<ProfessorProject[]> {
  const admin = createSupabaseAdminClient();

  // 1. Library project IDs (active only)
  const { data: libRows, error: libErr } = await admin
    .from("professor_project_library")
    .select("project_id, added_at")
    .eq("professor_id", professorId)
    .eq("status", "active")
    .order("added_at", { ascending: false });
  if (libErr) throw new Error(libErr.message);
  if (!libRows || libRows.length === 0) return [];

  const projectIds = libRows.map((r) => r.project_id);

  // 2. The projects themselves
  const { data: projects, error: projErr } = await admin
    .from("projects")
    .select(
      "id, title, tagline, pitch, versus, drafting, oral_argument, solo, team, creativity, duration, real_world, world_rank_qualifying, popularity, image_1_path, image_2_path, image_3_path, area_of_law, created_at",
    )
    .in("id", projectIds);
  if (projErr) throw new Error(projErr.message);
  if (!projects || projects.length === 0) return [];

  // 3. Files for those projects
  const { data: fileRows, error: fileErr } = await admin
    .from("project_files")
    .select("id, project_id, label, audience_tag, original_filename, file_size_bytes, mime_type, storage_path, uploaded_at")
    .in("project_id", projectIds)
    .order("uploaded_at", { ascending: true });
  if (fileErr) throw new Error(fileErr.message);

  // 4. Signed URLs for files (24h)
  const filePaths = (fileRows ?? []).map((f) => f.storage_path);
  const { data: fileSignedData } = filePaths.length
    ? await admin.storage.from("projects").createSignedUrls(filePaths, 86400)
    : { data: [] };
  const fileUrlMap = new Map((fileSignedData ?? []).map((s) => [s.path, s.signedUrl]));

  // 5. Signed URLs for catalog images (24h)
  const imagePaths = projects
    .flatMap((p) => [p.image_1_path, p.image_2_path, p.image_3_path])
    .filter(Boolean) as string[];
  const { data: imgSignedData } = imagePaths.length
    ? await admin.storage.from("projects").createSignedUrls(imagePaths, 86400)
    : { data: [] };
  const imgUrlMap = new Map((imgSignedData ?? []).map((s) => [s.path, s.signedUrl]));

  // 6. Files grouped by project_id
  const filesByProject = new Map<string, ProjectFile[]>();
  for (const f of fileRows ?? []) {
    const list = filesByProject.get(f.project_id) ?? [];
    list.push({
      id: f.id,
      label: f.label,
      audienceTag: f.audience_tag as ProjectFile["audienceTag"],
      originalFilename: f.original_filename,
      fileSizeBytes: f.file_size_bytes,
      mimeType: f.mime_type,
      uploadedAt: f.uploaded_at,
      downloadUrl: fileUrlMap.get(f.storage_path) ?? "",
    });
    filesByProject.set(f.project_id, list);
  }

  // 7. Preserve library added_at order
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  return libRows
    .map((libRow) => {
      const p = projectMap.get(libRow.project_id);
      if (!p) return null;
      return {
        id: p.id,
        title: p.title,
        tagline: p.tagline,
        pitch: p.pitch,
        modes: {
          versus: p.versus,
          drafting: p.drafting,
          oralArgument: p.oral_argument,
          solo: p.solo,
          team: p.team,
          creativity: p.creativity,
        },
        duration: p.duration as ProfessorProject["duration"],
        realWorld: p.real_world,
        worldRankQualifying: p.world_rank_qualifying,
        popularity: p.popularity,
        imagePaths: {
          image1: (p.image_1_path as string | null) ?? null,
          image2: (p.image_2_path as string | null) ?? null,
          image3: (p.image_3_path as string | null) ?? null,
        },
        imageUrls: {
          image1: resolveImageUrl(p.image_1_path, imgUrlMap),
          image2: resolveImageUrl(p.image_2_path, imgUrlMap),
          image3: resolveImageUrl(p.image_3_path, imgUrlMap),
        },
        areaOfLaw: Array.isArray(p.area_of_law) ? (p.area_of_law as string[]) : [],
        createdAt: p.created_at,
        files: filesByProject.get(p.id) ?? [],
      } satisfies ProfessorProject;
    })
    .filter((p): p is ProfessorProject => p !== null);
}

export type TAProfessorProjectGroup = {
  professorId: string;
  professorName: string;   // "Professor {lastName}, Esq."
  courseNames: string[];   // sections this TA is assigned to under this professor
  projects: ProfessorProject[]; // TAs see all audience tags — no filtering at query layer
};

export async function getProjectsForTAUser(
  userId: string,
): Promise<TAProfessorProjectGroup[]> {
  const admin = createSupabaseAdminClient();

  const { data: student } = await admin
    .from("student_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!student) return [];

  const { data: taRows, error: taError } = await admin
    .from("course_tas")
    .select(
      "professor_course_id, professor_courses(professor_id, custom_course_name, courses(course_name), professor_profiles(id, last_name))",
    )
    .eq("user_id", student.id)
    .eq("status", "accepted");

  if (taError) throw new Error(taError.message);
  if (!taRows || taRows.length === 0) return [];

  type ProfEntry = { professorId: string; lastName: string; courseNames: string[] };
  const profMap = new Map<string, ProfEntry>();
  for (const row of taRows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pc = (Array.isArray(row.professor_courses) ? row.professor_courses[0] : row.professor_courses) as any;
    if (!pc) continue;
    const prof = Array.isArray(pc.professor_profiles) ? pc.professor_profiles[0] : pc.professor_profiles;
    const course = Array.isArray(pc.courses) ? pc.courses[0] : pc.courses;
    const professorId = prof?.id ?? pc.professor_id;
    const lastName = prof?.last_name ?? "";
    const courseName = pc.custom_course_name ?? course?.course_name ?? "Unknown course";
    const existing = profMap.get(professorId);
    if (existing) {
      if (!existing.courseNames.includes(courseName)) existing.courseNames.push(courseName);
    } else {
      profMap.set(professorId, { professorId, lastName, courseNames: [courseName] });
    }
  }

  const groups: TAProfessorProjectGroup[] = [];
  for (const entry of profMap.values()) {
    // Reuse getProfessorProjects — returns full shape with files + signed URLs
    const projects = await getProfessorProjects(entry.professorId);
    groups.push({
      professorId: entry.professorId,
      professorName: `Professor ${entry.lastName}, Esq.`,
      courseNames: entry.courseNames,
      projects,
    });
  }

  groups.sort((a, b) => a.professorName.localeCompare(b.professorName));
  return groups;
}

// ─── Project Shop catalog ─────────────────────────────────────────────────────
// Note: CatalogSortKey and CATALOG_SORT_OPTIONS live in
// src/lib/projects/project-types.ts so client components (sort-dropdown.tsx)
// can import them without pulling next/headers into their bundle. Re-export
// here so server-side callers don't need a second import path.

export type { CatalogSortKey } from "@/lib/projects/project-types";
export { CATALOG_SORT_OPTIONS } from "@/lib/projects/project-types";

import type { CatalogSortKey } from "@/lib/projects/project-types";

export type CatalogFilters = {
  keyword:       string;
  areas:         string[];
  modes:         string[];   // "versus" | "drafting" | "oral_argument" | "solo" | "team" | "creativity"
  durations:     string[];   // "1hr" | "3hr" | "1wk" | "2wk" | "30day" | "semester"
  realWorld:     boolean;    // true => only real_world=true
  worldRank:     boolean;    // true => only world_rank_qualifying=true
  mootCourt:     boolean;    // true => only moot_court=true
  // ─── Faceted search dimensions added 2026-05-08 ─────────────────────────────
  industries:    string[];   // multi-select from src/lib/projects/industries.ts
  tags:          string[];   // free-form keywords (overlaps match)
  courseIds:     string[];   // matches via project_courses junction (any-of)
};

export type ProjectShopCard = {
  id:            string;
  title:         string;
  tagline:       string;
  pitch:         string;
  areaOfLaw:     string[];
  modes: {
    versus:        boolean;
    drafting:      boolean;
    oralArgument:  boolean;
    solo:          boolean;
    team:          boolean;
    creativity:    boolean;
  };
  duration:           "1hr" | "3hr" | "1wk" | "2wk" | "30day" | "semester";
  realWorld:          boolean;
  worldRankQualifying:boolean;
  mootCourt:          boolean;
  price:              number;       // numeric(10,2)
  popularity:         number;
  usageCount:         number;
  createdAt:          string;
  imageUrl:           string | null; // signed URL for image_1_path
  authorId:           string;
  authorName:         string;       // "First Last"
  // Faceted-search dimensions (added 2026-05-08). Empty arrays until projects
  // are tagged.
  industries:         string[];
  tags:               string[];
};

const MODE_KEYS = ["versus", "drafting", "oral_argument", "solo", "team", "creativity"] as const;

export const CATALOG_PAGE_SIZE = 9;

export type CatalogPage = {
  projects:   ProjectShopCard[];
  totalCount: number;
  page:       number;       // 1-based
  pageSize:   number;
  pageCount:  number;       // ceil(totalCount / pageSize), min 1
};

export async function getCatalogProjects(
  filters: CatalogFilters,
  sort: CatalogSortKey,
  page: number = 1,
  pageSize: number = CATALOG_PAGE_SIZE,
): Promise<CatalogPage> {
  const admin = createSupabaseAdminClient();
  const safePage = Math.max(1, Math.floor(page));
  const offset   = (safePage - 1) * pageSize;

  // ─── Course filter pre-pass ────────────────────────────────────────────────
  // The project_courses junction lives in its own table, so when courses are
  // selected we resolve to a project_id whitelist BEFORE running the main
  // query. (Supabase JS doesn't expose IN-subquery, so two-pass is simplest.)
  let courseProjectWhitelist: string[] | null = null;
  if (filters.courseIds.length) {
    const { data: pcRows, error: pcErr } = await admin
      .from("project_courses")
      .select("project_id")
      .in("course_id", filters.courseIds);
    if (pcErr) throw new Error(pcErr.message);
    courseProjectWhitelist = Array.from(
      new Set((pcRows ?? []).map((r) => r.project_id as string)),
    );
    if (courseProjectWhitelist.length === 0) {
      return { projects: [], totalCount: 0, page: safePage, pageSize, pageCount: 1 };
    }
  }

  let query = admin
    .from("projects")
    .select(
      `id, title, tagline, pitch, area_of_law,
       industries, tags,
       versus, drafting, oral_argument, solo, team, creativity,
       duration, real_world, world_rank_qualifying, moot_court,
       price, popularity, usage_count, created_at, image_1_path,
       professor_id, professor_profiles!projects_professor_id_fkey(id, first_name, last_name)`,
      { count: "exact" },
    );

  // Course whitelist (from prep-pass above)
  if (courseProjectWhitelist) query = query.in("id", courseProjectWhitelist);

  // Keyword: ILIKE across title / tagline / pitch
  const k = filters.keyword.trim();
  if (k) {
    const escaped = k.replace(/[%_]/g, (c) => `\\${c}`);
    query = query.or(
      `title.ilike.%${escaped}%,tagline.ilike.%${escaped}%,pitch.ilike.%${escaped}%`,
    );
  }

  // Area of Law: text[] overlaps
  if (filters.areas.length) query = query.overlaps("area_of_law", filters.areas);

  // Industries: text[] overlaps
  if (filters.industries.length) query = query.overlaps("industries", filters.industries);

  // Tags: text[] overlaps (case-insensitive isn't supported by overlaps; we
  // lowercase tags at write-time so this works as long as authors store them
  // normalized — see CreateProject form).
  if (filters.tags.length) query = query.overlaps("tags", filters.tags);

  // Mode booleans: any-of (OR over selected mode columns)
  const modeFilters = filters.modes.filter((m) =>
    (MODE_KEYS as readonly string[]).includes(m),
  );
  if (modeFilters.length) {
    query = query.or(modeFilters.map((m) => `${m}.eq.true`).join(","));
  }

  // Duration: in
  if (filters.durations.length) query = query.in("duration", filters.durations);

  // Real World / World Rank / Moot Court toggles
  if (filters.realWorld) query = query.eq("real_world", true);
  if (filters.worldRank) query = query.eq("world_rank_qualifying", true);
  if (filters.mootCourt) query = query.eq("moot_court", true);

  // Sort
  switch (sort) {
    case "most_popular":  query = query.order("popularity",   { ascending: false }); break;
    case "least_popular": query = query.order("popularity",   { ascending: true  }); break;
    case "price_high":    query = query.order("price",        { ascending: false }); break;
    case "price_low":     query = query.order("price",        { ascending: true  }); break;
    case "most_used":     query = query.order("usage_count",  { ascending: false }); break;
    case "least_used":    query = query.order("usage_count",  { ascending: true  }); break;
    case "oldest":        query = query.order("created_at",   { ascending: true  }); break;
    case "newest":
    default:              query = query.order("created_at",   { ascending: false }); break;
  }

  // Apply pagination range
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const totalCount = count ?? 0;
  const pageCount  = Math.max(1, Math.ceil(totalCount / pageSize));
  if (!data || data.length === 0) {
    return { projects: [], totalCount, page: safePage, pageSize, pageCount };
  }

  // Batch-sign image_1 URLs
  const imagePaths = data.map((p) => p.image_1_path).filter(Boolean) as string[];
  const { data: imgSigned } = imagePaths.length
    ? await admin.storage.from("projects").createSignedUrls(imagePaths, 86400)
    : { data: [] };
  const imgUrlMap = new Map((imgSigned ?? []).map((s) => [s.path, s.signedUrl]));

  const projects: ProjectShopCard[] = data.map((p) => {
    const prof = Array.isArray(p.professor_profiles)
      ? p.professor_profiles[0]
      : p.professor_profiles;
    return {
      id:        p.id,
      title:     p.title,
      tagline:   p.tagline,
      pitch:     p.pitch,
      areaOfLaw: Array.isArray(p.area_of_law) ? (p.area_of_law as string[]) : [],
      modes: {
        versus:       p.versus,
        drafting:     p.drafting,
        oralArgument: p.oral_argument,
        solo:         p.solo,
        team:         p.team,
        creativity:   p.creativity,
      },
      duration:            p.duration as ProjectShopCard["duration"],
      realWorld:           p.real_world,
      worldRankQualifying: p.world_rank_qualifying,
      mootCourt:           p.moot_court ?? false,
      price:               Number(p.price ?? 0),
      popularity:          p.popularity ?? 0,
      usageCount:          p.usage_count ?? 0,
      createdAt:           p.created_at,
      imageUrl:            resolveImageUrl(p.image_1_path, imgUrlMap),
      authorId:            (prof as { id: string } | null)?.id ?? p.professor_id,
      authorName:          prof
        ? `${(prof as { first_name: string }).first_name} ${(prof as { last_name: string }).last_name}`
        : "Unknown author",
      industries:          Array.isArray(p.industries) ? (p.industries as string[]) : [],
      tags:                Array.isArray(p.tags)       ? (p.tags       as string[]) : [],
    };
  });

  return { projects, totalCount, page: safePage, pageSize, pageCount };
}

// ─── Project Shop — author page ───────────────────────────────────────────────

export type AuthorPageData = {
  professorId:    string;
  professorName:  string;
  photoUrl:       string | null;
  universityName: string;
  isViewerSelf:   boolean;
  projects:       ProjectShopCard[];
};

export async function getAuthorPageData(
  authorProfessorId: string,
  viewerProfessorId: string | null,
): Promise<AuthorPageData | null> {
  const admin = createSupabaseAdminClient();

  // 1. Author profile
  const { data: prof, error: profErr } = await admin
    .from("professor_profiles")
    .select("id, first_name, last_name, photo_path, university_name_snapshot")
    .eq("id", authorProfessorId)
    .maybeSingle();
  if (profErr) throw new Error(profErr.message);
  if (!prof) return null;

  // 2. Author's authored projects (newest first)
  const { data: projectRows, error: projErr } = await admin
    .from("projects")
    .select(
      `id, title, tagline, pitch, area_of_law,
       industries, tags,
       versus, drafting, oral_argument, solo, team, creativity,
       duration, real_world, world_rank_qualifying, moot_court,
       price, popularity, usage_count, created_at, image_1_path, professor_id`,
    )
    .eq("professor_id", authorProfessorId)
    .order("created_at", { ascending: false });
  if (projErr) throw new Error(projErr.message);

  // 3. Author photo signed URL (1h)
  let photoUrl: string | null = null;
  const photoPath = (prof.photo_path as string | null) ?? null;
  if (photoPath) {
    const { data: signedPhoto } = await admin.storage
      .from("professor-photos")
      .createSignedUrl(photoPath, 3600);
    photoUrl = signedPhoto?.signedUrl ?? null;
  }

  // 4. Batch-sign poster images (24h)
  const imagePaths = (projectRows ?? [])
    .map((p) => p.image_1_path)
    .filter(Boolean) as string[];
  const { data: imgSigned } = imagePaths.length
    ? await admin.storage.from("projects").createSignedUrls(imagePaths, 86400)
    : { data: [] };
  const imgUrlMap = new Map((imgSigned ?? []).map((s) => [s.path, s.signedUrl]));

  const authorName = `${prof.first_name} ${prof.last_name}`;

  const projects: ProjectShopCard[] = (projectRows ?? []).map((p) => ({
    id:        p.id,
    title:     p.title,
    tagline:   p.tagline,
    pitch:     p.pitch,
    areaOfLaw: Array.isArray(p.area_of_law) ? (p.area_of_law as string[]) : [],
    modes: {
      versus:       p.versus,
      drafting:     p.drafting,
      oralArgument: p.oral_argument,
      solo:         p.solo,
      team:         p.team,
      creativity:   p.creativity,
    },
    duration:            p.duration as ProjectShopCard["duration"],
    realWorld:           p.real_world,
    worldRankQualifying: p.world_rank_qualifying,
    mootCourt:           p.moot_court ?? false,
    price:               Number(p.price ?? 0),
    popularity:          p.popularity ?? 0,
    usageCount:          p.usage_count ?? 0,
    createdAt:           p.created_at,
    imageUrl:            resolveImageUrl(p.image_1_path, imgUrlMap),
    authorId:            authorProfessorId,
    authorName,
    industries:          Array.isArray(p.industries) ? (p.industries as string[]) : [],
    tags:                Array.isArray(p.tags)       ? (p.tags       as string[]) : [],
  }));

  return {
    professorId:    authorProfessorId,
    professorName:  authorName,
    photoUrl,
    universityName: (prof.university_name_snapshot as string | null) ?? "",
    isViewerSelf:   viewerProfessorId !== null && authorProfessorId === viewerProfessorId,
    projects,
  };
}

// ─── Project Shop detail page ─────────────────────────────────────────────────

export type ProjectShopDetailFile = {
  id:               string;
  label:            string;
  audienceTag:      "general" | "side_a" | "side_b" | "team_a" | "team_b" | "solo" | "ta_only";
  originalFilename: string;
  fileSizeBytes:    number;
  mimeType:         string;
  uploadedAt:       string;
  // Only set when viewer is the author. Other professors see metadata only.
  downloadUrl:      string | null;
};

export type ProjectShopDetail = {
  id:            string;
  title:         string;
  tagline:       string;
  pitch:         string;
  areaOfLaw:     string[];
  modes: {
    versus:        boolean;
    drafting:      boolean;
    oralArgument:  boolean;
    solo:          boolean;
    team:          boolean;
    creativity:    boolean;
  };
  duration:            "1hr" | "3hr" | "1wk" | "2wk" | "30day" | "semester";
  realWorld:           boolean;
  worldRankQualifying: boolean;
  mootCourt:           boolean;
  price:               number;
  popularity:          number;
  usageCount:          number;
  createdAt:           string;
  imageUrls:           { image1: string | null; image2: string | null; image3: string | null };
  authorId:            string;
  authorName:          string;
  authorPhotoUrl:      string | null;
  files:               ProjectShopDetailFile[];
  // Convenience flag — true if the current viewer is the author of this project
  isViewerAuthor:      boolean;
  // Convenience flag — true if the current viewer has this project in their library (status='active')
  viewerHasInLibrary:  boolean;
  // Faceted-search dimensions (added 2026-05-08)
  industries:          string[];
  tags:                string[];
  courses:             { id: string; courseName: string; schoolName: string }[];
};

export async function getProjectShopDetail(
  projectId:           string,
  viewerProfessorId:   string | null,
): Promise<ProjectShopDetail | null> {
  const admin = createSupabaseAdminClient();

  const { data: p, error: projErr } = await admin
    .from("projects")
    .select(
      `id, title, tagline, pitch, area_of_law,
       industries, tags,
       versus, drafting, oral_argument, solo, team, creativity,
       duration, real_world, world_rank_qualifying, moot_court,
       price, popularity, usage_count, created_at,
       image_1_path, image_2_path, image_3_path,
       professor_id, professor_profiles!projects_professor_id_fkey(id, first_name, last_name, photo_path)`,
    )
    .eq("id", projectId)
    .maybeSingle();

  if (projErr) throw new Error(projErr.message);
  if (!p) return null;

  // Course tags from project_courses junction
  type CourseJoinRow = {
    course_id: string;
    courses:   { id: string; course_name: string; schools: { name: string } | { name: string }[] | null } | null;
  };
  const { data: courseRows } = await admin
    .from("project_courses")
    .select("course_id, courses(id, course_name, schools(name))")
    .eq("project_id", projectId);
  const courses = ((courseRows ?? []) as unknown as CourseJoinRow[])
    .map((cr) => {
      const c = cr.courses;
      if (!c) return null;
      const sch = Array.isArray(c.schools) ? c.schools[0] : c.schools;
      return {
        id:         c.id,
        courseName: c.course_name,
        schoolName: sch?.name ?? "",
      };
    })
    .filter(Boolean) as { id: string; courseName: string; schoolName: string }[];

  // Anonymous / non-professor viewers get no author/library status
  const isViewerAuthor = viewerProfessorId !== null && p.professor_id === viewerProfessorId;

  // Check if viewer has this project in their library (status='active')
  let viewerHasInLibrary = false;
  if (viewerProfessorId !== null && !isViewerAuthor) {
    const { data: libRow } = await admin
      .from("professor_project_library")
      .select("status")
      .eq("professor_id", viewerProfessorId)
      .eq("project_id", projectId)
      .eq("status", "active")
      .maybeSingle();
    viewerHasInLibrary = !!libRow;
  }

  // Batch-sign image URLs (24h)
  const imagePaths = [p.image_1_path, p.image_2_path, p.image_3_path].filter(Boolean) as string[];
  const { data: imgSigned } = imagePaths.length
    ? await admin.storage.from("projects").createSignedUrls(imagePaths, 86400)
    : { data: [] };
  const imgUrlMap = new Map((imgSigned ?? []).map((s) => [s.path, s.signedUrl]));

  // Sign author photo URL if present (professor-photos is a public bucket but
  // we keep this consistent with ProfessorPhotoWidget pattern using signed URLs)
  const prof = Array.isArray(p.professor_profiles)
    ? p.professor_profiles[0]
    : p.professor_profiles;
  const photoPath = (prof as { photo_path: string | null } | null)?.photo_path ?? null;
  let authorPhotoUrl: string | null = null;
  if (photoPath) {
    const { data: signedPhoto } = await admin.storage
      .from("professor-photos")
      .createSignedUrl(photoPath, 3600);
    authorPhotoUrl = signedPhoto?.signedUrl ?? null;
  }

  // Files — fetch metadata for everyone; only generate download URLs if viewer is author
  const { data: fileRows, error: fileErr } = await admin
    .from("project_files")
    .select("id, label, audience_tag, original_filename, file_size_bytes, mime_type, storage_path, uploaded_at")
    .eq("project_id", projectId)
    .order("uploaded_at", { ascending: true });
  if (fileErr) throw new Error(fileErr.message);

  let fileUrlMap = new Map<string, string>();
  if (isViewerAuthor && fileRows && fileRows.length > 0) {
    const filePaths = fileRows.map((f) => f.storage_path);
    const { data: fileSigned } = await admin.storage
      .from("projects")
      .createSignedUrls(filePaths, 86400);
    fileUrlMap = new Map<string, string>(
      (fileSigned ?? [])
        .flatMap((s) =>
          s.path != null && s.signedUrl != null ? [[s.path, s.signedUrl] as [string, string]] : []
        )
    );
  }

  const files: ProjectShopDetailFile[] = (fileRows ?? []).map((f) => ({
    id:               f.id,
    label:            f.label,
    audienceTag:      f.audience_tag as ProjectShopDetailFile["audienceTag"],
    originalFilename: f.original_filename,
    fileSizeBytes:    f.file_size_bytes,
    mimeType:         f.mime_type,
    uploadedAt:       f.uploaded_at,
    downloadUrl:      isViewerAuthor ? (fileUrlMap.get(f.storage_path) ?? null) : null,
  }));

  return {
    id:        p.id,
    title:     p.title,
    tagline:   p.tagline,
    pitch:     p.pitch,
    areaOfLaw: Array.isArray(p.area_of_law) ? (p.area_of_law as string[]) : [],
    modes: {
      versus:       p.versus,
      drafting:     p.drafting,
      oralArgument: p.oral_argument,
      solo:         p.solo,
      team:         p.team,
      creativity:   p.creativity,
    },
    duration:            p.duration as ProjectShopDetail["duration"],
    realWorld:           p.real_world,
    worldRankQualifying: p.world_rank_qualifying,
    mootCourt:           p.moot_court ?? false,
    price:               Number(p.price ?? 0),
    popularity:          p.popularity ?? 0,
    usageCount:          p.usage_count ?? 0,
    createdAt:           p.created_at,
    imageUrls: {
      image1: resolveImageUrl(p.image_1_path, imgUrlMap),
      image2: resolveImageUrl(p.image_2_path, imgUrlMap),
      image3: resolveImageUrl(p.image_3_path, imgUrlMap),
    },
    authorId:        (prof as { id: string } | null)?.id ?? p.professor_id,
    authorName:      prof
      ? `${(prof as { first_name: string }).first_name} ${(prof as { last_name: string }).last_name}`
      : "Unknown author",
    authorPhotoUrl,
    files,
    isViewerAuthor,
    viewerHasInLibrary,
    industries: Array.isArray(p.industries) ? (p.industries as string[]) : [],
    tags:       Array.isArray(p.tags)       ? (p.tags       as string[]) : [],
    courses,
  };
}

export async function getRandomApprovedQuote(): Promise<{ quote: string; attribution: string } | null> {
  const admin = createSupabaseAdminClient();
  // Fetch all approved quotes and pick one randomly in JS.
  // Dataset is small (O(100) rows) so this is efficient enough.
  const { data, error } = await admin
    .from("quote_submissions")
    .select("quote, attribution")
    .eq("status", "approved");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  const pick = data[Math.floor(Math.random() * data.length)];
  return { quote: pick.quote, attribution: pick.attribution };
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
