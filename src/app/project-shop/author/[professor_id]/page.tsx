import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { ProjectCard } from "@/components/project-shop/project-card";
import {
  getAuthorPageData,
  getCurrentProfessorDashboardData,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function ProjectShopAuthorPage({
  params,
}: {
  params: Promise<{ professor_id: string }>;
}) {
  // Public page — anonymous visitors view authors without signing in.
  const viewer = await getCurrentProfessorDashboardData();
  const viewerProfessorId = viewer?.professorId ?? null;

  const { professor_id } = await params;
  const author = await getAuthorPageData(professor_id, viewerProfessorId);
  if (!author) notFound();

  const initials = author.professorName
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const projectCount = author.projects.length;

  return (
    <SiteShell title="Project Shop" description="" hideIntro>
      <div className="flex flex-col gap-8">
        {/* Breadcrumb */}
        <div className="text-sm text-slate-500">
          <Link href="/project-shop" className="hover:text-red-700 hover:underline">
            ← Back to Project Shop
          </Link>
        </div>

        {/* Author header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-center sm:gap-6">
          {author.photoUrl ? (
            <Image
              src={author.photoUrl}
              alt={author.professorName}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-2xl font-semibold text-slate-600">
              {initials}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-slate-400">Authored by</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Professor {author.professorName.split(" ").slice(-1)[0]}, Esq.
            </h1>
            <div className="mt-1 h-0.5 w-12 bg-red-700" />
            {author.universityName && (
              <p className="mt-2 text-base text-slate-600">{author.universityName}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">
              {projectCount} project{projectCount === 1 ? "" : "s"} in the catalog
              {author.isViewerSelf && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                  This is you
                </span>
              )}
            </p>
          </div>
        </header>

        {/* Project grid */}
        {projectCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-base font-medium text-slate-900">
              {author.isViewerSelf
                ? "You haven't published any projects yet."
                : `${author.professorName} hasn't published any projects yet.`}
            </p>
            {author.isViewerSelf && (
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Add one from{" "}
                <Link href="/dashboard/professor" className="font-semibold text-red-700 hover:underline">
                  your dashboard
                </Link>{" "}
                to populate your author page.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {author.projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
