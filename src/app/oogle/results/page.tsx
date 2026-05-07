import Link from "next/link";

import { OogleNavBar } from "@/components/oogle/OogleNavBar";
import { matchQuery } from "@/lib/oogle/search-matcher";

export const dynamic = "force-dynamic";

export default async function OogleResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const match = query ? matchQuery(query) : null;

  return (
    <div className="min-h-screen bg-white">

      {/* Header with mini logo + search bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-6">
          <Link
            href="/oogle"
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            <span style={{ color: "#4285F4" }}>O</span>
            <span style={{ color: "#EA4335" }}>O</span>
            <span style={{ color: "#4285F4" }}>g</span>
            <span style={{ color: "#34A853" }}>l</span>
            <span style={{ color: "#FBBC05" }}>e</span>
          </Link>

          <form action="/oogle/results" method="GET" className="flex-1">
            <input
              name="q"
              type="search"
              defaultValue={query}
              autoComplete="off"
              className="w-full rounded-full border border-slate-300 px-5 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:shadow-sm"
            />
          </form>
        </div>
      </header>

      {/* Decorative nav under header */}
      <div className="border-b border-slate-100 px-4 py-1.5">
        <div className="mx-auto max-w-3xl">
          <OogleNavBar />
        </div>
      </div>

      {/* Results body */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {query && (
          <p className="mb-5 text-sm text-slate-500">
            About {match ? "1" : "0"} result (0.42 seconds)
          </p>
        )}

        {match ? (
          <div className="flex flex-col gap-8">
            {/* Primary match */}
            <div>
              <p className="mb-0.5 text-xs text-slate-500">{match.displayUrl}</p>
              <Link
                href={match.route}
                className="text-xl font-medium text-blue-700 hover:underline"
              >
                {match.title}
              </Link>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">
                {match.description}
              </p>
            </div>

            {/* Decorative atmosphere results */}
            {[
              {
                title: "Florida Department of State – Division of Corporations",
                url: "dos.myflorida.com › sunbiz",
                desc: "Official Florida business entity filing portal. Possibly load-bearing. Definitely beige.",
              },
              {
                title: "Florida LLC Formation – Wikipedia",
                url: "en.wikipedia.org › wiki › Limited_liability_company",
                desc: "A limited liability company (LLC) is a business structure combining limited liability with pass-through taxation. See also: your professor's syllabus.",
              },
              {
                title: "How to form an LLC in Florida – NerdWallet",
                url: "nerdwallet.com › ... › Florida LLC",
                desc: "Step 1: Choose a name. Step 2: File articles of organization. Step 3: Use RockStar StarBiz so you actually know what you're doing.",
              },
            ].map((r, i) => (
              <div key={i} className="opacity-60">
                <p className="mb-0.5 text-xs text-slate-400">{r.url}</p>
                <span className="text-lg font-medium text-blue-600">{r.title}</span>
                <p className="mt-1 text-sm leading-6 text-slate-500">{r.desc}</p>
              </div>
            ))}
          </div>
        ) : query ? (
          /* No match */
          <div className="flex flex-col gap-3">
            <p className="text-slate-700">
              OOgle couldn&rsquo;t find that. Try a real word, counselor.
            </p>
            <p className="text-sm text-slate-500">
              Did you mean:{" "}
              <Link href="/oogle/results?q=sunbiz" className="text-blue-600 hover:underline">
                sunbiz
              </Link>
              {" or "}
              <Link href="/oogle/results?q=florida+llc" className="text-blue-600 hover:underline">
                florida llc
              </Link>
              ?
            </p>
          </div>
        ) : (
          <p className="text-slate-500">Enter a search term above.</p>
        )}
      </main>
    </div>
  );
}
