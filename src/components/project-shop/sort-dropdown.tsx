"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { CATALOG_SORT_OPTIONS, type CatalogSortKey } from "@/lib/projects/project-types";

export function SortDropdown() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Default sort = most_popular (per John, 2026-05-08). Mirrors the
  // server-side default in src/app/project-shop/page.tsx so the dropdown
  // visually matches what the catalog actually returns on first paint.
  const current = (searchParams.get("sort") as CatalogSortKey | null) ?? "most_popular";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as CatalogSortKey;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "most_popular") params.delete("sort");
    else params.set("sort", next);
    // Sort change resets pagination back to page 1.
    params.delete("page");
    startTransition(() => {
      router.replace(`/project-shop?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <label className={`flex items-center gap-2 text-sm text-slate-700 ${isPending ? "opacity-60" : ""}`}>
      <span className="font-medium">Sort:</span>
      <select
        value={current}
        onChange={onChange}
        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-950 outline-none transition focus:border-red-700"
      >
        {CATALOG_SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
