"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

import { AREAS_OF_LAW } from "@/lib/projects/areas-of-law";
import { DURATION_OPTIONS, MODE_LABELS } from "@/lib/projects/project-types";

const MODE_KEYS = ["versus", "team", "solo", "drafting", "oral_argument", "creativity"] as const;

function FilterGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold text-slate-900"
      >
        <span>{title}</span>
        <span className="text-xs text-slate-400">{open ? "▴" : "▾"}</span>
      </button>
      {open && <div className="mt-3 flex flex-col gap-2">{children}</div>}
    </div>
  );
}

export function FilterRail() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local keyword for typing without flooding the URL.
  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  useEffect(() => {
    setKeyword(searchParams.get("q") ?? "");
  }, [searchParams]);

  function pushParams(next: URLSearchParams) {
    startTransition(() => {
      router.replace(`/project-shop?${next.toString()}`, { scroll: false });
    });
  }

  function toggleListParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(name);
    if (current.includes(value)) {
      params.delete(name);
      current.filter((v) => v !== value).forEach((v) => params.append(name, v));
    } else {
      params.append(name, value);
    }
    pushParams(params);
  }

  function toggleBoolParam(name: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(name) === "true") params.delete(name);
    else params.set(name, "true");
    pushParams(params);
  }

  function applyKeyword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (keyword.trim()) params.set("q", keyword.trim());
    else params.delete("q");
    pushParams(params);
  }

  function clearAll() {
    startTransition(() => {
      router.replace("/project-shop", { scroll: false });
    });
  }

  const isChecked = {
    area: (a: string) => searchParams.getAll("area").includes(a),
    mode: (m: string) => searchParams.getAll("mode").includes(m),
    dur:  (d: string) => searchParams.getAll("duration").includes(d),
  };

  const realWorldOn = searchParams.get("real_world") === "true";
  const worldRankOn = searchParams.get("world_rank") === "true";
  const anyActive =
    !!searchParams.get("q") ||
    searchParams.getAll("area").length > 0 ||
    searchParams.getAll("mode").length > 0 ||
    searchParams.getAll("duration").length > 0 ||
    realWorldOn || worldRankOn;

  return (
    <aside className={`flex flex-col gap-2 ${isPending ? "opacity-60" : ""}`}>
      {/* Keyword */}
      <form onSubmit={applyKeyword} className="flex flex-col gap-2 pb-1">
        <label htmlFor="ps-keyword" className="text-sm font-semibold text-slate-900">
          Search
        </label>
        <input
          id="ps-keyword"
          type="search"
          placeholder="Title, tagline, pitch…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-red-700"
        />
        <button
          type="submit"
          className="self-start rounded-full bg-red-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800"
        >
          Search
        </button>
      </form>

      {anyActive && (
        <button
          type="button"
          onClick={clearAll}
          className="self-start text-xs text-red-700 hover:underline"
        >
          Clear all filters
        </button>
      )}

      {/* Area of Law */}
      <FilterGroup title="Area of Law" defaultOpen={false}>
        <div className="max-h-72 overflow-y-auto pr-1">
          {AREAS_OF_LAW.map((a) => (
            <label key={a} className="flex cursor-pointer items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={isChecked.area(a)}
                onChange={() => toggleListParam("area", a)}
                className="h-4 w-4 accent-red-700"
              />
              <span className="text-xs text-slate-700">{a}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Mode */}
      <FilterGroup title="Mode">
        {MODE_KEYS.map((m) => (
          <label key={m} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isChecked.mode(m)}
              onChange={() => toggleListParam("mode", m)}
              className="h-4 w-4 accent-red-700"
            />
            <span className="text-xs text-slate-700">{MODE_LABELS[m] ?? m}</span>
          </label>
        ))}
      </FilterGroup>

      {/* Duration */}
      <FilterGroup title="Duration">
        {DURATION_OPTIONS.map((d) => (
          <label key={d.value} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isChecked.dur(d.value)}
              onChange={() => toggleListParam("duration", d.value)}
              className="h-4 w-4 accent-red-700"
            />
            <span className="text-xs text-slate-700">{d.label}</span>
          </label>
        ))}
      </FilterGroup>

      {/* Real World */}
      <FilterGroup title="Special">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={realWorldOn}
            onChange={() => toggleBoolParam("real_world")}
            className="h-4 w-4 accent-red-700"
          />
          <span className="text-xs text-slate-700">Real World only</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={worldRankOn}
            onChange={() => toggleBoolParam("world_rank")}
            className="h-4 w-4 accent-red-700"
          />
          <span className="text-xs text-slate-700">World Rank Qualifying only</span>
        </label>
      </FilterGroup>
    </aside>
  );
}
