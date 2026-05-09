// Configuration for Project Shop marker chips.
// Each marker either has an icon PNG OR a text-only chip with a brand color.
// Icons live at public/images/projects/project-icons/ and are single-color.

export type Marker = {
  key:       string;
  label:     string;
  iconPath:  string | null;          // /images/... or null for text-only
  // Text chip styling (used only when iconPath is null)
  textChipBg:    string;             // Tailwind class
  textChipText:  string;             // Tailwind class
  // Optional "coin" — a small filled circle that renders before the label
  // for chips that don't have a full iconPath yet. Tailwind bg-* class.
  coinColor?:    string;
};

export const MODE_MARKERS: Record<string, Marker> = {
  versus: {
    key: "versus", label: "Versus",
    iconPath: "/images/projects/project-icons/projects-icons-versus.png",
    textChipBg: "", textChipText: "",
  },
  team: {
    key: "team", label: "Team",
    iconPath: "/images/projects/project-icons/projects-icons-teams.png",
    textChipBg: "", textChipText: "",
  },
  solo: {
    key: "solo", label: "Solo",
    iconPath: "/images/projects/project-icons/projects-icons-solo.png",
    textChipBg: "", textChipText: "",
  },
  drafting: {
    key: "drafting", label: "Drafting",
    iconPath: "/images/projects/project-icons/projects-icons-drafting.png",
    textChipBg: "", textChipText: "",
  },
  oral_argument: {
    key: "oral_argument", label: "Oral Argument",
    iconPath: "/images/projects/project-icons/projects-icons-versus-oral-arguments.png",
    textChipBg: "", textChipText: "",
  },
  creativity: {
    key: "creativity", label: "Creativity",
    iconPath: "/images/projects/project-icons/projects-icons-creativity.png",
    textChipBg: "", textChipText: "",
  },
};

// Special-flag markers — render as outline-style chips (white bg, neutral border)
// with a brand-colored "coin" dot before the label. Until full icons are
// commissioned, the coin dot conveys identity without a solid-fill chip.
export const SPECIAL_MARKERS: Record<string, Marker> = {
  real_world: {
    key: "real_world", label: "Real World",
    iconPath: null,
    textChipBg: "bg-white", textChipText: "text-emerald-700",
    coinColor: "bg-emerald-700",
  },
  world_rank_qualifying: {
    key: "world_rank_qualifying", label: "World-Rank",
    iconPath: null,
    textChipBg: "bg-white", textChipText: "text-slate-900",
    coinColor: "bg-amber-500",
  },
  moot_court: {
    key: "moot_court", label: "Moot Court Competition",
    iconPath: null,
    textChipBg: "bg-white", textChipText: "text-indigo-700",
    coinColor: "bg-indigo-700",
  },
};

// Duration markers — solid black chip with amber text. Identical visual
// treatment across all duration values so "TIME" reads as one consistent
// element regardless of the specific length. Distinct from subject chips
// (light gray) and special markers (white-outlined with coin).
export const DURATION_MARKERS: Record<string, Marker> = {
  "1hr":      { key: "1hr",      label: "1 Hour",    iconPath: null, textChipBg: "bg-slate-900", textChipText: "text-amber-300" },
  "3hr":      { key: "3hr",      label: "3 Hours",   iconPath: null, textChipBg: "bg-slate-900", textChipText: "text-amber-300" },
  "1wk":      { key: "1wk",      label: "1 Week",    iconPath: null, textChipBg: "bg-slate-900", textChipText: "text-amber-300" },
  "2wk":      { key: "2wk",      label: "2 Weeks",   iconPath: null, textChipBg: "bg-slate-900", textChipText: "text-amber-300" },
  "30day":    { key: "30day",    label: "30 Days",   iconPath: null, textChipBg: "bg-slate-900", textChipText: "text-amber-300" },
  "semester": { key: "semester", label: "Semester",  iconPath: null, textChipBg: "bg-slate-900", textChipText: "text-amber-300" },
};
