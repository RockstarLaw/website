"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export function OogleSearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    if (q) router.push(`/oogle/results?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <input
        ref={inputRef}
        name="q"
        type="search"
        autoComplete="off"
        defaultValue={initialQuery}
        className="w-full rounded-full border border-slate-300 px-6 py-3 text-base text-slate-900 shadow-sm outline-none transition hover:shadow-md focus:border-blue-300 focus:shadow-md"
        aria-label="Search"
      />
    </form>
  );
}
