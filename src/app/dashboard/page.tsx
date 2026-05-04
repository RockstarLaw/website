import { redirect } from "next/navigation";

import { getDashboardRouteForRole } from "@/lib/auth/roles";
import { getCurrentAppUserRole } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DashboardIndexPage() {
  const role = await getCurrentAppUserRole();

  if (!role) {
    redirect("/login");
  }

  redirect(getDashboardRouteForRole(role));
}
