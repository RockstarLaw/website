"use client";

import { useActionState } from "react";

import { addToLibrary, initialLibraryState } from "@/lib/projects/library-actions";

export function AddToLibraryButton({
  projectId,
  price,
  alreadyInLibrary = false,
}: {
  projectId: string;
  price: number;
  alreadyInLibrary?: boolean;
}) {
  const [state, formAction, pending] = useActionState(addToLibrary, initialLibraryState);
  const priceLabel = price === 0 ? "Free" : `$${price.toFixed(2)}`;

  // After a successful add, the success message replaces the button label
  const justAdded = !!state.success;
  const isAdded = alreadyInLibrary || justAdded;

  return (
    <form action={formAction} className="flex flex-col items-center gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        disabled={pending || isAdded}
        className={`rounded-full px-6 py-3 text-base font-semibold text-white shadow-sm transition disabled:cursor-not-allowed ${
          isAdded
            ? "bg-emerald-700 disabled:opacity-100"
            : "bg-red-700 hover:bg-red-800 disabled:opacity-60"
        }`}
      >
        {pending
          ? "Adding…"
          : isAdded
            ? "✓ In MY PROJECTS"
            : `Add to MY PROJECTS · ${priceLabel}`}
      </button>
      {state.error && (
        <p className="text-xs text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-emerald-700">{state.success}</p>
      )}
      {!state.error && !state.success && (
        <p className="text-xs text-slate-500">
          Once added, manage from your dashboard.
        </p>
      )}
    </form>
  );
}
