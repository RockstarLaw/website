import Link from "next/link";

const NAV_ITEMS = [
  { label: "Filings",        slug: "filings" },
  { label: "Exhibits",       slug: "exhibits" },
  { label: "Forum Shopping", slug: "forum-shopping" },
  { label: "Depositions",    slug: "depositions" },
  { label: "Legalese",       slug: "legalese" },
  { label: "Discovery",      slug: "discovery" },
  { label: "Court Calendar", slug: "court-calendar" },
];

export function OogleNavBar() {
  return (
    <nav
      aria-label="OOgle decorative navigation"
      className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-slate-500"
    >
      {NAV_ITEMS.map(({ label, slug }) => (
        <Link
          key={slug}
          href={`/oogle/parodies/${slug}`}
          className="transition hover:text-slate-800 hover:underline"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
