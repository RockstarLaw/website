"use client";

export function OogleFeelingButton({
  phrase,
  destinations,
}: {
  phrase: string;
  destinations: string[];
}) {
  function handleClick() {
    if (!destinations.length) return;
    const url = destinations[Math.floor(Math.random() * destinations.length)];
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-sm border border-transparent bg-slate-100 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-200 hover:shadow-sm focus:outline-none"
    >
      {phrase}
    </button>
  );
}
