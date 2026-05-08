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

export default async function ProjectShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Public page — anonymous visitors browse without signing in.
  const sp = await searchParams;
  const filters: CatalogFilters = {
    keyword:   asScalar(sp.q),
    areas:     asArray(sp.area),
    modes:     asArray(sp.mode),
    durations: asArray(sp.duration),
    realWorld: asScalar(sp.real_world) === "true",
    worldRank: asScalar(sp.world_rank) === "true",
  };

  const requestedSort = asScalar(sp.sort) as CatalogSortKey;
  const sort: CatalogSortKey = VALID_SORTS.includes(requestedSort) ? requestedSort : "newest";

  const projects = await getCatalogProjects(filters, sort);

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
          <div className="md:sticky md:top-6 md:self-start">
            <FilterRail />
          </div>

          <div className="flex flex-col gap-4">
            {/* Top bar: count + sort */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <p className="text-sm text-slate-600">
                {projects.length} project{projects.length !== 1 ? "s" : ""}
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
