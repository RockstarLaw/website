export type SearchMatch = {
  route: string;
  title: string;
  displayUrl: string;
  description: string;
};

/**
 * Maps a search query to a RockStar Law module route.
 * Returns null if no module matches — caller renders the no-results state.
 * Keep this list small and grow it as modules ship.
 */
export function matchQuery(query: string): SearchMatch | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // ── StarBiz / Florida business filings ───────────────────────────────────
  if (
    /sunbiz|starbiz/.test(q) ||
    q.includes("sunbiz.org") ||
    /florida\s*(llc|corp|corporation|lp|limited\s*partner|non.?profit|fictitious|trademark|annual\s*report)/.test(q) ||
    /(form|file|register|start).*\s(llc|corp|corporation)/.test(q) ||
    /(dba|fictitious\s*name|doing\s*business\s*as)/.test(q) ||
    /annual\s*report.*florida/.test(q) ||
    /florida.*division.*corporations/.test(q)
  ) {
    return {
      route: "/starbiz",
      title: "StarBiz — Florida Business Filings — RockStar Law",
      displayUrl: "rockstarlaw.com › starbiz",
      description:
        "File LLCs, corporations, limited partnerships, fictitious names, annual reports, " +
        "and state trademarks. RockStar Law's simulation of the Florida Division of Corporations — " +
        "same fields, same workflow, same dated UX. Train here, file anywhere.",
    };
  }

  // ── Future modules — placeholder matches pointing at starbiz for now ─────
  if (/uspto|trademark.*(federal|application|registration)|trademark\s*office/.test(q) || q === "uspto.gov") {
    return {
      route: "/starbiz",
      title: "StarBiz — Florida Trademark Filings — RockStar Law",
      displayUrl: "rockstarlaw.com › starbiz",
      description: "State trademark filings available now via StarBiz. Federal USPTO module coming soon.",
    };
  }

  return null;
}
