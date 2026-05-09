import Image from "next/image";
import Link from "next/link";

import { DURATION_MARKERS, MODE_MARKERS, SPECIAL_MARKERS } from "@/lib/projects/marker-config";
import type { ProjectShopCard } from "@/lib/supabase/queries";

import { MarkerChip } from "./marker-chip";

function priceLabel(p: number): string {
  if (p === 0) return "Free";
  return `$${p.toFixed(2)}`;
}

export function ProjectCard({ project }: { project: ProjectShopCard }) {
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
    project.mootCourt           && SPECIAL_MARKERS.moot_court,
  ].filter(Boolean) as typeof modeMarkers;

  const durationMarker = DURATION_MARKERS[project.duration];

  const detailHref = `/project-shop/${project.id}`;

  return (
    // Outer container is NOT a link. Only specific elements (title, poster) are clickable.
    // Other elements (tagline, pitch, area-of-law chips, marker chips) are display-only —
    // additional linkable elements can be added discretely later (author byline, etc.).
    <div className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-red-700 hover:shadow-sm">
      {/* 3:2 portrait poster — wrapped in its own Link */}
      <Link
        href={detailHref}
        className="relative block aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-100"
        aria-label={`Open ${project.title}`}
      >
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
        {project.price > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-white">
            {priceLabel(project.price)}
          </span>
        )}
        {project.price === 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-emerald-700/90 px-2.5 py-1 text-xs font-semibold text-white">
            Free
          </span>
        )}
      </Link>

      {/* Title + tagline group — paired together with tighter spacing.
          Outer gap-3 still applies above (to poster) and below (to pitch),
          but title and tagline render as one visual unit. */}
      <div className="flex flex-col gap-1">
        {/* Title — sliced at 60 chars with ellipsis if longer; reserves a
            consistent 2-line block (min-h-[2.5rem] at text-base/leading-tight
            = 40px = 2 × 20px line height) so all cards align vertically;
            horizontally centered. */}
        <h3 className="min-h-[2.5rem] text-center text-base font-semibold leading-tight text-slate-950">
          <Link
            href={detailHref}
            className="rounded-sm transition-colors hover:text-red-700 focus-visible:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/40"
          >
            {project.title.length > 60
              ? `${project.title.slice(0, 60).trim()}…`
              : project.title}
          </Link>
        </h3>

        {/* Tagline (italic, full — never truncated) — display only, not a link */}
        {project.tagline && (
          <p className="text-center text-sm italic text-slate-700">{project.tagline}</p>
        )}
      </div>

      {/* Description (pitch — clamp to 3 lines on card) — display only, not a link */}
      {project.pitch && (
        <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">{project.pitch}</p>
      )}

      {/* Bottom cluster — area-of-law subjects + marker icons stick to the
          bottom of the card together. Any whitespace from a short pitch
          appears ABOVE this cluster (between pitch and subjects), not below. */}
      <div className="mt-auto flex flex-col gap-3">
        {/* Categories (Area of Law) — display only for now; can become
            per-area filter links later */}
        {project.areaOfLaw.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.areaOfLaw.map((a) => (
              <span
                key={a}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Icon row — visual baseline of the card; display only */}
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          {modeMarkers.map((m) => (
            <MarkerChip key={m.key} marker={m} />
          ))}
          {specialMarkers.map((m) => (
            <MarkerChip key={m.key} marker={m} />
          ))}
          {durationMarker && <MarkerChip marker={durationMarker} />}
        </div>
      </div>
    </div>
  );
}
