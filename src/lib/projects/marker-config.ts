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

// Special-flag markers — no icon yet, text-only with brand color.
export const SPECIAL_MARKERS: Record<string, Marker> = {
  real_world: {
    key: "real_world", label: "Real World",
    iconPath: null,
    textChipBg: "bg-emerald-700", textChipText: "text-white",
  },
  world_rank_qualifying: {
    key: "world_rank_qualifying", label: "World Rank Qualifying",
    iconPath: null,
    textChipBg: "bg-slate-900", textChipText: "text-amber-300",
  },
};

// Duration markers — only "1hr" has an icon. Others are gray text chips.
export const DURATION_MARKERS: Record<string, Marker> = {
  "1hr": {
    key: "1hr", label: "1 Hour",
    iconPath: "/images/projects/project-icons/projects-icons-one-hour.png",
    textChipBg: "", textChipText: "",
  },
  "3hr":      { key: "3hr",      label: "3 Hours",   iconPath: null, textChipBg: "bg-slate-100", textChipText: "text-slate-700" },
  "1wk":      { key: "1wk",      label: "1 Week",    iconPath: null, textChipBg: "bg-slate-100", textChipText: "text-slate-700" },
  "2wk":      { key: "2wk",      label: "2 Weeks",   iconPath: null, textChipBg: "bg-slate-100", textChipText: "text-slate-700" },
  "30day":    { key: "30day",    label: "30 Days",   iconPath: null, textChipBg: "bg-slate-100", textChipText: "text-slate-700" },
  "semester": { key: "semester", label: "Semester",  iconPath: null, textChipBg: "bg-slate-100", textChipText: "text-slate-700" },
};
