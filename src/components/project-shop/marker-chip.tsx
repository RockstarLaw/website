import Image from "next/image";

import type { Marker } from "@/lib/projects/marker-config";

export function MarkerChip({ marker }: { marker: Marker }) {
  if (marker.iconPath) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800"
        title={marker.label}
      >
        <Image
          src={marker.iconPath}
          alt=""
          width={14}
          height={14}
          className="h-3.5 w-3.5 object-contain"
        />
        <span>{marker.label}</span>
      </span>
    );
  }
  // Text-only chip rendering. If a coinColor is set, render a small colored
  // dot before the label and use outline-style (border) — this is for Real
  // World / World Rank / Moot Court. Plain text chips (e.g. duration) keep
  // their existing borderless fill treatment.
  const hasCoin = Boolean(marker.coinColor);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        hasCoin ? "gap-1.5 border border-slate-300" : ""
      } ${marker.textChipBg} ${marker.textChipText}`}
      title={marker.label}
    >
      {hasCoin && (
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${marker.coinColor}`}
        />
      )}
      <span>{marker.label}</span>
    </span>
  );
}
