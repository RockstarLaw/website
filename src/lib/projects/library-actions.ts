"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LibraryActionState = { error: string; success: string };
export const initialLibraryState: LibraryActionState = { error: "", success: "" };

async function getCurrentProfessor() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("professor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ?? null;
}

// ─── addToLibrary ─────────────────────────────────────────────────────────────
//
// Idempotent. If the professor already has an active entry for this project,
// returns success without incrementing usage_count again. If they had a row
// previously archived/removed and re-add it, the row is restored to active
// without bumping usage_count (same project, same library-holder = one count).
//
// Cannot be called by the project's own author (they already have it via
// public.projects). The detail page UI hides the button for self-author cases,
// but we re-validate here as a defensive guard.

export async function addToLibrary(
  _prev: LibraryActionState,
  formData: FormData,
): Promise<LibraryActionState> {
  try {
    const professor = await getCurrentProfessor();
    if (!professor) return { error: "Not authenticated.", success: "" };

    const projectId = String(formData.get("projectId") ?? "").trim();
    if (!projectId) return { error: "Missing project ID.", success: "" };

    const admin = createSupabaseAdminClient();

    // Block self-author
    const { data: project, error: projErr } = await admin
      .from("projects")
      .select("id, professor_id, usage_count")
      .eq("id", projectId)
      .maybeSingle();
    if (projErr) return { error: "Project not found.", success: "" };
    if (!project) return { error: "Project not found.", success: "" };
    if (project.professor_id === professor.id) {
      return { error: "You authored this project — it's already in MY PROJECTS.", success: "" };
    }

    // Check if entry already exists (any status)
    const { data: existing } = await admin
      .from("professor_project_library")
      .select("status")
      .eq("professor_id", professor.id)
      .eq("project_id", projectId)
      .maybeSingle();

    if (existing) {
      // Already in library
      if (existing.status === "active") {
        return { error: "", success: "Already in your library." };
      }
      // Reactivate archived entry — no usage_count bump (same library-holder)
      const { error: reactivateErr } = await admin
        .from("professor_project_library")
        .update({ status: "active" })
        .eq("professor_id", professor.id)
        .eq("project_id", projectId);
      if (reactivateErr) return { error: "Failed to restore from library.", success: "" };
      revalidatePath("/dashboard/professor", "page");
      return { error: "", success: "Restored to your library." };
    }

    // First-time add — insert + increment usage_count atomically
    const { error: insertErr } = await admin
      .from("professor_project_library")
      .insert({
        professor_id: professor.id,
        project_id:   projectId,
      });
    if (insertErr) return { error: "Failed to add to library.", success: "" };

    // Bump usage_count (separate write — RLS doesn't block author-bypass via admin client)
    await admin
      .from("projects")
      .update({ usage_count: (project.usage_count ?? 0) + 1 })
      .eq("id", projectId);

    revalidatePath("/dashboard/professor", "page");
    return { error: "", success: "Added to MY PROJECTS." };
  } catch {
    return { error: "An unexpected error occurred. Please try again.", success: "" };
  }
}

// ─── removeFromLibrary ────────────────────────────────────────────────────────
//
// Sets status='archived' rather than deleting. Preserves history. usage_count
// stays where it is (a removal doesn't decrement).

export async function removeFromLibrary(
  _prev: LibraryActionState,
  formData: FormData,
): Promise<LibraryActionState> {
  try {
    const professor = await getCurrentProfessor();
    if (!professor) return { error: "Not authenticated.", success: "" };

    const projectId = String(formData.get("projectId") ?? "").trim();
    if (!projectId) return { error: "Missing project ID.", success: "" };

    const admin = createSupabaseAdminClient();

    const { error } = await admin
      .from("professor_project_library")
      .update({ status: "archived" })
      .eq("professor_id", professor.id)
      .eq("project_id", projectId);
    if (error) return { error: "Failed to remove from library.", success: "" };

    revalidatePath("/dashboard/professor", "page");
    return { error: "", success: "Removed from MY PROJECTS." };
  } catch {
    return { error: "An unexpected error occurred. Please try again.", success: "" };
  }
}
