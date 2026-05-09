"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

import { AREAS_OF_LAW } from "@/lib/projects/areas-of-law";
import { INDUSTRIES } from "@/lib/projects/industries";
import { DURATION_OPTIONS, MODE_LABELS } from "@/lib/projects/project-types";
import { CourseAutocomplete, type CourseHit } from "./course-autocomplete";

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

  // Local tag-input buffer
  const [tagBuffer, setTagBuffer] = useState("");

  // Hydrated course chips (id+label+school) for the rail's ?course=<id> URL
  // params. We hit /api/courses?id=... on mount + whenever the URL param list
  // changes to fill in human-readable labels.
  const courseIds = searchParams.getAll("course");
  const [courseChips, setCourseChips] = useState<CourseHit[]>([]);
  useEffect(() => {
    if (courseIds.length === 0) {
      setCourseChips([]);
      return;
    }
    const known = new Set(courseChips.map((c) => c.id));
    const missing = courseIds.filter((id) => !known.has(id));
    const stillNeeded = courseChips.filter((c) => courseIds.includes(c.id));
    if (missing.length === 0) {
      // Just prune any chips no longer in URL
      if (stillNeeded.length !== courseChips.length) setCourseChips(stillNeeded);
      return;
    }
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    missing.forEach((id) => params.append("id", id));
    fetch(`/api/courses?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { courses: [] }))
      .then((j: { courses: CourseHit[] }) => {
        setCourseChips([...stillNeeded, ...j.courses]);
      })
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  function pushParams(next: URLSearchParams) {
    // Any filter change resets pagination back to page 1.
    next.delete("page");
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

  // Tags — applied as comma-separated buffer
  function applyTagBuffer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const newTags = tagBuffer
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (newTags.length === 0) return;
    const existing = new Set(params.getAll("tag"));
    newTags.forEach((t) => existing.add(t));
    params.delete("tag");
    Array.from(existing).forEach((t) => params.append("tag", t));
    setTagBuffer("");
    pushParams(params);
  }

  function removeTag(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const remaining = params.getAll("tag").filter((t) => t !== value);
    params.delete("tag");
    remaining.forEach((t) => params.append("tag", t));
    pushParams(params);
  }

  // Course chip add/remove
  function setCourses(next: CourseHit[]) {
    setCourseChips(next);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("course");
    next.forEach((c) => params.append("course", c.id));
    pushParams(params);
  }

  const isChecked = {
    area:     (a: string) => searchParams.getAll("area").includes(a),
    industry: (i: string) => searchParams.getAll("industry").includes(i),
    mode:     (m: string) => searchParams.getAll("mode").includes(m),
    dur:      (d: string) => searchParams.getAll("duration").includes(d),
  };

  const realWorldOn = searchParams.get("real_world") === "true";
  const worldRankOn = searchParams.get("world_rank") === "true";
  const mootCourtOn = searchParams.get("moot_court") === "true";
  const tagList     = searchParams.getAll("tag");
  const anyActive =
    !!searchParams.get("q") ||
    searchParams.getAll("area").length > 0 ||
    searchParams.getAll("industry").length > 0 ||
    searchParams.getAll("mode").length > 0 ||
    searchParams.getAll("duration").length > 0 ||
    searchParams.getAll("course").length > 0 ||
    tagList.length > 0 ||
    realWorldOn || worldRankOn || mootCourtOn;

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

      {/* Industries */}
      <FilterGroup title="Industries" defaultOpen={false}>
        <div className="max-h-72 overflow-y-auto pr-1">
          {INDUSTRIES.map((i) => (
            <label key={i} className="flex cursor-pointer items-center gap-2 py-0.5">
              <input
                type="checkbox"
                checked={isChecked.industry(i)}
                onChange={() => toggleListParam("industry", i)}
                className="h-4 w-4 accent-red-700"
              />
              <span className="text-xs text-slate-700">{i}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Courses (autocomplete) */}
      <FilterGroup title="Courses" defaultOpen={false}>
        <CourseAutocomplete
          selected={courseChips}
          onChange={setCourses}
          placeholder="Type a course name…"
        />
      </FilterGroup>

      {/* Tags (free-form) */}
      <FilterGroup title="Tags" defaultOpen={false}>
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tagList.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-800"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="text-slate-500 hover:text-red-700"
                  aria-label={`Remove ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <form onSubmit={applyTagBuffer} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="nike, sneaker culture, …"
            value={tagBuffer}
            onChange={(e) => setTagBuffer(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-950 outline-none transition focus:border-red-700"
          />
          <button
            type="submit"
            className="self-start rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-slate-800"
          >
            Add tags
          </button>
        </form>
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
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={mootCourtOn}
            onChange={() => toggleBoolParam("moot_court")}
            className="h-4 w-4 accent-red-700"
          />
          <span className="text-xs text-slate-700">Moot Court Competitions only</span>
        </label>
      </FilterGroup>
    </aside>
  );
}
