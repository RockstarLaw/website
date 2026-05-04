import {
  confirmMatchAction,
  manualLinkMatchAction,
  rejectMatchAction,
} from "@/lib/matching/actions";
import {
  getProfessorMatchReviewData,
  type ProfessorMatchReviewItem,
} from "@/lib/supabase/queries";

function formatPersonName(parts: {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
}) {
  return [parts.first_name, parts.middle_name, parts.last_name].filter(Boolean).join(" ");
}

function MatchRow({
  item,
  allStudents,
}: {
  item: ProfessorMatchReviewItem;
  allStudents: Awaited<ReturnType<typeof getProfessorMatchReviewData>>["students"];
}) {
  const entry = item.roster_entries?.[0] ?? null;
  const matchedStudent = item.student_profiles?.[0] ?? null;
  const roster = entry?.rosters?.[0] ?? null;
  const candidateStudents = allStudents.filter((student) => student.university_id === item.school_id);

  if (!entry) {
    return null;
  }

  return (
    <li>
      <div>Roster: {roster?.roster_name ?? "Unknown roster"}</div>
      <div>Roster entry: {formatPersonName(entry)}</div>
      <div>Matched student: {matchedStudent ? formatPersonName(matchedStudent) : "None"}</div>
      <div>Status: {item.match_status}</div>
      <div>Reason: {item.match_reason ?? ""}</div>
      <div>Confidence: {item.confidence_score ?? 0}</div>

      <div>
        <form action={confirmMatchAction}>
          <input type="hidden" name="matchId" value={item.id} />
          <button type="submit">Confirm match</button>
        </form>

        <form action={rejectMatchAction}>
          <input type="hidden" name="matchId" value={item.id} />
          <button type="submit">Reject match</button>
        </form>

        <form action={manualLinkMatchAction}>
          <input type="hidden" name="matchId" value={item.id} />
          <select name="studentId" required defaultValue={matchedStudent?.id ?? ""}>
            <option value="" disabled>
              Select student
            </option>
            {candidateStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {formatPersonName(student)}
              </option>
            ))}
          </select>
          <button type="submit">Manual link</button>
        </form>
      </div>
    </li>
  );
}

export const dynamic = "force-dynamic";

export default async function ProfessorMatchesPage() {
  const { matches, students } = await getProfessorMatchReviewData();

  const groups = {
    auto_matched: matches.filter((item) => item.match_status === "auto_matched"),
    needs_review: matches.filter((item) => item.match_status === "needs_review"),
    no_match: matches.filter((item) => item.match_status === "no_match"),
  };

  return (
    <main>
      <h1>Professor match review dashboard</h1>

      <section>
        <h2>auto_matched</h2>
        <ul>
          {groups.auto_matched.map((item) => (
            <MatchRow key={item.id} item={item} allStudents={students} />
          ))}
        </ul>
      </section>

      <section>
        <h2>needs_review</h2>
        <ul>
          {groups.needs_review.map((item) => (
            <MatchRow key={item.id} item={item} allStudents={students} />
          ))}
        </ul>
      </section>

      <section>
        <h2>no_match</h2>
        <ul>
          {groups.no_match.map((item) => (
            <MatchRow key={item.id} item={item} allStudents={students} />
          ))}
        </ul>
      </section>
    </main>
  );
}
