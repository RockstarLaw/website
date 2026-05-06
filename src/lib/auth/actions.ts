"use server";

import { redirect } from "next/navigation";

import { getDashboardRouteForRole } from "@/lib/auth/roles";
import { getCurrentAppUserRole } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithEmailPassword(
  _previousState: { error: string },
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const role = await getCurrentAppUserRole();

  if (!role) {
    return { error: "Your account was authenticated, but no app role is assigned yet." };
  }

  redirect(getDashboardRouteForRole(role));
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
