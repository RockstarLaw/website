export const accountTypes = [
  {
    slug: "student",
    title: "Student",
    description:
      "Register as a law student, select your university, choose professors, and track onboarding status.",
    href: "/register/student",
  },
  {
    slug: "professor",
    title: "Professor",
    description:
      "Register as a professor, connect to a university, manage courses, and upload rosters.",
    href: "/register/professor",
  },
  {
    slug: "school",
    title: "University / School",
    description:
      "Request school onboarding, create a placeholder school, or submit a registration request for review.",
    href: "/register/school",
  },
] as const;

export const onboardingStatuses = [
  "started",
  "incomplete",
  "complete",
  "needs_review",
] as const;

export const schoolStatuses = [
  "placeholder",
  "pending_review",
  "registered",
  "rejected",
] as const;

export const professorApprovalStatuses = [
  "pending",
  "approved",
  "rejected",
] as const;

export const rosterStatuses = ["draft", "active", "archived"] as const;

export const matchStatuses = [
  "auto_matched",
  "needs_review",
  "confirmed",
  "rejected",
  "no_match",
] as const;

export const primaryRoutes = [
  { label: "Home", href: "/" },
  { label: "About RockStar Law", href: "/about" },
  { label: "Project Shop", href: "/project-shop" },
  { label: "Pricing", href: "/get-started" },
  { label: "For Universities", href: "/register/school" },
  { label: "Log In", href: "/login" },
] as const;
