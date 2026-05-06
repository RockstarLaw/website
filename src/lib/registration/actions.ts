"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { updateProfessorOnboardingStatus, updateStudentOnboardingStatus } from "@/lib/onboarding/status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegistrationActionState } from "./types";

const baseAccountSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  mobilePhone: z.string().trim().min(1, "Mobile phone is required."),
  addressLine1: z.string().trim().min(1, "Address line 1 is required."),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(1, "State is required."),
  postalCode: z.string().trim().min(1, "Postal code is required."),
  country: z.string().trim().min(1, "Country is required."),
  schoolId: z.string().trim().uuid("Select a school from the list."),
});

const studentSchema = baseAccountSchema.extend({
  middleName: z.string().trim().optional(),
  preferredName: z.string().trim().optional(),
  universityEmail: z.string().trim().email("Enter a valid university email."),
  addressLine2: z.string().trim().optional(),
  lawSchoolYear: z.string().trim().optional(),
  enrollmentStatus: z.string().trim().optional(),
  undergraduateInstitution: z.string().trim().optional(),
});

const professorSchema = baseAccountSchema.extend({
  title: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  selectedCourses: z.string().trim().min(1, "Enter at least one course."),
});

const schoolRequestSchema = z.object({
  schoolName: z.string().trim().min(1, "School name is required."),
  addressLine1: z.string().trim().min(1, "Address line 1 is required."),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(1, "State is required."),
  postalCode: z.string().trim().min(1, "Postal code is required."),
  country: z.string().trim().min(1, "Country is required."),
  websiteUrl: z.union([z.string().trim().url("Enter a valid URL."), z.literal("")]).optional(),
  adminContactName: z.string().trim().min(1, "Contact name is required."),
  adminContactEmail: z.string().trim().email("Enter a valid contact email."),
  domains: z.string().trim().optional(),
});

function normalizeSchoolName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeCourseNames(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

async function createAuthUser(params: {
  email: string;
  password: string;
  metadata: Record<string, string>;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: params.metadata,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to create auth user.");
  }

  return data.user;
}

async function deleteAuthUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function getSchoolSnapshot(schoolId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("schools")
    .select("id, name, address_line_1, city, state, postal_code, country")
    .eq("id", schoolId)
    .single();

  if (error || !data) {
    throw new Error("Selected school was not found.");
  }

  return data;
}

export async function registerStudent(
  _previousState: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  const parsed = studentSchema.safeParse({
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    lastName: formData.get("lastName"),
    preferredName: formData.get("preferredName"),
    email: formData.get("email"),
    password: formData.get("password"),
    mobilePhone: formData.get("mobilePhone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    schoolId: formData.get("schoolId"),
    universityEmail: formData.get("universityEmail"),
    lawSchoolYear: formData.get("lawSchoolYear"),
    enrollmentStatus: formData.get("enrollmentStatus"),
    undergraduateInstitution: formData.get("undergraduateInstitution"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration data.", success: "" };
  }

  let authUserId: string | null = null;

  try {
    const school = await getSchoolSnapshot(parsed.data.schoolId);
    const authUser = await createAuthUser({
      email: parsed.data.email,
      password: parsed.data.password,
      metadata: { role: "student" },
    });
    authUserId = authUser.id;

    const admin = createSupabaseAdminClient();
    const { error: appUserError } = await admin.from("app_users").insert({
      user_id: authUser.id,
      primary_role: "student",
    });

    if (appUserError) {
      throw new Error(appUserError.message);
    }

    const additionalEmails = [parsed.data.email]
      .filter((email) => email !== parsed.data.universityEmail)
      .map((email) => email.toLowerCase());

    const { data: profile, error: profileError } = await admin
      .from("student_profiles")
      .insert({
        user_id: authUser.id,
        first_name: parsed.data.firstName,
        middle_name: parsed.data.middleName || null,
        last_name: parsed.data.lastName,
        preferred_name: parsed.data.preferredName || null,
        university_email: parsed.data.universityEmail,
        additional_emails: additionalEmails,
        mobile_phone: parsed.data.mobilePhone,
        address_line_1: parsed.data.addressLine1,
        address_line_2: parsed.data.addressLine2 || null,
        city: parsed.data.city,
        state: parsed.data.state,
        postal_code: parsed.data.postalCode,
        country: parsed.data.country,
        university_id: school.id,
        university_name_snapshot: school.name,
        university_address_snapshot: {
          address_line_1: school.address_line_1,
          city: school.city,
          state: school.state,
          postal_code: school.postal_code,
          country: school.country,
        },
        law_school_year: parsed.data.lawSchoolYear || null,
        enrollment_status: parsed.data.enrollmentStatus || null,
        undergraduate_institution: parsed.data.undergraduateInstitution || null,
        onboarding_status: "started",
      })
      .select("id, user_id, university_id, first_name, last_name, university_email, mobile_phone, address_line_1, address_line_2, city, state, postal_code, country, law_school_year, enrollment_status, undergraduate_institution")
      .single();

    if (profileError || !profile) {
      throw new Error(profileError?.message ?? "Unable to create student profile.");
    }

    await updateStudentOnboardingStatus(profile.id);
    // Registration succeeded — fall through to auto sign-in
  } catch (error) {
    if (authUserId) {
      try {
        await deleteAuthUser(authUserId);
      } catch {
        // Best effort cleanup only.
      }
    }

    return {
      error: error instanceof Error ? error.message : "Unable to register student account.",
      success: "",
    };
  }

  // Attempt auto sign-in so the user lands on their dashboard directly.
  // redirect() must live outside the try/catch — Next.js throws NEXT_REDIRECT
  // internally and a surrounding catch would swallow it.
  let signedIn = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (!signInError) signedIn = true;
  } catch (e) {
    // cookies() is unavailable outside a Next.js request context (e.g. mvp_run.ts),
    // or a transient Supabase failure occurred. Fall back to manual login.
    console.error("Auto-sign-in after student registration failed:", e);
  }
  if (signedIn) redirect("/dashboard/student");
  return { error: "", success: "Account created. Sign in to get started." };
}

export async function registerProfessor(
  _previousState: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  const parsed = professorSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    mobilePhone: formData.get("mobilePhone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    schoolId: formData.get("schoolId"),
    title: formData.get("title"),
    selectedCourses: formData.get("selectedCourses"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration data.", success: "" };
  }

  let authUserId: string | null = null;

  try {
    const school = await getSchoolSnapshot(parsed.data.schoolId);
    const selectedCourseNames = normalizeCourseNames(parsed.data.selectedCourses);

    if (!selectedCourseNames.length) {
      return { error: "Enter at least one course.", success: "" };
    }

    const authUser = await createAuthUser({
      email: parsed.data.email,
      password: parsed.data.password,
      metadata: { role: "professor" },
    });
    authUserId = authUser.id;

    const admin = createSupabaseAdminClient();
    const { error: appUserError } = await admin.from("app_users").insert({
      user_id: authUser.id,
      primary_role: "professor",
    });

    if (appUserError) {
      throw new Error(appUserError.message);
    }

    const { data: profile, error: profileError } = await admin
      .from("professor_profiles")
      .insert({
        user_id: authUser.id,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        title: parsed.data.title || null,
        email: parsed.data.email,
        mobile_phone: parsed.data.mobilePhone,
        address_line_1: parsed.data.addressLine1,
        address_line_2: parsed.data.addressLine2 || null,
        city: parsed.data.city,
        state: parsed.data.state,
        postal_code: parsed.data.postalCode,
        country: parsed.data.country,
        university_id: school.id,
        university_name_snapshot: school.name,
        university_address_snapshot: {
          address_line_1: school.address_line_1,
          city: school.city,
          state: school.state,
          postal_code: school.postal_code,
          country: school.country,
        },
        approval_status: "pending",
        onboarding_status: "started",
      })
      .select("id, user_id, university_id, first_name, last_name, title, email, mobile_phone, address_line_1, address_line_2, city, state, postal_code, country, approval_status, onboarding_status")
      .single();

    if (profileError || !profile) {
      throw new Error(profileError?.message ?? "Unable to create professor profile.");
    }

    const courseRows = selectedCourseNames.map((courseName) => ({
      school_id: school.id,
      course_name: courseName,
      status: "active",
      created_by_user_id: authUser.id,
    }));

    const { data: insertedCourses, error: courseInsertError } = await admin
      .from("courses")
      .insert(courseRows)
      .select("id, course_name");

    if (courseInsertError || !insertedCourses) {
      throw new Error(courseInsertError?.message ?? "Unable to store selected courses.");
    }

    const professorCourseRows = insertedCourses.map((course) => ({
      professor_id: profile.id,
      course_id: course.id,
      custom_course_name: course.course_name,
      status: "active",
    }));

    const { error: professorCourseError } = await admin
      .from("professor_courses")
      .insert(professorCourseRows);

    if (professorCourseError) {
      throw new Error(professorCourseError.message);
    }

    await updateProfessorOnboardingStatus(profile.id);
    // Registration succeeded — fall through to auto sign-in
  } catch (error) {
    if (authUserId) {
      try {
        await deleteAuthUser(authUserId);
      } catch {
        // Best effort cleanup only.
      }
    }

    return {
      error: error instanceof Error ? error.message : "Unable to register professor account.",
      success: "",
    };
  }

  // Attempt auto sign-in so the user lands on their dashboard directly.
  // redirect() must live outside the try/catch — Next.js throws NEXT_REDIRECT
  // internally and a surrounding catch would swallow it.
  let signedIn = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (!signInError) signedIn = true;
  } catch (e) {
    // cookies() is unavailable outside a Next.js request context (e.g. mvp_run.ts),
    // or a transient Supabase failure occurred. Fall back to manual login.
    console.error("Auto-sign-in after professor registration failed:", e);
  }
  if (signedIn) redirect("/dashboard/professor");
  return { error: "", success: "Account created. Sign in to get started." };
}

export async function registerSchoolRequest(
  _previousState: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  const parsed = schoolRequestSchema.safeParse({
    schoolName: formData.get("schoolName"),
    addressLine1: formData.get("addressLine1"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    websiteUrl: formData.get("websiteUrl"),
    adminContactName: formData.get("adminContactName"),
    adminContactEmail: formData.get("adminContactEmail"),
    domains: formData.get("domains"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid school request data.", success: "" };
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("schools").insert({
      name: parsed.data.schoolName,
      normalized_name: normalizeSchoolName(parsed.data.schoolName),
      status: "pending_review",
      address_line_1: parsed.data.addressLine1,
      city: parsed.data.city,
      state: parsed.data.state,
      postal_code: parsed.data.postalCode,
      country: parsed.data.country,
      website_url: parsed.data.websiteUrl || null,
      admin_contact_name: parsed.data.adminContactName,
      admin_contact_email: parsed.data.adminContactEmail,
      domains: parsed.data.domains
        ? parsed.data.domains
            .split(",")
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean)
        : [],
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to submit school request.",
      success: "",
    };
  }

  return {
    error: "",
    success: "School request submitted. We'll review it and be in touch.",
  };
}
