"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProjectActionState } from "./project-types";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.ms-powerpoint", // ppt
  "video/mp4",
  "video/quicktime", // mov
]);

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

async function getCurrentProfessor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data: prof } = await admin
    .from("professor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return prof ?? null;
}

export async function uploadProject(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const file = formData.get("file") as File | null;

  if (!title) return { error: "Title is required.", success: "" };
  if (title.length > 200)
    return { error: "Title must be 200 characters or fewer.", success: "" };
  if (description && description.length > 2000)
    return { error: "Description must be 2000 characters or fewer.", success: "" };
  if (!file || file.size === 0) return { error: "Please select a file.", success: "" };
  if (file.size > MAX_FILE_SIZE) return { error: "File must be 50 MB or smaller.", success: "" };
  if (!ALLOWED_MIME_TYPES.has(file.type))
    return { error: `File type not allowed. Accepted: PDF, DOCX, DOC, ZIP, JPG, PNG, GIF, PPTX, PPT, MP4, MOV.`, success: "" };

  const professor = await getCurrentProfessor();
  if (!professor) return { error: "Not authenticated.", success: "" };

  const admin = createSupabaseAdminClient();
  const sanitized = sanitizeFilename(file.name);
  const storagePath = `${professor.id}/${Date.now()}-${sanitized}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: storageError } = await admin.storage
    .from("projects")
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (storageError)
    return { error: `Upload failed: ${storageError.message}`, success: "" };

  const { error: dbError } = await admin.from("projects").insert({
    professor_id: professor.id,
    title,
    description,
    original_filename: file.name,
    storage_path: storagePath,
    file_size_bytes: file.size,
    mime_type: file.type,
  });

  if (dbError) {
    // Roll back storage upload if DB insert fails
    await admin.storage.from("projects").remove([storagePath]);
    return { error: dbError.message, success: "" };
  }

  revalidatePath("/dashboard/professor", "page");
  return { error: "", success: "Project uploaded successfully." };
}

export async function deleteProject(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return { error: "Missing project ID.", success: "" };

  const professor = await getCurrentProfessor();
  if (!professor) return { error: "Not authenticated.", success: "" };

  const admin = createSupabaseAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, professor_id, storage_path")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return { error: "Project not found.", success: "" };
  if (project.professor_id !== professor.id) return { error: "Unauthorized.", success: "" };

  await admin.storage.from("projects").remove([project.storage_path]);
  await admin.from("projects").delete().eq("id", projectId);

  revalidatePath("/dashboard/professor", "page");
  return { error: "", success: "Project deleted." };
}
