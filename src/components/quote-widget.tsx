"use client";

import { useActionState, useCallback, useEffect, useState } from "react";

import { submitQuote } from "@/lib/quotes/quote-actions";
import { initialQuoteSubmissionState } from "@/lib/quotes/quote-types";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-700";

// ─── Modal component ──────────────────────────────────────────────────────────

function QuoteModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(
    submitQuote,
    initialQuoteSubmissionState,
  );

  // Auto-close after 2 s on success (async setTimeout — not synchronous setState in effect)
  useEffect(() => {
    if (!state.success) return;
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [state.success, onClose]);

  // Escape key closes modal (event handler, not synchronous setState)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Body scroll lock while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-heading"
    >
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {/* Close ✕ */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-700"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h2
          id="quote-modal-heading"
          className="mb-5 text-xl font-semibold tracking-tight text-slate-950"
        >
          Add a quote
        </h2>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Quote <span className="text-red-700">*</span>
            </span>
            <textarea
              name="quote"
              required
              maxLength={500}
              rows={4}
              placeholder="Enter the quote text…"
              className={inputCls}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Attribution <span className="text-red-700">*</span>
            </span>
            <input
              type="text"
              name="attribution"
              required
              maxLength={200}
              placeholder="Who said it?"
              className={inputCls}
            />
          </label>

          {state.error   && <p className="text-sm text-red-700">{state.error}</p>}
          {state.success && <p className="text-sm text-green-700">{state.success}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
            >
              {pending ? "Submitting…" : "Submit for review"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function QuoteWidget({
  quote,
}: {
  quote: { text: string; attribution: string } | null;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleClose = useCallback(() => setIsModalOpen(false), []);

  return (
    <div className="flex flex-col gap-3">
      {/* Quote box */}
      {quote ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-base italic leading-7 text-slate-700">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-3 text-sm text-slate-500">&mdash; {quote.attribution}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No quotes yet.</p>
      )}

      {/* Subtle text link — no button styling */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="self-start text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        + Add a quote
      </button>

      {/* Modal (rendered at root of widget; z-50 positions above everything) */}
      {isModalOpen && <QuoteModal onClose={handleClose} />}
    </div>
  );
}
