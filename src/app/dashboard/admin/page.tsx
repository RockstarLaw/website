import { SignOutButton } from "@/components/sign-out-button";
import { getAdminDashboardData } from "@/lib/supabase/queries";

function formatPersonName(parts: {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
}) {
  return [parts.first_name, parts.middle_name, parts.last_name].filter(Boolean).join(" ");
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <main>
      <h1>Admin dashboard</h1>

      <section>
        <h2>System totals</h2>
        <ul>
          <li>Total students: {dashboard.counts.totalStudents}</li>
          <li>Total professors: {dashboard.counts.totalProfessors}</li>
          <li>Total schools: {dashboard.counts.totalSchools}</li>
          <li>Total rosters: {dashboard.counts.totalRosters}</li>
          <li>Total matches: {dashboard.counts.totalMatches}</li>
        </ul>
      </section>

      <section>
        <h2>Problem queues</h2>
        <ul>
          <li>Unmatched students: {dashboard.counts.unmatchedStudents}</li>
          <li>Pending matches: {dashboard.counts.pendingMatches}</li>
          <li>Placeholder schools: {dashboard.counts.placeholderSchools}</li>
        </ul>
      </section>

      <section>
        <h2>Unmatched students</h2>
        <ul>
          {dashboard.queues.unmatchedStudents.map((item) => {
            const entry = item.roster_entries?.[0] ?? null;
            const roster = entry?.rosters?.[0] ?? null;
            const professor = item.professor_profiles?.[0] ?? null;
            const school = item.schools?.[0] ?? null;
            return (
              <li key={item.id}>
                <div>Roster entry: {entry ? formatPersonName(entry) : "Unknown"}</div>
                <div>Professor: {professor ? formatPersonName(professor) : "Unknown"}</div>
                <div>School: {school?.name ?? "Unknown"}</div>
                <div>Roster: {roster?.roster_name ?? "Unknown"}</div>
                <div>Roster status: {roster?.status ?? "Unknown"}</div>
                <div>Match status: {item.match_status}</div>
                <div>Reason: {item.match_reason ?? ""}</div>
                <div>Confidence: {item.confidence_score ?? 0}</div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2>Pending matches</h2>
        <ul>
          {dashboard.queues.pendingMatches.map((item) => {
            const entry = item.roster_entries?.[0] ?? null;
            const roster = entry?.rosters?.[0] ?? null;
            const professor = item.professor_profiles?.[0] ?? null;
            const student = item.student_profiles?.[0] ?? null;
            const school = item.schools?.[0] ?? null;
            return (
              <li key={item.id}>
                <div>Roster entry: {entry ? formatPersonName(entry) : "Unknown"}</div>
                <div>Matched student: {student ? formatPersonName(student) : "None"}</div>
                <div>Professor: {professor ? formatPersonName(professor) : "Unknown"}</div>
                <div>School: {school?.name ?? "Unknown"}</div>
                <div>Roster: {roster?.roster_name ?? "Unknown"}</div>
                <div>Roster status: {roster?.status ?? "Unknown"}</div>
                <div>Match status: {item.match_status}</div>
                <div>Reason: {item.match_reason ?? ""}</div>
                <div>Confidence: {item.confidence_score ?? 0}</div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2>Placeholder schools</h2>
        <ul>
          {dashboard.queues.placeholderSchools.map((school) => (
            <li key={school.id}>
              <div>School: {school.name}</div>
              <div>Status: {school.status}</div>
              <div>
                Address: {school.address_line_1}, {school.city}, {school.state} {school.postal_code}, {school.country}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <SignOutButton />
    </main>
  );
}
