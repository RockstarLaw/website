import { redirect } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjectsForTAUser } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

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
              <section key={group.professorId} className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                    {group.professorName}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {group.courseNames.join(" · ")}
                  </p>
                  <div className="mt-1 h-0.5 w-8 bg-red-700" />
                </div>

                {group.projects.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No projects uploaded yet.
                  </p>
                ) : (
                  <ul className="grid gap-4">
                    {group.projects.map((p) => (
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
                        {p.downloadUrl ? (
                          <a
                            href={p.downloadUrl}
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
              </section>
            ))}
          </div>
        )}

      </div>
    </SiteShell>
  );
}
