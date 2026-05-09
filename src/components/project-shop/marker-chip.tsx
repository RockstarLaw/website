import Image from "next/image";

import type { Marker } from "@/lib/projects/marker-config";

/** Hover tooltip popover — shows enlarged icon/coin + label + description.
 *  Uses Tailwind's NAMED group `group/marker` so it only responds to hover
 *  on its own chip wrapper, not on any ancestor `group` (e.g. the project
 *  card's outer `group` used for the poster hover effect). Positioned
 *  above the chip with a small triangular tick pointing down. */
function MarkerTooltip({ marker }: { marker: Marker }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg group-hover/marker:flex group-focus-within/marker:flex"
    >
      <span className="flex items-center gap-2">
        {marker.iconPath ? (
          <Image
            src={marker.iconPath}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        ) : marker.coinColor ? (
          <span
            aria-hidden="true"
            className={`h-5 w-5 rounded-full ${marker.coinColor}`}
          />
        ) : (
          <span
            aria-hidden="true"
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${marker.textChipBg} ${marker.textChipText}`}
          >
            ●
          </span>
        )}
        <span className="text-sm font-semibold text-slate-900">{marker.label}</span>
      </span>
      <span className="text-xs leading-relaxed text-slate-600">
        {marker.tooltipDescription}
      </span>
      {/* Triangle pointer toward the chip below */}
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white"
      />
    </span>
  );
}

export function MarkerChip({ marker }: { marker: Marker }) {
  if (marker.iconPath) {
    return (
      <span className="group/marker relative inline-block">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800">
          <Image
            src={marker.iconPath}
            alt=""
            width={14}
            height={14}
            className="h-3.5 w-3.5 object-contain"
          />
          <span>{marker.label}</span>
        </span>
        <MarkerTooltip marker={marker} />
      </span>
    );
  }
  // Text-only chip rendering. If a coinColor is set, render a small colored
  // dot before the label and use outline-style (border) — this is for Real
  // World / World Rank / Moot Court. Plain text chips (e.g. duration) keep
  // their existing borderless fill treatment.
  const hasCoin = Boolean(marker.coinColor);
  return (
    <span className="group/marker relative inline-block">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
          hasCoin ? "gap-1.5 border border-slate-300" : ""
        } ${marker.textChipBg} ${marker.textChipText}`}
      >
        {hasCoin && (
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${marker.coinColor}`}
          />
        )}
        <span>{marker.label}</span>
      </span>
      <MarkerTooltip marker={marker} />
    </span>
  );
}
