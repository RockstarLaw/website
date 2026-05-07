import Link from "next/link";
import { notFound } from "next/navigation";

const PARODY_MESSAGES: Record<string, string> = {
  filings:          "Stricken from the record.",
  exhibits:         "Marked for identification but not yet admitted.",
  "forum-shopping": "Privileged. You don't have access.",
  depositions:      "Currently being held in chambers.",
  legalese:         "Continued indefinitely.",
  discovery:        "Sidebar with the judge — come back later.",
  "court-calendar": "Objection sustained. This page does not exist.",
};

export default async function OogleParodyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const message = PARODY_MESSAGES[slug];

  if (!message) notFound();

  const label = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        OOgle {label}
      </p>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-950">
        {message}
      </h1>
      <p className="mb-8 text-sm text-slate-400">
        No further questions, Your Honor.
      </p>
      <Link
        href="/oogle"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to OOgle
      </Link>
    </div>
  );
}
