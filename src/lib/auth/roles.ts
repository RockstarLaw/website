export type AppRole = "student" | "professor" | "university" | "admin";

export function getDashboardRouteForRole(role: AppRole) {
  switch (role) {
    case "student":
      return "/dashboard/student";
    case "professor":
      return "/dashboard/professor";
    case "university":
      return "/dashboard/university";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/dashboard/student";
  }
}
