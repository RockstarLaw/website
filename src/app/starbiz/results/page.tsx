import { StarBizShell } from "@/components/starbiz/StarBizShell";
import { StarBizResultsTable } from "@/components/starbiz/StarBizResultsTable";
import {
  searchByDocumentNumber,
  searchByFei,
  searchByFictitiousOwner,
  searchByName,
  searchByOfficer,
  searchByTrademark,
  searchByTrademarkOwner,
} from "@/lib/starbiz/queries";

export const dynamic = "force-dynamic";

const NAVY = "#003366";

const TYPE_LABELS: Record<string, string> = {
  "by-name":              "Entity Name",
  "by-document-number":   "Document Number",
  "by-officer":           "Officer / Registered Agent Name",
  "by-fei":               "FEI / EIN Number",
  "by-fictitious-owner":  "Fictitious Name Owner",
  "by-trademark":         "Trademark Name",
  "by-trademark-owner":   "Trademark Owner Name",
};

async function runSearch(type: string, q: string, params: Record<string, string | undefined>) {
  switch (type) {
    case "by-name":            return searchByName(q);
    case "by-document-number": return searchByDocumentNumber(q);
    case "by-officer": {
      const combined = [params.q, params.first_name].filter(Boolean).join(" ");
      return searchByOfficer(combined || q);
    }
    case "by-fei":             return searchByFei(q);
    case "by-fictitious-owner":return searchByFictitiousOwner(q);
    case "by-trademark":       return searchByTrademark(q);
    case "by-trademark-owner": return searchByTrademarkOwner(q);
    default:                   return [];
  }
}

export default async function StarBizResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const type   = params.type ?? "by-name";
  const q      = params.q?.trim() ?? "";

  const rows = q ? await runSearch(type, q, params) : [];

  const noQuery   = !q;
  const typeLabel = TYPE_LABELS[type] ?? type;

  return (
    <StarBizShell>
      {/* Results header */}
      <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: "10px", paddingBottom: "4px" }}>
        <h2 style={{ fontFamily: "Times New Roman, Georgia, serif", fontSize: "16px", fontWeight: "bold", color: NAVY, margin: 0 }}>
          Search Results — {typeLabel}
        </h2>
        {q && (
          <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: "#444", marginTop: "3px" }}>
            You searched for: <strong>{q}</strong>
            {rows.length > 0 && ` — ${rows.length} record(s) found`}
          </p>
        )}
      </div>

      {/* Info for always-empty types */}
      {["by-fictitious-owner", "by-trademark", "by-trademark-owner"].includes(type) && (
        <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: "#888", marginBottom: "8px", fontStyle: "italic" }}>
          This search type will return records once Fictitious Name / Trademark filings are available (Slice 4+).
        </p>
      )}

      {/* Results table */}
      {!noQuery ? (
        <StarBizResultsTable rows={rows} />
      ) : (
        <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", color: "#555", fontStyle: "italic" }}>
          Enter a search term above to find records.
        </p>
      )}

      {/* Back links */}
      <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", marginTop: "10px" }}>
        <a href={`/starbiz/search/${type}`} style={{ color: "#800000" }}>← New Search</a>
        &nbsp;&nbsp;
        <a href="/starbiz" style={{ color: "#800000" }}>← StarBiz Home</a>
      </p>
    </StarBizShell>
  );
}
