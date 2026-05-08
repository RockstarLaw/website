// State types for project server actions.
// Each is { error, success } — "use server" files may not export non-async values,
// so these live here and are imported by both actions and client components.

export type ProjectActionState = { error: string; success: string; projectId?: string };
export const initialProjectState: ProjectActionState = { error: "", success: "" };

export type FileActionState = { error: string; success: string };
export const initialFileState: FileActionState = { error: "", success: "" };

export type DeleteProjectState = { error: string; success: string };
export const initialDeleteProjectState: DeleteProjectState = { error: "", success: "" };

export type ProfessorPhotoActionState = { error: string; success: string };
export const initialPhotoState: ProfessorPhotoActionState = { error: "", success: "" };

// ─── Shared constants ─────────────────────────────────────────────────────────

export const DURATION_OPTIONS = [
  { value: "1hr",      label: "1 Hour" },
  { value: "3hr",      label: "3 Hours" },
  { value: "1wk",      label: "1 Week" },
  { value: "2wk",      label: "2 Weeks" },
  { value: "30day",    label: "30 Days" },
  { value: "semester", label: "Semester" },
] as const;

export const VALID_DURATIONS = DURATION_OPTIONS.map((d) => d.value);

export const AUDIENCE_TAG_LABELS: Record<string, string> = {
  general:  "General",
  side_a:   "Side A",
  side_b:   "Side B",
  team_a:   "Team A",
  team_b:   "Team B",
  solo:     "Solo",
  ta_only:  "TA Only",
};

export const MODE_LABELS: Record<string, string> = {
  versus:        "Versus",
  drafting:      "Drafting",
  oral_argument: "Oral Argument",
  solo:          "Solo",
  team:          "Team",
  creativity:    "Creativity",
};

// ─── Project Shop catalog sort ────────────────────────────────────────────────
// Lives here (not queries.ts) so client components can import without dragging
// in next/headers via the supabase server client.

export type CatalogSortKey =
  | "most_popular" | "least_popular"
  | "price_high"   | "price_low"
  | "oldest"       | "newest"
  | "most_used"    | "least_used";

export const CATALOG_SORT_OPTIONS: { value: CatalogSortKey; label: string }[] = [
  { value: "newest",        label: "Newest"        },
  { value: "oldest",        label: "Oldest"        },
  { value: "most_popular",  label: "Most Popular"  },
  { value: "least_popular", label: "Least Popular" },
  { value: "most_used",     label: "Most Used"     },
  { value: "least_used",    label: "Least Used"    },
  { value: "price_high",    label: "Price: High to Low" },
  { value: "price_low",     label: "Price: Low to High" },
];
