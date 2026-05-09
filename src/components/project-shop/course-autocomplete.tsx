"use client";

// CourseAutocomplete — typing UX for the Project Shop course filter and the
// Create Project course-tag input.
//
// Behavior (per the John spec, 2026-05-08):
//   - Author types a partial course name.
//   - System hits /api/courses?q=<text> on each keystroke (250ms debounce).
//   - The portion of typed text that still matches some course in the database
//     stays BLACK; once additional letters no longer have any prefix match,
//     those trailing letters render RED.
//   - A dropdown shows up to 10 candidate matches; click or Enter to add the
//     chosen course as a chip.
//   - Multiple courses can be added; each chip is removable via x.
//
// Selected courses are returned via onChange as an array of { id, courseName }.
// The parent component decides what to do with that — e.g., URL params for the
// Project Shop filter rail, or a hidden form field for Create Project.

import { useEffect, useMemo, useRef, useState } from "react";

export type CourseHit = {
  id:         string;
  courseName: string;
  schoolName: string;
};

type Props = {
  selected:    CourseHit[];
  onChange:    (next: CourseHit[]) => void;
  placeholder?: string;
};

export function CourseAutocomplete({
  selected,
  onChange,
  placeholder = "Type a course name…",
}: Props) {
  const [text, setText]               = useState("");
  const [hits, setHits]               = useState<CourseHit[]>([]);
  const [matchedLen, setMatchedLen]   = useState(0); // # of leading chars that still match SOMETHING
  const [activeIdx, setActiveIdx]     = useState(0);
  const [open, setOpen]               = useState(false);
  const wrapRef                       = useRef<HTMLDivElement | null>(null);

  // Debounced fetch: when text changes, ask the server how many leading chars
  // still match SOME course. Trailing non-matching letters render red.
  useEffect(() => {
    if (!text.trim()) {
      setHits([]);
      setMatchedLen(0);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/courses?q=${encodeURIComponent(text)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as { courses: CourseHit[] };
        setHits(json.courses);

        // Compute the longest prefix of `text` that still has at least one hit.
        // Strategy: start with full text — if hits, matchedLen = text.length.
        // Otherwise binary-search prefixes that we already know about isn't
        // available (we'd need extra fetches), so we approximate: if any hit's
        // course_name (lowercased) contains the typed prefix, keep extending.
        const lower = text.toLowerCase();
        if (json.courses.length > 0) {
          // some prefix matches → assume the typed text is fully on track
          setMatchedLen(text.length);
        } else {
          // nothing matched → walk back char-by-char until a substring would
          // have hit. We can't know without another fetch; punt to a second
          // request with the previous successful length.
          // Simpler fallback: lookup all course names client-side via a single
          // broad fetch on first ever query. For now we mark matchedLen as
          // the prior value (so red kicks in at the first divergent char).
          setMatchedLen((prev) => Math.min(prev, text.length));
          // sanity: never let matchedLen claim more chars than `lower` has
          if (matchedLen > lower.length) setMatchedLen(lower.length);
        }
        setActiveIdx(0);
        setOpen(true);
      } catch {
        /* ignore aborts */
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Close dropdown on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function addCourse(c: CourseHit) {
    if (selected.find((s) => s.id === c.id)) {
      // already added — just clear input
      setText("");
      setOpen(false);
      return;
    }
    onChange([...selected, c]);
    setText("");
    setHits([]);
    setOpen(false);
  }

  function removeCourse(id: string) {
    onChange(selected.filter((c) => c.id !== id));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && hits[activeIdx]) {
        e.preventDefault();
        addCourse(hits[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && text === "" && selected.length > 0) {
      // Quick-delete last chip when input is empty
      onChange(selected.slice(0, -1));
    }
  }

  // Split typed text into "matched (black)" and "trailing (red)" segments.
  const { matched, divergent } = useMemo(() => {
    const safeMatched = Math.min(matchedLen, text.length);
    return {
      matched:   text.slice(0, safeMatched),
      divergent: text.slice(safeMatched),
    };
  }, [text, matchedLen]);

  return (
    <div ref={wrapRef} className="flex flex-col gap-2">
      {/* Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-800"
              title={c.schoolName}
            >
              {c.courseName}
              <button
                type="button"
                onClick={() => removeCourse(c.id)}
                className="text-slate-500 hover:text-red-700"
                aria-label={`Remove ${c.courseName}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + colored overlay */}
      <div className="relative">
        {/* Visible input is transparent text; overlay below paints colored chars */}
        <input
          type="text"
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => text.trim() && setOpen(true)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-transparent caret-slate-950 outline-none transition focus:border-red-700"
          style={{ caretColor: "#020617" }}
          autoComplete="off"
        />
        {/* Colored overlay — sits inside same position as input text */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center px-3 text-sm"
        >
          {text === "" ? (
            <span className="text-slate-400">{placeholder}</span>
          ) : (
            <>
              <span className="text-slate-950">{matched}</span>
              <span className="text-red-700">{divergent}</span>
            </>
          )}
        </div>

        {/* Dropdown */}
        {open && hits.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
            {hits.slice(0, 10).map((h, i) => (
              <li key={h.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addCourse(h);
                  }}
                  className={`flex w-full flex-col items-start px-3 py-1.5 text-left transition ${
                    i === activeIdx ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-slate-950">{h.courseName}</span>
                  {h.schoolName && (
                    <span className="text-[11px] text-slate-500">{h.schoolName}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
