import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { FilterRail } from "@/components/project-shop/filter-rail";
import { ProjectCard } from "@/components/project-shop/project-card";
import { SortDropdown } from "@/components/project-shop/sort-dropdown";
import {
  getCatalogProjects,
  type CatalogFilters,
  type CatalogSortKey,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const VALID_SORTS: CatalogSortKey[] = [
  "newest", "oldest", "most_popular", "least_popular",
  "most_used", "least_used", "price_high", "price_low",
];

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function asScalar(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

// Build a /project-shop URL preserving all current params except `page`,
// which is replaced with the given page number (or removed when n === 1).
function buildPageHref(
  sp: Record<string, string | string[] | undefined>,
  n: number,
): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (key === "page") continue;
    if (val === undefined) continue;
    if (Array.isArray(val)) val.forEach((v) => params.append(key, v));
    else params.append(key, val);
  }
  if (n > 1) params.set("page", String(n));
  const qs = params.toString();
  return qs ? `/project-shop?${qs}` : "/project-shop";
}

export default async function ProjectShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Public page — anonymous visitors browse without signing in.
  const sp = await searchParams;
  const filters: CatalogFilters = {
    keyword:    asScalar(sp.q),
    areas:      asArray(sp.area),
    modes:      asArray(sp.mode),
    durations:  asArray(sp.duration),
    realWorld:  asScalar(sp.real_world) === "true",
    worldRank:  asScalar(sp.world_rank) === "true",
    mootCourt:  asScalar(sp.moot_court) === "true",
    industries: asArray(sp.industry),
    tags:       asArray(sp.tag).map((t) => t.toLowerCase()),
    courseIds:  asArray(sp.course),
  };

  // Default sort = most_popular (per John, 2026-05-08). Featured projects
  // bubble to the top on first paint; users can switch sort via the dropdown.
  const requestedSort = asScalar(sp.sort) as CatalogSortKey;
  const sort: CatalogSortKey = VALID_SORTS.includes(requestedSort) ? requestedSort : "most_popular";

  const requestedPage = parseInt(asScalar(sp.page) || "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const { projects, totalCount, pageCount, page: currentPage, pageSize } =
    await getCatalogProjects(filters, sort, page);

  // Range label like "Showing 1–9 of 13 projects"
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd   = Math.min(currentPage * pageSize, totalCount);

  return (
    <SiteShell title="Project Shop" description="" hideIntro>
      <div className="flex flex-col gap-8">
        {/* Heading */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Project Shop.</h1>
          <div className="mt-2 h-0.5 w-12 bg-red-700" />
          <p className="mt-4 text-base leading-7 text-slate-600">
            Browse projects authored by the RockStar Law faculty. Filter by area, mode, duration, or status.
          </p>
        </div>

        {/* Two-column layout: filter rail + grid */}
        <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
          <div>
            <FilterRail />
          </div>

          <div className="flex flex-col gap-4">
            {/* Top bar: count + sort */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <p className="text-sm text-slate-600">
                {totalCount === 0
                  ? "0 projects"
                  : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} project${totalCount !== 1 ? "s" : ""}`}
                {filters.keyword && (
                  <>
                    {" matching "}
                    <span className="font-semibold text-slate-900">&ldquo;{filters.keyword}&rdquo;</span>
                  </>
                )}
              </p>
              <SortDropdown />
            </div>

            {/* Grid */}
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <p className="text-base font-medium text-slate-900">No projects match your filters.</p>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  Try clearing a filter or two. The catalog grows every term —
                  if you don&apos;t see what you need, drop a note to the faculty list.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>

                {/* Pagination */}
                {pageCount > 1 && (
                  <nav
                    aria-label="Catalog pagination"
                    className="flex items-center justify-center gap-1 pt-4"
                  >
                    {currentPage > 1 ? (
                      <Link
                        href={buildPageHref(sp, currentPage - 1)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-red-700 hover:text-red-700"
                      >
                        ← Previous
                      </Link>
                    ) : (
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400">
                        ← Previous
                      </span>
                    )}

                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) =>
                      n === currentPage ? (
                        <span
                          key={n}
                          aria-current="page"
                          className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-semibold text-white"
                        >
                          {n}
                        </span>
                      ) : (
                        <Link
                          key={n}
                          href={buildPageHref(sp, n)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-red-700 hover:text-red-700"
                        >
                          {n}
                        </Link>
                      ),
                    )}

                    {currentPage < pageCount ? (
                      <Link
                        href={buildPageHref(sp, currentPage + 1)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-red-700 hover:text-red-700"
                      >
                        Next →
                      </Link>
                    ) : (
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400">
                        Next →
                      </span>
                    )}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
