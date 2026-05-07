/**
 * CSS-only help tooltip. Appears on hover or focus-within.
 * No third-party dependencies.
 */
export function HelpTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-block">
      <button
        type="button"
        className="ml-1 cursor-help rounded-full border border-slate-300 px-1.5 py-0.5 text-xs leading-none text-slate-400 transition hover:border-red-700 hover:text-slate-600 focus:border-red-700 focus:outline-none"
        aria-label="Help"
      >
        ?
      </button>
      {/* Tooltip panel — visible on hover or keyboard focus */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
