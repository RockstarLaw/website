"use client";

import { useActionState, useEffect, useState } from "react";

import { submitQuote } from "@/lib/quotes/quote-actions";
import { initialQuoteSubmissionState } from "@/lib/quotes/quote-types";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-700";

export function QuoteWidget({
  quote,
}: {
  quote: { text: string; attribution: string } | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState(
    submitQuote,
    initialQuoteSubmissionState,
  );

  // Auto-collapse the form after 3 seconds on success.
  // setShowForm is called inside a setTimeout callback (async), not
  // synchronously in the effect body — this avoids the cascading-render lint rule.
  useEffect(() => {
    if (!state.success) return;
    const t = setTimeout(() => setShowForm(false), 3000);
    return () => clearTimeout(t);
  }, [state.success]);

  return (
    <div className="flex flex-col gap-4">
      {/* Quote box */}
      {quote ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-base italic leading-7 text-slate-700">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-3 text-sm text-slate-500">
            &mdash; {quote.attribution}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No quotes yet.</p>
      )}

      {/* Toggle button — only visible when form is closed */}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="self-start rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
        >
          Add a quote
        </button>
      )}

      {/* Inline submission form */}
      {showForm && (
        <form action={formAction} className="flex flex-col gap-3">
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

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
            >
              {pending ? "Submitting…" : "Submit for review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
