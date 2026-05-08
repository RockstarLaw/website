"use client";

import { useActionState, useState } from "react";

import { HelpTooltip } from "@/components/help-tooltip";
import { AREAS_OF_LAW } from "@/lib/projects/areas-of-law";

import {
  addFileToProject,
  createProject,
  deleteFileFromProject,
  deleteProject,
} from "@/lib/projects/project-actions";
import {
  initialLibraryState,
  removeFromLibrary,
} from "@/lib/projects/library-actions";
import {
  AUDIENCE_TAG_LABELS,
  DURATION_OPTIONS,
  MODE_LABELS,
  initialDeleteProjectState,
  initialFileState,
  initialProjectState,
} from "@/lib/projects/project-types";
import type { ProfessorProject, ProjectFile } from "@/lib/supabase/queries";

// ─── Shared constants ─────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-700";

const ACCEPTED_FILES = ".pdf,.docx,.doc,.zip,.jpg,.jpeg,.png,.gif,.pptx,.ppt,.mp4,.mov";
const ACCEPTED_IMAGES = ".jpg,.jpeg,.png,.gif,.webp";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAvailableTags(modes: ProfessorProject["modes"]): string[] {
  const tags = ["general", "ta_only"];
  if (modes.versus)  { tags.push("side_a", "side_b"); }
  if (modes.team)    { tags.push("team_a", "team_b"); }
  if (modes.solo)    { tags.push("solo"); }
  return tags;
}

// ─── Sub-components (each needs its own hook calls) ───────────────────────────

function ModeChips({ modes }: { modes: ProfessorProject["modes"] }) {
  const active = (Object.keys(modes) as (keyof typeof modes)[]).filter((k) => modes[k]);
  if (!active.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map((k) => (
        <span key={k} className="rounded-full bg-red-700 px-2 py-0.5 text-xs font-medium text-white">
          {MODE_LABELS[k] ?? k}
        </span>
      ))}
    </div>
  );
}

function AreaChips({ areas }: { areas: string[] }) {
  if (!areas.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {areas.map((a) => (
        <span key={a} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {a}
        </span>
      ))}
    </div>
  );
}

function AudienceTagChip({ tag }: { tag: string }) {
  return (
    <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600">
      {AUDIENCE_TAG_LABELS[tag] ?? tag}
    </span>
  );
}

function DeleteFileForm({ file }: { file: ProjectFile }) {
  const [state, formAction, pending] = useActionState(deleteFileFromProject, initialFileState);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Delete "${file.label}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="fileId" value={file.id} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-700 hover:underline disabled:opacity-50"
      >
        {pending ? "…" : "Delete"}
      </button>
      {state.error && <span className="ml-1 text-xs text-red-700">{state.error}</span>}
    </form>
  );
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
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-red-700 hover:underline disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.error && <span className="ml-2 text-xs text-red-700">{state.error}</span>}
    </form>
  );
}

function RemoveFromLibraryForm({ project }: { project: ProfessorProject }) {
  const [state, formAction, pending] = useActionState(removeFromLibrary, initialLibraryState);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Remove "${project.title}" from your library? You can re-add it from the Project Shop anytime.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="projectId" value={project.id} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-red-700 hover:underline disabled:opacity-50"
      >
        {pending ? "Removing…" : "Remove from Library"}
      </button>
      {state.error && <span className="ml-2 text-xs text-red-700">{state.error}</span>}
    </form>
  );
}

function AddFileForm({ project }: { project: ProfessorProject }) {
  const [state, formAction, pending] = useActionState(addFileToProject, initialFileState);
  const availableTags = getAvailableTags(project.modes);

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-slate-200 pt-4">
      <input type="hidden" name="projectId" value={project.id} />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="flex items-center text-xs font-medium text-slate-700">
            Label <span className="text-red-700 ml-0.5">*</span>
            <HelpTooltip text="The name students will see for this file. Examples: General Rules, Plaintiff's Confidential Brief, Auction Catalog Exhibit A." />
          </span>
          <input type="text" name="label" required placeholder="e.g. General Rules" className={inputCls} />
        </label>

        <label className="grid gap-1.5">
          <span className="flex items-center text-xs font-medium text-slate-700">
            Audience <span className="text-red-700 ml-0.5">*</span>
            <HelpTooltip text="Who receives this file when the project is deployed. The dropdown only shows tags that match your project's mode flags. general means everyone; side_a/side_b are for Versus projects; team_a/team_b for Team; solo for Solo; ta_only is TA-facing setup material students never see." />
          </span>
          <select name="audienceTag" required className={inputCls} defaultValue="">
            <option value="" disabled>Select audience</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>{AUDIENCE_TAG_LABELS[tag] ?? tag}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-slate-700">
          File <span className="text-red-700">*</span>
        </span>
        <input
          type="file"
          name="file"
          required
          accept={ACCEPTED_FILES}
          className="text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-red-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-red-800"
        />
      </label>

      {state.error   && <p className="text-xs text-red-700">{state.error}</p>}
      {state.success && <p className="text-xs text-green-700">{state.success}</p>}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Add file"}
        </button>
      </div>
    </form>
  );
}

function ProjectRow({
  project,
  isOpen,
  onToggle,
}: {
  project: ProfessorProject;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-200 pb-5">
      {/* Collapsed header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-slate-950">{project.title}</p>
          <p className="text-sm italic text-slate-600">{project.tagline}</p>
          <ModeChips modes={project.modes} />
          <AreaChips areas={project.areaOfLaw} />
          <p className="text-xs text-slate-400">
            {project.files.length} file{project.files.length !== 1 ? "s" : ""} ·{" "}
            {project.duration} ·{" "}
            {new Date(project.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:border-red-700 hover:text-slate-950"
          >
            {isOpen ? "Collapse ▴" : "Manage Files ▾"}
          </button>
          <DeleteProjectForm project={project} />
        </div>
      </div>

      {/* Expanded panel */}
      {isOpen && (
        <div className="mt-4 flex flex-col gap-4">
          {project.files.length > 0 ? (
            <ul className="grid gap-2">
              {project.files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <AudienceTagChip tag={f.audienceTag} />
                    <span className="text-sm font-medium text-slate-900">{f.label}</span>
                    <span className="text-xs text-slate-400">
                      {f.originalFilename} · {formatBytes(f.fileSizeBytes)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {f.downloadUrl && (
                      <a
                        href={f.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-red-700 hover:underline"
                      >
                        Download
                      </a>
                    )}
                    <DeleteFileForm file={f} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No files yet — add one below.</p>
          )}
          <AddFileForm project={project} />
        </div>
      )}
    </div>
  );
}

// ─── Library project row (from Project Shop, read-only file access) ─────────

function LibraryProjectRow({
  project,
  isOpen,
  onToggle,
}: {
  project: ProfessorProject;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-200 pb-5">
      {/* Collapsed header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-slate-950">{project.title}</p>
          <p className="text-sm italic text-slate-600">{project.tagline}</p>
          <ModeChips modes={project.modes} />
          <AreaChips areas={project.areaOfLaw} />
          <p className="text-xs text-slate-400">
            {project.files.length} file{project.files.length !== 1 ? "s" : ""} ·{" "}
            {project.duration} ·{" "}
            Added{" "}
            {new Date(project.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:border-red-700 hover:text-slate-950"
          >
            {isOpen ? "Collapse ▴" : "View Files ▾"}
          </button>
          <RemoveFromLibraryForm project={project} />
        </div>
      </div>

      {/* Expanded panel — file list, no add/delete (it's not yours) */}
      {isOpen && (
        <div className="mt-4 flex flex-col gap-4">
          {project.files.length > 0 ? (
            <ul className="grid gap-2">
              {project.files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <AudienceTagChip tag={f.audienceTag} />
                    <span className="text-sm font-medium text-slate-900">{f.label}</span>
                    <span className="text-xs text-slate-400">
                      {f.originalFilename} · {formatBytes(f.fileSizeBytes)}
                    </span>
                  </div>
                  {f.downloadUrl && (
                    <a
                      href={f.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-700 hover:underline"
                    >
                      Download
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No files attached to this project.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function ProfessorProjectsWidget({
  projects,
  libraryProjects = [],
}: {
  projects: ProfessorProject[];
  libraryProjects?: ProfessorProject[];
}) {
  // openPanels: user explicitly opened. closedPanels: user explicitly closed.
  // Newly-created project (createState.projectId) is auto-open unless in closedPanels.
  const [openPanels, setOpenPanels]   = useState<Set<string>>(new Set());
  const [closedPanels, setClosedPanels] = useState<Set<string>>(new Set());
  const [openLibPanels, setOpenLibPanels] = useState<Set<string>>(new Set());
  const [createState, createAction, createPending] = useActionState(
    createProject,
    initialProjectState,
  );

  function isOpen(id: string): boolean {
    if (closedPanels.has(id)) return false;
    return id === createState.projectId || openPanels.has(id);
  }

  function togglePanel(id: string) {
    if (isOpen(id)) {
      setClosedPanels((prev) => new Set([...prev, id]));
      setOpenPanels((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      setClosedPanels((prev) => { const n = new Set(prev); n.delete(id); return n; });
      setOpenPanels((prev) => new Set([...prev, id]));
    }
  }

  function isLibOpen(id: string): boolean {
    return openLibPanels.has(id);
  }

  function toggleLibPanel(id: string) {
    setOpenLibPanels((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── MY PROJECTS heading ── */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">MY PROJECTS</h2>
        <div className="mt-1 h-0.5 w-12 bg-red-700" />
      </div>

      {/* ── Authored projects ── */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Authored by you
        </h3>
        {projects.length > 0 ? (
          <div className="flex flex-col gap-0">
            {projects.map((p) => (
              <ProjectRow
                key={p.id}
                project={p}
                isOpen={isOpen(p.id)}
                onToggle={() => togglePanel(p.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No projects yet. Create your first below.</p>
        )}
      </div>

      {/* ── Your Library (downloaded from Project Shop) ── */}
      {libraryProjects.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your Library
          </h3>
          <p className="text-xs text-slate-500">
            Projects you&apos;ve added from the{" "}
            <a href="/project-shop" className="font-medium text-red-700 hover:underline">
              Project Shop
            </a>
            . You can launch these for your courses just like authored projects.
          </p>
          <div className="flex flex-col gap-0">
            {libraryProjects.map((p) => (
              <LibraryProjectRow
                key={p.id}
                project={p}
                isOpen={isLibOpen(p.id)}
                onToggle={() => toggleLibPanel(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Create Project form ── */}
      <div className="border-t border-slate-200 pt-6">
        <p className="mb-4 text-sm font-semibold text-slate-700">Create a project</p>
        <form action={createAction} className="flex flex-col gap-4" encType="multipart/form-data">

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="flex items-center text-sm font-medium text-slate-700">
                Title <span className="text-red-700 ml-0.5">*</span>
                <HelpTooltip text="The official name of your project as it appears in the Project Shop and on student dashboards. Be specific and memorable." />
              </span>
              <input type="text" name="title" required maxLength={200} placeholder="That's Eat-tertainment: The Frank & Dino's Theme Restaurant Problem" className={inputCls} />
            </label>
            <label className="grid gap-2">
              <span className="flex items-center text-sm font-medium text-slate-700">
                Tagline <span className="text-red-700 ml-0.5">*</span>
                <HelpTooltip text="A short hook (a few words to one short sentence) that captures the project's energy. Think movie poster tagline." />
              </span>
              <input type="text" name="tagline" required placeholder="Short hook line" className={inputCls} />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="flex items-center text-sm font-medium text-slate-700">
              Pitch <span className="text-red-700 ml-0.5">*</span>
              <HelpTooltip text="The longer marketing description that sells the project to faculty browsing the catalog. Explain what students will do, what they'll learn, what makes the project memorable." />
            </span>
            <textarea name="pitch" required maxLength={2000} rows={4} placeholder="Full description for the catalog" className={inputCls} />
          </label>

          {/* Mode flags */}
          <div className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Mode flags</span>
            <div className="flex flex-wrap gap-4">
              {[
                { key: "versus",        tooltip: "Students compete head-to-head, paired against each other. Each takes one side of an adversarial scenario. Used for negotiations, debates, oral argument competitions." },
                { key: "drafting",      tooltip: "Students produce a written work product. A memo, motion, brief, contract, or other formal legal document. The deliverable is the writing itself." },
                { key: "oral_argument", tooltip: "Students present, debate, or argue verbally. Includes negotiations, moot courts, depositions, and live in-class debates." },
                { key: "solo",          tooltip: "Each student works individually. Their work and grade reflect only their own effort." },
                { key: "team",          tooltip: "Students work in groups with shared deliverables and shared accountability." },
                { key: "creativity",    tooltip: "This project rewards creative or lateral thinking — finding win-win solutions, reframing problems, recognizing collaborative possibilities, creating value where there seems to be none. Some professors prefer traditional 'Adversarial' training; others develop integrative-bargaining instincts. This flag tells faculty if creative thinking has potential to play a significant role." },
              ].map(({ key, tooltip }) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" name={key} value="true" className="h-4 w-4 accent-red-700" />
                  <span className="text-sm text-slate-700">{MODE_LABELS[key as keyof typeof MODE_LABELS] ?? key}</span>
                  <HelpTooltip text={tooltip} />
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="flex items-center text-sm font-medium text-slate-700">
                Duration <span className="text-red-700 ml-0.5">*</span>
                <HelpTooltip text="How long the project takes from assignment to completion. 1 Hour fits a single class period; Semester is a full-term running matter." />
              </span>
              <select name="duration" required className={inputCls} defaultValue="">
                <option value="" disabled>Select</option>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer pt-7">
              <input type="checkbox" name="real_world" value="true" className="h-4 w-4 accent-red-700" />
              <span className="text-sm text-slate-700">Real World</span>
              <HelpTooltip text="Check if this project is based on or adapted from a real legal matter the author worked on, was involved in, or is drawing from public record. Real World projects should play like an 'Augmented Reality' game, where techniques like Googling or industry knowledge have potential to give initiated students an advantage." />
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer pt-7">
              <input type="checkbox" name="world_rank_qualifying" value="true" className="h-4 w-4 accent-red-700" />
              <span className="text-sm text-slate-700">World Rank Qualifying</span>
              <HelpTooltip text="Check if this project produces a deliverable that can be objectively scored and compared against every other student submission ever made for this project. WRQ projects feed the global leaderboard. Appropriate for projects with structured written deliverables; not appropriate for live negotiations or projects without comparable outputs." />
            </label>
          </div>

          {/* Area of Law */}
          <div className="grid gap-2">
            <span className="flex items-center text-sm font-medium text-slate-700">
              Area of Law
              <HelpTooltip text="The legal subject matter this project teaches. Multi-select — most projects span multiple areas. Faculty filter the catalog by area to find projects relevant to their courses." />
            </span>
            <div className="grid grid-flow-col grid-rows-13 grid-cols-3 gap-x-6 gap-y-2">
              {AREAS_OF_LAW.map((area) => (
                <label key={area} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="area_of_law" value={area} className="h-4 w-4 accent-red-700" />
                  <span className="text-xs text-slate-700">{area}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Catalog images */}
          <div className="grid gap-3">
            <span className="flex items-center text-sm font-medium text-slate-700">
              Catalog Images
              <HelpTooltip text="At least one image is required. Without catalog images, your project cannot appear in the Project Shop. Up to three total — the first is the hero. Use visuals that capture the project's tone: illustration, photography, character art, screenshots." />
            </span>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-1.5">
                <span className="flex items-center text-xs font-medium text-slate-700">
                  Image 1 <span className="text-red-700 ml-0.5">*</span>
                </span>
                <input
                  type="file"
                  name="image_1"
                  accept={ACCEPTED_IMAGES}
                  required
                  className="text-xs text-slate-600 file:mr-2 file:rounded-full file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:text-slate-700 hover:file:bg-slate-200"
                />
              </label>
              {[2, 3].map((n) => (
                <label key={n} className="grid gap-1.5">
                  <span className="text-xs text-slate-500">Image {n}</span>
                  <input
                    type="file"
                    name={`image_${n}`}
                    accept={ACCEPTED_IMAGES}
                    className="text-xs text-slate-600 file:mr-2 file:rounded-full file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:text-slate-700 hover:file:bg-slate-200"
                  />
                </label>
              ))}
            </div>
          </div>

          {createState.error   && <p className="text-sm text-red-700">{createState.error}</p>}
          {createState.success && <p className="text-sm text-green-700">{createState.success}</p>}

          <div>
            <button
              type="submit"
              disabled={createPending}
              className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
            >
              {createPending ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
