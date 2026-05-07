/**
 * STUB — Phase 3 placeholder to satisfy TypeScript while Phase 4 rewrites this
 * component with the full two-step UX (create project + file management panel).
 */
"use client";

import { useActionState } from "react";

import { createProject, deleteProject } from "@/lib/projects/project-actions";
import { initialProjectState, initialDeleteProjectState } from "@/lib/projects/project-types";
import type { ProfessorProject } from "@/lib/supabase/queries";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DeleteProjectForm({ project }: { project: ProfessorProject }) {
  const [state, formAction, pending] = useActionState(deleteProject, initialDeleteProjectState);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="projectId" value={project.id} />
      <button type="submit" disabled={pending} className="text-sm text-red-700 hover:underline disabled:opacity-50">
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.error && <span className="ml-2 text-xs text-red-700">{state.error}</span>}
    </form>
  );
}

export function ProfessorProjectsWidget({ projects }: { projects: ProfessorProject[] }) {
  const [createState, createAction, createPending] = useActionState(
    createProject,
    initialProjectState,
  );

  return (
    <div className="flex flex-col gap-6" id="my-projects-widget">

      {/* Project list — Phase 4 will add file management panels */}
      {projects.length > 0 ? (
        <ul className="grid gap-4">
          {projects.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex flex-col gap-0.5">
                <p className="font-medium text-slate-950">{p.title}</p>
                <p className="text-sm italic text-slate-500">{p.tagline}</p>
                <p className="text-xs text-slate-400">
                  {p.files.length} file{p.files.length !== 1 ? "s" : ""} ·{" "}
                  {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                {p.files.map((f) => (
                  <p key={f.id} className="text-xs text-slate-400">
                    → {f.label} ({f.audienceTag}) ·{" "}
                    {formatBytes(f.fileSizeBytes)} ·{" "}
                    {f.downloadUrl && (
                      <a href={f.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline">
                        Download
                      </a>
                    )}
                  </p>
                ))}
              </div>
              <DeleteProjectForm project={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No projects yet.</p>
      )}

      {/* Minimal create form — Phase 4 will expand to full two-step UX */}
      <form id="upload-project-form" action={createAction} className="flex flex-col gap-4 border-t border-slate-200 pt-4">
        <p className="text-sm font-medium text-slate-700">Create a project (stub — Phase 4 adds full form)</p>
        <input type="text" name="title" required placeholder="Title" className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-red-700" />
        <input type="text" name="tagline" required placeholder="Tagline" className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-red-700" />
        <textarea name="pitch" required placeholder="Pitch" rows={3} className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-red-700" />
        <input type="hidden" name="duration" value="1hr" />
        {createState.error && <p className="text-sm text-red-700">{createState.error}</p>}
        {createState.success && <p className="text-sm text-green-700">{createState.success}</p>}
        <button type="submit" disabled={createPending} className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
          {createPending ? "Creating…" : "Create project"}
        </button>
      </form>

    </div>
  );
}
