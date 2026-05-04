import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentProfessorDashboardData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function ProfessorDashboardPage() {
  const dashboard = await getCurrentProfessorDashboardData();

  if (!dashboard) {
    return (
      <main>
        <h1>Professor dashboard</h1>
        <p>No active professor session found.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Professor dashboard</h1>
      <p>Professor: {dashboard.professorName}</p>
      <p>Selected university: {dashboard.universityName}</p>
      <p>Onboarding status: {dashboard.onboardingStatus}</p>
      <p>Progress state: {dashboard.progressState}</p>
      <p>Courses created: {dashboard.courseCount}</p>
      <p>Rosters uploaded: {dashboard.rosterCount}</p>
      <SignOutButton />
    </main>
  );
}
