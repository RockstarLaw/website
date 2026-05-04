import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentStudentDashboardData } from "@/lib/supabase/queries";

function getAddressValue(address: Record<string, unknown> | null, key: string) {
  const value = address?.[key];
  return typeof value === "string" ? value : "";
}

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const dashboard = await getCurrentStudentDashboardData();

  if (!dashboard) {
    return (
      <main>
        <h1>Student dashboard</h1>
        <p>No active student session found.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Student dashboard</h1>
      <p>Student: {dashboard.studentName}</p>
      <p>Selected university: {dashboard.universityName}</p>
      <p>Onboarding status: {dashboard.onboardingStatus}</p>
      <p>Progress state: {dashboard.progressState}</p>
      <p>
        University address: {getAddressValue(dashboard.universityAddress, "address_line_1")}{" "}
        {getAddressValue(dashboard.universityAddress, "city")} {getAddressValue(dashboard.universityAddress, "state")}{" "}
        {getAddressValue(dashboard.universityAddress, "postal_code")}
      </p>

      <section>
        <h2>Selected professor(s)</h2>
        {dashboard.professors.length ? (
          <ul>
            {dashboard.professors.map((item) => (
              <li key={item.professorId}>
                <div>Professor: {item.professorName}</div>
                <div>Course name: {item.courseName}</div>
                <div>Roster status: {item.rosterStatus}</div>
                <div>Match status: {item.matchStatus}</div>
                <div>Dashboard status: {item.dashboardStatus}</div>
                <div>Reason: {item.matchReason}</div>
                <div>Confidence: {item.confidenceScore}</div>
                <div>{item.message}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No professors selected yet.</p>
        )}
      </section>

      <SignOutButton />
    </main>
  );
}
