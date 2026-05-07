/**
 * Idempotent dev-user seed script.
 * Creates three test accounts in Supabase Auth + the matching profile rows:
 *   test-student@rockstarlaw.dev   (student)
 *   test-professor@rockstarlaw.dev  (professor)
 *   test-admin@rockstarlaw.dev      (admin)
 *
 * Safe to run multiple times — all inserts use ON CONFLICT DO NOTHING.
 *
 * PRODUCTION SAFETY: Refuses to run if NEXT_PUBLIC_SUPABASE_URL contains the
 * production project ref. Pass --i-am-sure to bypass (use with extreme caution).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/seed-dev-users.ts
 *   — or —
 *   npm run seed:dev-users
 */

import { createClient } from "@supabase/supabase-js";

const PRODUCTION_REF = "ytunujsljzfgsscovznf";
const DEV_PASSWORD    = process.env.QUICK_LOGIN_DEV_PASSWORD ?? "Rockstar2026!Dev#Test";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ─── Production URL guard ─────────────────────────────────────────────────────

if (url.includes(PRODUCTION_REF)) {
  if (!process.argv.includes("--i-am-sure")) {
    console.error(
      "\nREFUSING — this looks like the production Supabase (ref: " + PRODUCTION_REF + ").\n" +
      "Aborting seed to protect production data.\n" +
      "If you really mean to run this against production, pass --i-am-sure.\n"
    );
    process.exit(1);
  }
  console.warn("⚠  --i-am-sure passed. Running against production URL. You asked for it.");
}

const admin = createClient(url, key, { auth: { persistSession: false } });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findOrCreateAuthUser(email: string, password: string): Promise<string> {
  // Check if user already exists
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = (list?.users ?? []).find(u => u.email === email);
  if (existing) {
    console.log(`  auth user exists:    ${email} (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  console.log(`  auth user created:   ${email} (${data.user.id})`);
  return data.user.id;
}

async function upsertAppUser(userId: string, role: string) {
  const { error } = await admin.from("app_users").upsert(
    { user_id: userId, primary_role: role },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
  if (error) throw new Error(`app_users(${userId}): ${error.message}`);
}

// ─── Get Nova Southeastern ────────────────────────────────────────────────────

async function getNovaSchool() {
  const { data, error } = await admin
    .from("schools")
    .select("id, name, address_line_1, city, state, postal_code, country")
    .ilike("name", "%Nova%")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`schools query: ${error.message}`);
  if (!data) throw new Error("Nova Southeastern not found in schools table. Run the registration-app MVP seed first.");
  console.log(`  found school: ${data.name} (${data.id})`);
  return data;
}

// ─── Seed test-student ────────────────────────────────────────────────────────

async function seedStudent(userId: string, school: { id: string; name: string; address_line_1: string; city: string; state: string; postal_code: string; country: string }) {
  await upsertAppUser(userId, "student");

  const { error } = await admin.from("student_profiles").upsert(
    {
      user_id:                   userId,
      first_name:                "Test",
      last_name:                 "Student",
      university_email:          "test-student@rockstarlaw.dev",
      additional_emails:         [],
      mobile_phone:              "555-000-9001",
      address_line_1:            "100 Test Drive",
      city:                      "Fort Lauderdale",
      state:                     "FL",
      postal_code:               "33314",
      country:                   "United States",
      university_id:             school.id,
      university_name_snapshot:  school.name,
      university_address_snapshot: {
        address_line_1: school.address_line_1,
        city:           school.city,
        state:          school.state,
        postal_code:    school.postal_code,
        country:        school.country,
      },
      onboarding_status:         "incomplete",
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
  if (error) throw new Error(`student_profiles: ${error.message}`);
  console.log("  student_profiles row: ok");
}

// ─── Seed test-professor ──────────────────────────────────────────────────────

async function seedProfessor(userId: string, school: { id: string; name: string; address_line_1: string; city: string; state: string; postal_code: string; country: string }) {
  await upsertAppUser(userId, "professor");

  // professor_profiles
  const { data: profData, error: profError } = await admin
    .from("professor_profiles")
    .upsert(
      {
        user_id:                    userId,
        first_name:                 "Test",
        last_name:                  "Professor",
        title:                      "Adjunct Professor",
        email:                      "test-professor@rockstarlaw.dev",
        mobile_phone:               "555-000-9002",
        address_line_1:             "200 Faculty Row",
        city:                       "Fort Lauderdale",
        state:                      "FL",
        postal_code:                "33314",
        country:                    "United States",
        university_id:              school.id,
        university_name_snapshot:   school.name,
        university_address_snapshot: {
          address_line_1: school.address_line_1,
          city:           school.city,
          state:          school.state,
          postal_code:    school.postal_code,
          country:        school.country,
        },
        approval_status:            "approved",
        onboarding_status:          "started",
      },
      { onConflict: "user_id", ignoreDuplicates: false }
    )
    .select("id")
    .single();
  if (profError) throw new Error(`professor_profiles: ${profError.message}`);
  const professorProfileId = profData.id;
  console.log(`  professor_profiles row: ok (${professorProfileId})`);

  // Check if a course already exists for this professor
  const { data: existingCourse } = await admin
    .from("courses")
    .select("id")
    .eq("school_id", school.id)
    .eq("created_by_user_id", userId)
    .limit(1)
    .maybeSingle();

  let courseId: string;
  if (existingCourse) {
    courseId = existingCourse.id;
    console.log(`  course exists: (${courseId})`);
  } else {
    const { data: courseData, error: courseError } = await admin
      .from("courses")
      .insert({
        school_id:          school.id,
        course_name:        "Entertainment Law — Dev Seed",
        status:             "active",
        created_by_user_id: userId,
      })
      .select("id")
      .single();
    if (courseError) throw new Error(`courses: ${courseError.message}`);
    courseId = courseData.id;
    console.log(`  course created: (${courseId})`);
  }

  // professor_courses
  const { data: existingPC } = await admin
    .from("professor_courses")
    .select("id")
    .eq("professor_id", professorProfileId)
    .eq("course_id", courseId)
    .maybeSingle();

  let professorCourseId: string;
  if (existingPC) {
    professorCourseId = existingPC.id;
    console.log(`  professor_courses exists: (${professorCourseId})`);
  } else {
    const { data: pcData, error: pcError } = await admin
      .from("professor_courses")
      .insert({
        professor_id:       professorProfileId,
        course_id:          courseId,
        custom_course_name: "Entertainment Law — Dev Seed",
        status:             "active",
      })
      .select("id")
      .single();
    if (pcError) throw new Error(`professor_courses: ${pcError.message}`);
    professorCourseId = pcData.id;
    console.log(`  professor_courses created: (${professorCourseId})`);
  }

  // course_modules — seed all 6 modules for this course
  const { data: modules, error: modError } = await admin
    .from("modules")
    .select("id");
  if (modError) throw new Error(`modules query: ${modError.message}`);
  if (modules && modules.length > 0) {
    const cmRows = modules.map(m => ({ course_id: courseId, module_id: m.id, enabled_via: "auto" as const }));
    const { error: cmError } = await admin
      .from("course_modules")
      .upsert(cmRows, { onConflict: "course_id,module_id", ignoreDuplicates: true });
    if (cmError) throw new Error(`course_modules: ${cmError.message}`);
    console.log(`  course_modules seeded: ${modules.length} modules`);
  }
}

// ─── Seed test-admin ──────────────────────────────────────────────────────────

async function seedAdmin(userId: string) {
  await upsertAppUser(userId, "admin");
  console.log("  admin app_users row: ok");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== seed-dev-users ===");
  console.log(`  Supabase URL: ${url.substring(0, 40)}...`);

  const school = await getNovaSchool();

  console.log("\n[1/3] test-student@rockstarlaw.dev");
  const studentId = await findOrCreateAuthUser("test-student@rockstarlaw.dev", DEV_PASSWORD);
  await seedStudent(studentId, school);

  console.log("\n[2/3] test-professor@rockstarlaw.dev");
  const profId = await findOrCreateAuthUser("test-professor@rockstarlaw.dev", DEV_PASSWORD);
  await seedProfessor(profId, school);

  console.log("\n[3/3] test-admin@rockstarlaw.dev");
  const adminId = await findOrCreateAuthUser("test-admin@rockstarlaw.dev", DEV_PASSWORD);
  await seedAdmin(adminId);

  console.log("\n✓ Dev users seeded successfully. Run seed again anytime — it is idempotent.\n");
}

main().catch(e => {
  console.error("\n✗ Seed failed:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
