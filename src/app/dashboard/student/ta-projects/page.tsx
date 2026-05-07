import { redirect } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AUDIENCE_TAG_LABELS } from "@/lib/projects/project-types";
import { getProjectsForTAUser } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function TaProjectsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const groups = await getProjectsForTAUser(user.id);

  return (
    <SiteShell title="TA Projects" description="" hideIntro>
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-12">

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            TA Projects
          </h1>
          <div className="mt-2 h-0.5 w-12 bg-red-700" />
          <p className="mt-3 text-sm text-slate-500">
            Projects uploaded by professors you TA for. Read-only — 24-hour download links.
          </p>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-slate-500">
            You don&apos;t have access to any projects yet. You&apos;re either not currently a TA
            for any course, or no professor you TA for has uploaded projects.
          </p>
        ) : (
          <div className="flex flex-col gap-12">
            {groups.map((group) => (
              <section key={group.professorId} className="flex flex-col gap-6">
                {/* Professor heading */}
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                    {group.professorName}
                  </h2>
                  <p className="text-sm text-slate-500">{group.courseNames.join(" · ")}</p>
                  <div className="mt-1 h-0.5 w-8 bg-red-700" />
                </div>

                {group.projects.length === 0 ? (
                  <p className="text-sm text-slate-500">No projects uploaded yet.</p>
                ) : (
                  <ul className="flex flex-col gap-6">
                    {group.projects.map((p) => (
                      <li key={p.id} className="flex flex-col gap-3 border-b border-slate-200 pb-6">
                        <div>
                          <p className="font-semibold text-slate-950">{p.title}</p>
                          <p className="text-sm italic text-slate-600">{p.tagline}</p>
                        </div>

                        {p.files.length === 0 ? (
                          <p className="text-xs text-slate-400">No files in this project yet.</p>
                        ) : (
                          <ul className="grid gap-2">
                            {p.files.map((f) => (
                              <li
                                key={f.id}
                                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600">
                                    {AUDIENCE_TAG_LABELS[f.audienceTag] ?? f.audienceTag}
                                  </span>
                                  <span className="text-sm font-medium text-slate-900">
                                    {f.label}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {f.originalFilename} · {formatBytes(f.fileSizeBytes)}
                                  </span>
                                </div>
                                {f.downloadUrl ? (
                                  <a
                                    href={f.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 text-sm text-red-700 hover:underline"
                                  >
                                    Download
                                  </a>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}

      </div>
    </SiteShell>
  );
}
