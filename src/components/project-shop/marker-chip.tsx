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
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${marker.textChipBg} ${marker.textChipText}`}
      title={marker.label}
    >
      {marker.label}
    </span>
  );
}
