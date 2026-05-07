import { StarBizShell } from "@/components/starbiz/StarBizShell";
import { StarBizResultsTable } from "@/components/starbiz/StarBizResultsTable";

const NAVY = "#003366";

export default async function StarBizResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const type  = params.type ?? "by-name";
  const q     = params.q?.trim() ?? "";

  const typeLabel: Record<string, string> = {
    "by-name":              "Entity Name",
    "by-document-number":   "Document Number",
    "by-officer":           "Officer / RA Name",
    "by-fei":               "FEI / EIN Number",
    "by-fictitious-owner":  "Fictitious Name Owner",
    "by-trademark":         "Trademark Name",
    "by-trademark-owner":   "Trademark Owner Name",
  };

  return (
    <StarBizShell>
      {/* Results header */}
      <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: "10px", paddingBottom: "6px" }}>
        <h2 style={{ fontFamily: "Times New Roman, Georgia, serif", fontSize: "16px", fontWeight: "bold", color: NAVY, margin: 0 }}>
          Search Results — {typeLabel[type] ?? type}
        </h2>
        {q && (
          <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: "#444", marginTop: "3px" }}>
            You searched for: <strong>{q}</strong>
          </p>
        )}
      </div>

      {/* Results table — Phase 3: always empty */}
      <StarBizResultsTable rows={[]} />

      {/* Back link */}
      <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", marginTop: "10px" }}>
        <a href={`/starbiz/search/${type}`} style={{ color: "#800000" }}>
          ← New Search
        </a>
        &nbsp;&nbsp;
        <a href="/starbiz" style={{ color: "#800000" }}>
          ← StarBiz Home
        </a>
      </p>
    </StarBizShell>
  );
}
