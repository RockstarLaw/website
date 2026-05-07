"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfessorPhotoActionState } from "@/lib/projects/project-types";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_PHOTO_MIMES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

async function getCurrentProfessorWithPhoto() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("professor_profiles")
    .select("id, photo_path")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ?? null;
}

export async function uploadProfessorPhoto(
  _prev: ProfessorPhotoActionState,
  formData: FormData,
): Promise<ProfessorPhotoActionState> {
  try {
    const professor = await getCurrentProfessorWithPhoto();
    if (!professor) return { error: "Not authenticated.", success: "" };

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { error: "Please select a photo.", success: "" };
    if (!ALLOWED_PHOTO_MIMES.has(file.type))
      return { error: "Photo must be JPG, PNG, GIF, or WebP.", success: "" };
    if (file.size > MAX_PHOTO_SIZE) return { error: "Photo must be 5 MB or smaller.", success: "" };

    const admin = createSupabaseAdminClient();
    const storagePath = `${professor.id}/${Date.now()}-${sanitize(file.name)}`;

    // Remove old photo first
    if (professor.photo_path) {
      await admin.storage.from("professor-photos").remove([professor.photo_path]);
    }

    const { error: uploadError } = await admin.storage
      .from("professor-photos")
      .upload(storagePath, await file.arrayBuffer(), { contentType: file.type });

    if (uploadError) return { error: "Upload failed. Please try again.", success: "" };

    const { error: dbError } = await admin
      .from("professor_profiles")
      .update({ photo_path: storagePath })
      .eq("id", professor.id);

    if (dbError) {
      await admin.storage.from("professor-photos").remove([storagePath]);
      return { error: "Failed to save photo. Please try again.", success: "" };
    }

    revalidatePath("/dashboard/professor", "page");
    return { error: "", success: "Photo updated." };
  } catch {
    return { error: "An unexpected error occurred. Please try again.", success: "" };
  }
}

export async function deleteProfessorPhoto(
  _prev: ProfessorPhotoActionState, // eslint-disable-line @typescript-eslint/no-unused-vars
  formData: FormData, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<ProfessorPhotoActionState> {
  try {
    const professor = await getCurrentProfessorWithPhoto();
    if (!professor) return { error: "Not authenticated.", success: "" };

    const admin = createSupabaseAdminClient();

    if (professor.photo_path) {
      await admin.storage.from("professor-photos").remove([professor.photo_path]);
    }

    await admin
      .from("professor_profiles")
      .update({ photo_path: null })
      .eq("id", professor.id);

    revalidatePath("/dashboard/professor", "page");
    return { error: "", success: "Photo removed." };
  } catch {
    return { error: "An unexpected error occurred. Please try again.", success: "" };
  }
}
