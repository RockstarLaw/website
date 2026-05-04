export type AppRole = "student" | "professor" | "school_admin" | "admin";

export function getDashboardRouteForRole(role: AppRole) {
  switch (role) {
    case "student":
      return "/dashboard/student";
    case "professor":
      return "/dashboard/professor";
    case "school_admin":
    case "admin":
      return "/dashboard/admin";
    default:
      return "/dashboard/student";
  }
}
