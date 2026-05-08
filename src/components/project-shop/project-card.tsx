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
  ].filter(Boolean) as typeof modeMarkers;

  const durationMarker = DURATION_MARKERS[project.duration];

  return (
    <Link
      href={`/project-shop/${project.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-red-700 hover:shadow-sm"
    >
      {/* 3:2 portrait poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-100">
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
      </div>

      {/* Title */}
      <h3 className="line-clamp-2 text-base font-semibold leading-tight text-slate-950">
        {project.title}
      </h3>

      {/* Tagline (italic, single line) */}
      {project.tagline && (
        <p className="line-clamp-1 text-sm italic text-slate-700">{project.tagline}</p>
      )}

      {/* Description (pitch — clamp to 3 lines on card) */}
      {project.pitch && (
        <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">{project.pitch}</p>
      )}

      {/* Categories (Area of Law) */}
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

      {/* Icon row — visual baseline of the card */}
      <div className="mt-auto flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
        {modeMarkers.map((m) => (
          <MarkerChip key={m.key} marker={m} />
        ))}
        {specialMarkers.map((m) => (
          <MarkerChip key={m.key} marker={m} />
        ))}
        {durationMarker && <MarkerChip marker={durationMarker} />}
      </div>
    </Link>
  );
}
