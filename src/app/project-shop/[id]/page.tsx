import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { AddToLibraryButton } from "@/components/project-shop/add-to-library-button";
import { MarkerChip } from "@/components/project-shop/marker-chip";
import { DURATION_MARKERS, MODE_MARKERS, SPECIAL_MARKERS } from "@/lib/projects/marker-config";
import { AUDIENCE_TAG_LABELS } from "@/lib/projects/project-types";
import {
  getCurrentProfessorDashboardData,
  getProjectShopDetail,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export default async function ProjectShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const professor = await getCurrentProfessorDashboardData();
  if (!professor) {
    return (
      <SiteShell title="Project Shop" description="" hideIntro>
        <p className="text-slate-600">
          The Project Shop is for professors. Sign in with a professor account to view this project.
        </p>
      </SiteShell>
    );
  }

  const { id } = await params;
  const project = await getProjectShopDetail(id, professor.professorId);
  if (!project) notFound();

  // Marker rows
  const modeMarkers = (
    [
      project.modes.versus       && MODE_MARKERS.versus,
      project.modes.team         && MODE_MARKERS.team,
      project.modes.solo         && MODE_MARKERS.solo,
      project.modes.drafting     && MODE_MARKERS.drafting,
      project.modes.oralArgument && MODE_MARKERS.oral_argument,
      project.modes.creativity   && MODE_MARKERS.creativity,
    ].filter(Boolean) as { key: string; label: string; iconPath: string | null; textChipBg: string; textChipText: string }[]
  );
  const specialMarkers = [
    project.realWorld           && SPECIAL_MARKERS.real_world,
    project.worldRankQualifying && SPECIAL_MARKERS.world_rank_qualifying,
  ].filter(Boolean) as typeof modeMarkers;
  const durationMarker = DURATION_MARKERS[project.duration];

  return (
    <SiteShell title="Project Shop" description="" hideIntro>
      <div className="flex flex-col gap-8">
        {/* Breadcrumb back to catalog */}
        <div className="text-sm text-slate-500">
          <Link href="/project-shop" className="hover:text-red-700 hover:underline">
            ← Back to Project Shop
          </Link>
        </div>

        {/* Two-column hero: gallery + meta */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          {/* Left: image gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-100">
              {project.imageUrls.image1 ? (
                <Image
                  src={project.imageUrls.image1}
                  alt={project.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                  No image
                </div>
              )}
            </div>
            {(project.imageUrls.image2 || project.imageUrls.image3) && (
              <div className="grid grid-cols-2 gap-4">
                {project.imageUrls.image2 && (
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={project.imageUrls.image2}
                      alt={`${project.title} — image 2`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 30vw"
                      className="object-cover"
                    />
                  </div>
                )}
                {project.imageUrls.image3 && (
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={project.imageUrls.image3}
                      alt={`${project.title} — image 3`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 30vw"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: title, tagline, meta, CTA */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950">
                {project.title}
              </h1>
              <div className="mt-2 h-0.5 w-12 bg-red-700" />
            </div>

            {project.tagline && (
              <p className="text-lg italic text-slate-700">{project.tagline}</p>
            )}

            {/* Author byline */}
            <Link
              href={`/project-shop/author/${project.authorId}`}
              className="inline-flex items-center gap-3 self-start rounded-full border border-slate-200 bg-white px-3 py-2 transition hover:border-red-700"
            >
              {project.authorPhotoUrl ? (
                <Image
                  src={project.authorPhotoUrl}
                  alt={project.authorName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {project.authorName.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-slate-400">Authored by</span>
                <span className="text-sm font-semibold text-slate-900">{project.authorName}</span>
              </div>
            </Link>

            {/* Area chips */}
            {project.areaOfLaw.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.areaOfLaw.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}

            {/* Marker icons */}
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              {modeMarkers.map((m) => (
                <MarkerChip key={m.key} marker={m} />
              ))}
              {specialMarkers.map((m) => (
                <MarkerChip key={m.key} marker={m} />
              ))}
              {durationMarker && <MarkerChip marker={durationMarker} />}
            </div>

            {/* CTA — author vs other professor */}
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
              {project.isViewerAuthor ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  You authored this project.{" "}
                  <Link href="/dashboard/professor" className="font-semibold text-red-700 hover:underline">
                    Manage from your dashboard →
                  </Link>
                </div>
              ) : (
                <AddToLibraryButton
                  projectId={project.id}
                  price={project.price}
                  alreadyInLibrary={project.viewerHasInLibrary}
                />
              )}
              <p className="text-xs text-slate-500">
                {project.usageCount > 0
                  ? `${project.usageCount} professor${project.usageCount === 1 ? "" : "s"} using this project · `
                  : ""}
                Listed {formatDate(project.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Pitch — full-width below hero */}
        {project.pitch && (
          <div className="grid gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">About this project</h2>
            <div className="h-0.5 w-12 bg-red-700" />
            <p className="whitespace-pre-line text-base leading-relaxed text-slate-700">
              {project.pitch}
            </p>
          </div>
        )}

        {/* File list */}
        <div className="grid gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            What&apos;s included
          </h2>
          <div className="h-0.5 w-12 bg-red-700" />
          {project.files.length === 0 ? (
            <p className="text-sm text-slate-500">
              The author hasn&apos;t attached any files yet.
            </p>
          ) : (
            <ul className="grid gap-2">
              {project.files.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600">
                      {AUDIENCE_TAG_LABELS[f.audienceTag] ?? f.audienceTag}
                    </span>
                    <span className="text-sm font-medium text-slate-900">{f.label}</span>
                    <span className="text-xs text-slate-400">
                      {f.originalFilename} · {formatBytes(f.fileSizeBytes)}
                    </span>
                  </div>
                  {project.isViewerAuthor && f.downloadUrl ? (
                    <a
                      href={f.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-red-700 hover:underline"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Available after adding to My Projects
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
