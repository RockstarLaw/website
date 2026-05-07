"use client";

import { useActionState } from "react";

import {
  deleteProject,
  uploadProject,
} from "@/lib/projects/project-actions";
import { initialProjectState } from "@/lib/projects/project-types";
import type { ProfessorProject } from "@/lib/supabase/queries";

const ACCEPTED_FILE_TYPES = [
  ".pdf", ".docx", ".doc", ".zip",
  ".jpg", ".jpeg", ".png", ".gif",
  ".pptx", ".ppt", ".mp4", ".mov",
].join(",");

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-700";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DeleteProjectForm({ project }: { project: ProfessorProject }) {
  const [state, formAction, pending] = useActionState(deleteProject, initialProjectState);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="projectId" value={project.id} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-red-700 hover:underline disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.error && (
        <span className="ml-2 text-xs text-red-700">{state.error}</span>
      )}
    </form>
  );
}

export function ProfessorProjectsWidget({
  projects,
}: {
  projects: ProfessorProject[];
}) {
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadProject,
    initialProjectState,
  );

  return (
    <div className="flex flex-col gap-6" id="my-projects-widget">

      {/* Project list */}
      {projects.length > 0 ? (
        <ul className="grid gap-4">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4"
            >
              <div className="flex flex-col gap-0.5">
                <p className="font-medium text-slate-950">{p.title}</p>
                <p className="text-sm text-slate-500">{p.originalFilename}</p>
                <p className="text-xs text-slate-400">
                  {formatBytes(p.fileSizeBytes)} · {formatDate(p.uploadedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                {p.downloadUrl ? (
                  <a
                    href={p.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-red-700 hover:underline"
                  >
                    Download
                  </a>
                ) : null}
                <DeleteProjectForm project={p} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">
          No projects uploaded yet.
        </p>
      )}

      {/* Upload form */}
      <form
        id="upload-project-form"
        action={uploadAction}
        className="flex flex-col gap-4 pt-4 border-t border-slate-200"
        encType="multipart/form-data"
      >
        <p className="text-sm font-medium text-slate-700">Upload a project</p>

        <label className="grid gap-2">
          <span className="text-sm text-slate-700">Title <span className="text-red-700">*</span></span>
          <input
            type="text"
            name="title"
            required
            maxLength={200}
            placeholder="e.g. Nike v. Kool Kiy"
            className={inputClassName}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-700">Description</span>
          <textarea
            name="description"
            maxLength={2000}
            rows={3}
            placeholder="Optional notes about this project"
            className={inputClassName}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-700">File <span className="text-red-700">*</span></span>
          <input
            type="file"
            name="file"
            required
            accept={ACCEPTED_FILE_TYPES}
            className="text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-red-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-red-800"
          />
          <span className="text-xs text-slate-400">
            PDF, DOCX, DOC, ZIP, JPG, PNG, GIF, PPTX, PPT, MP4, MOV — max 50 MB
          </span>
        </label>

        {uploadState.error && (
          <p className="text-sm text-red-700">{uploadState.error}</p>
        )}
        {uploadState.success && (
          <p className="text-sm text-green-700">{uploadState.success}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={uploadPending}
            className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
          >
            {uploadPending ? "Uploading…" : "Upload project"}
          </button>
        </div>
      </form>
    </div>
  );
}
