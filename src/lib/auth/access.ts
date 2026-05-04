import type { AppRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccessContext = {
  userId: string;
  role: AppRole | null;
};

async function getRoleForUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("app_users")
    .select("primary_role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.primary_role as AppRole | undefined) ?? null;
}

export async function getAccessContext(override?: AccessContext | null): Promise<AccessContext | null> {
  if (override) {
    return override;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    role: await getRoleForUser(user.id),
  };
}

export async function requireAccessContext(override?: AccessContext | null): Promise<AccessContext> {
  const context = await getAccessContext(override);

  if (!context) {
    throw new Error("Unauthorized.");
  }

  return context;
}

export async function requireAdminAccess(override?: AccessContext | null): Promise<AccessContext> {
  const context = await requireAccessContext(override);

  if (context.role !== "admin" && context.role !== "school_admin") {
    throw new Error("Unauthorized.");
  }

  return context;
}

export async function requireProfessorAccess(override?: AccessContext | null) {
  const context = await requireAccessContext(override);

  if (context.role !== "professor") {
    throw new Error("Unauthorized.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("professor_profiles")
    .select("id, university_id")
    .eq("user_id", context.userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Unauthorized.");
  }

  return {
    ...context,
    professorId: data.id,
    universityId: data.university_id,
  };
}

export async function assertStudentAccess(requestedUserId: string, override?: AccessContext | null) {
  const context = await requireAccessContext(override);

  if (
    context.userId !== requestedUserId &&
    context.role !== "admin" &&
    context.role !== "school_admin"
  ) {
    throw new Error("Unauthorized.");
  }

  return context;
}
