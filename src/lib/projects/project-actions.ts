"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VALID_DURATIONS } from "./project-types";
import type { DeleteProjectState, FileActionState, ProjectActionState } from "./project-types";

const MAX_FILE_SIZE   = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_SIZE  = 10 * 1024 * 1024; // 10 MB for catalog images

const ALLOWED_FILE_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "video/mp4",
  "video/quicktime",
]);

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
]);

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

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

async function uploadCatalogImage(
  file: File | null,
  projectId: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED_IMAGE_MIMES.has(file.type)) return null;
  if (file.size > MAX_IMAGE_SIZE) return null;
  const admin = createSupabaseAdminClient();
  const path = `${projectId}/catalog/${Date.now()}-${sanitize(file.name)}`;
  const { error } = await admin.storage
    .from("projects")
    .upload(path, await file.arrayBuffer(), { contentType: file.type });
  return error ? null : path;
}

// ─── createProject ────────────────────────────────────────────────────────────

export async function createProject(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  try {
    const professor = await getCurrentProfessor();
    if (!professor) return { error: "Not authenticated.", success: "" };

    const title    = String(formData.get("title")    ?? "").trim();
    const tagline  = String(formData.get("tagline")  ?? "").trim();
    const pitch    = String(formData.get("pitch")    ?? "").trim();
    const duration = String(formData.get("duration") ?? "").trim();

    if (!title)   return { error: "Title is required.", success: "" };
    if (!tagline) return { error: "Tagline is required.", success: "" };
    if (!pitch)   return { error: "Pitch is required.", success: "" };
    if (!VALID_DURATIONS.includes(duration as typeof VALID_DURATIONS[number])) {
      return { error: "Select a valid duration.", success: "" };
    }

    const versus         = formData.get("versus")         === "true";
    const drafting       = formData.get("drafting")       === "true";
    const oral_argument  = formData.get("oral_argument")  === "true";
    const solo           = formData.get("solo")           === "true";
    const team           = formData.get("team")           === "true";
    const creativity     = formData.get("creativity")     === "true";
    const real_world     = formData.get("real_world")     === "true";
    const world_rank_qualifying = formData.get("world_rank_qualifying") === "true";

    // Generate project ID before storage uploads so paths can use it
    const projectId = crypto.randomUUID();
    const admin = createSupabaseAdminClient();

    const [image1Path, image2Path, image3Path] = await Promise.all([
      uploadCatalogImage(formData.get("image_1") as File | null, projectId),
      uploadCatalogImage(formData.get("image_2") as File | null, projectId),
      uploadCatalogImage(formData.get("image_3") as File | null, projectId),
    ]);

    const { error: dbError } = await admin.from("projects").insert({
      id: projectId,
      professor_id: professor.id,
      title, tagline, pitch,
      versus, drafting, oral_argument, solo, team, creativity,
      duration, real_world, world_rank_qualifying,
      image_1_path: image1Path,
      image_2_path: image2Path,
      image_3_path: image3Path,
    });

    if (dbError) {
      const paths = [image1Path, image2Path, image3Path].filter(Boolean) as string[];
      if (paths.length) await admin.storage.from("projects").remove(paths);
      return { error: "Failed to create project. Please try again.", success: "" };
    }

    revalidatePath("/dashboard/professor", "page");
    return { error: "", success: "Project created.", projectId };
  } catch {
    return { error: "An unexpected error occurred. Please try again.", success: "" };
  }
}

// ─── addFileToProject ─────────────────────────────────────────────────────────

export async function addFileToProject(
  _prev: FileActionState,
  formData: FormData,
): Promise<FileActionState> {
  try {
    const professor = await getCurrentProfessor();
    if (!professor) return { error: "Not authenticated.", success: "" };

    const projectId  = String(formData.get("projectId")  ?? "").trim();
    const label      = String(formData.get("label")      ?? "").trim();
    const audienceTag = String(formData.get("audienceTag") ?? "").trim();
    const file = formData.get("file") as File | null;

    if (!projectId)  return { error: "Missing project ID.", success: "" };
    if (!label)      return { error: "Label is required.", success: "" };
    if (!file || file.size === 0) return { error: "Please select a file.", success: "" };

    const admin = createSupabaseAdminClient();
    const { data: project } = await admin
      .from("projects")
      .select("id, professor_id, versus, team, solo")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) return { error: "Project not found.", success: "" };
    if (project.professor_id !== professor.id) return { error: "Unauthorized.", success: "" };

    // Validate audience tag against mode flags
    const validTags = new Set<string>(["general", "ta_only"]);
    if (project.versus) { validTags.add("side_a"); validTags.add("side_b"); }
    if (project.team)   { validTags.add("team_a"); validTags.add("team_b"); }
    if (project.solo)   { validTags.add("solo"); }

    if (!validTags.has(audienceTag)) {
      return {
        error: `Tag "${audienceTag}" is not valid for this project's mode flags.`,
        success: "",
      };
    }

    if (file.size > MAX_FILE_SIZE) return { error: "File must be 50 MB or smaller.", success: "" };
    if (!ALLOWED_FILE_MIMES.has(file.type)) {
      return { error: "File type not allowed. Accepted: PDF, DOCX, DOC, ZIP, JPG, PNG, GIF, PPTX, PPT, MP4, MOV.", success: "" };
    }

    const storagePath = `${projectId}/${Date.now()}-${sanitize(file.name)}`;
    const { error: storageError } = await admin.storage
      .from("projects")
      .upload(storagePath, await file.arrayBuffer(), { contentType: file.type });

    if (storageError) return { error: "Upload failed. Please try again.", success: "" };

    const { error: dbError } = await admin.from("project_files").insert({
      project_id: projectId,
      label,
      audience_tag: audienceTag,
      original_filename: file.name,
      storage_path: storagePath,
      file_size_bytes: file.size,
      mime_type: file.type,
    });

    if (dbError) {
      await admin.storage.from("projects").remove([storagePath]);
      return { error: "Failed to save file. Please try again.", success: "" };
    }

    revalidatePath("/dashboard/professor", "page");
    return { error: "", success: "File added." };
  } catch {
    return { error: "An unexpected error occurred. Please try again.", success: "" };
  }
}

// ─── deleteFileFromProject ────────────────────────────────────────────────────

export async function deleteFileFromProject(
  _prev: FileActionState,
  formData: FormData,
): Promise<FileActionState> {
  try {
    const professor = await getCurrentProfessor();
    if (!professor) return { error: "Not authenticated.", success: "" };

    const fileId = String(formData.get("fileId") ?? "").trim();
    if (!fileId) return { error: "Missing file ID.", success: "" };

    const admin = createSupabaseAdminClient();
    const { data: fileRow } = await admin
      .from("project_files")
      .select("id, storage_path, projects(professor_id)")
      .eq("id", fileId)
      .maybeSingle();

    if (!fileRow) return { error: "File not found.", success: "" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectsData = (Array.isArray(fileRow.projects) ? fileRow.projects[0] : fileRow.projects) as any;
    if (projectsData?.professor_id !== professor.id) return { error: "Unauthorized.", success: "" };

    await admin.storage.from("projects").remove([fileRow.storage_path]);
    await admin.from("project_files").delete().eq("id", fileId);

    revalidatePath("/dashboard/professor", "page");
    return { error: "", success: "File deleted." };
  } catch {
    return { error: "An unexpected error occurred. Please try again.", success: "" };
  }
}

// ─── deleteProject ────────────────────────────────────────────────────────────

export async function deleteProject(
  _prev: DeleteProjectState,
  formData: FormData,
): Promise<DeleteProjectState> {
  try {
    const professor = await getCurrentProfessor();
    if (!professor) return { error: "Not authenticated.", success: "" };

    const projectId = String(formData.get("projectId") ?? "").trim();
    if (!projectId) return { error: "Missing project ID.", success: "" };

    const admin = createSupabaseAdminClient();
    const { data: project } = await admin
      .from("projects")
      .select("id, professor_id, image_1_path, image_2_path, image_3_path")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) return { error: "Project not found.", success: "" };
    if (project.professor_id !== professor.id) return { error: "Unauthorized.", success: "" };

    const { data: files } = await admin
      .from("project_files")
      .select("storage_path")
      .eq("project_id", projectId);

    const storagePaths = [
      ...(files ?? []).map((f) => f.storage_path),
      project.image_1_path,
      project.image_2_path,
      project.image_3_path,
    ].filter(Boolean) as string[];

    if (storagePaths.length) {
      await admin.storage.from("projects").remove(storagePaths);
    }

    // Cascade deletes project_files via FK
    await admin.from("projects").delete().eq("id", projectId);

    revalidatePath("/dashboard/professor", "page");
    return { error: "", success: "Project deleted." };
  } catch {
    return { error: "An unexpected error occurred. Please try again.", success: "" };
  }
}
