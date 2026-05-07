import Link from "next/link";
import { notFound } from "next/navigation";

import { StarBizShell } from "@/components/starbiz/StarBizShell";
import { PdfViewButton } from "@/components/starbiz/PdfViewButton";
import { entityTypeLabel, formatDate, getEntityByDocumentNumber } from "@/lib/starbiz/queries";
import { regenerateFilingPdf } from "@/lib/starbiz/actions/regenerate-pdf";

export const dynamic = "force-dynamic";

// ─── Style constants ───────────────────────────────────────────────────────────

const NAVY   = "#003366";
const MAROON = "#800000";
const WHITE  = "#FFFFFF";
const YELLOW = "#FFFF99";
const BLACK  = "#000000";

const sHeader: React.CSSProperties = {
  backgroundColor: NAVY, color: WHITE,
  fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontWeight: "bold",
  padding: "3px 8px", marginTop: "10px", marginBottom: 0,
};
const sTd: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px",
  padding: "3px 6px", verticalAlign: "top", borderBottom: "1px solid #ddd",
};
const sLabel: React.CSSProperties = { ...sTd, color: NAVY, fontStyle: "italic", width: "180px", whiteSpace: "nowrap" };
const thStyle: React.CSSProperties = {
  backgroundColor: NAVY, color: WHITE, fontFamily: "Arial", fontSize: "11px",
  fontWeight: "bold", padding: "3px 6px", border: `1px solid ${BLACK}`, textAlign: "left",
};
const tdBorder: React.CSSProperties = { ...sTd, border: `1px solid #999`, borderBottom: `1px solid #999` };
const monoTd: React.CSSProperties = { ...tdBorder, fontFamily: "Courier New, Courier, monospace", fontSize: "11px" };

function formatAddr(addr: { street?: string; city?: string; state?: string; zip?: string } | null): string {
  if (!addr) return "N/A";
  return [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
}

// ─── Page ──────────────────────────────────────────────────────────────────────

async function handleRetry(formData: FormData) {
  "use server";
  const entityId = formData.get("entityId") as string;
  await regenerateFilingPdf(entityId);
}

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ document_number: string }>;
}) {
  const { document_number } = await params;
  const entity = await getEntityByDocumentNumber(document_number);
  if (!entity) notFound();

  const filedDate     = formatDate(entity.filed_at);
  const effectiveDate = formatDate(entity.effective_date);
  const hasDifferentMailing = JSON.stringify(entity.principal_address) !== JSON.stringify(entity.mailing_address);
  const lastEvent     = "LIMITED LIABILITY COMPANY FILING"; // Phase 2.3: always formation

  return (
    <StarBizShell>

      {/* ── Detail banner ─────────────────────────────────────────────── */}
      <div style={{ ...sHeader, marginTop: 0, fontSize: "13px" }}>
        Detail by Entity Name
      </div>

      {/* ── Entity header block ───────────────────────────────────────── */}
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%", border: `1px solid ${BLACK}`, borderTop: "none" }}>
        <tbody>
          <tr>
            <td colSpan={4} style={{ ...sTd, fontFamily: "Times New Roman, Georgia, serif", fontSize: "16px", fontWeight: "bold", color: NAVY, paddingTop: "8px", paddingBottom: "6px", borderBottom: `2px solid ${NAVY}` }}>
              {entity.name}
            </td>
          </tr>
          <tr style={{ backgroundColor: "#F5F0E1" }}>
            <td style={sLabel}>DOCUMENT NUMBER</td>
            <td style={{ ...sTd, fontFamily: "Courier New, Courier, monospace", fontSize: "12px" }}>{entity.document_number}</td>
            <td style={sLabel}>FEI/EIN NUMBER</td>
            <td style={sTd}>{entity.fei_ein ?? "NONE"}</td>
          </tr>
          <tr>
            <td style={sLabel}>DATE FILED</td>
            <td style={sTd}>{filedDate}</td>
            <td style={sLabel}>EFFECTIVE DATE</td>
            <td style={sTd}>{effectiveDate === filedDate ? "NONE" : effectiveDate}</td>
          </tr>
          <tr style={{ backgroundColor: "#F5F0E1" }}>
            <td style={sLabel}>STATE</td>
            <td style={sTd}>FL</td>
            <td style={sLabel}>STATUS</td>
            <td style={{ ...sTd, color: entity.status === "active" ? "#2E7D32" : MAROON, fontWeight: "bold" }}>
              {entity.status.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td style={sLabel}>LAST EVENT</td>
            <td style={sTd}>{lastEvent}</td>
            <td style={sLabel}>DATE LAST EVENT</td>
            <td style={sTd}>{filedDate}</td>
          </tr>
          <tr style={{ backgroundColor: "#F5F0E1" }}>
            <td style={sLabel}>FILING TYPE</td>
            <td colSpan={3} style={sTd}>{entityTypeLabel(entity.entity_type)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Principal Address ─────────────────────────────────────────── */}
      <div style={sHeader}>Principal Address</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%", border: `1px solid ${BLACK}`, borderTop: "none" }}>
        <tbody>
          <tr><td style={sLabel}>STREET</td><td style={sTd}>{entity.principal_address?.street ?? "N/A"}</td></tr>
          <tr style={{ backgroundColor: "#F5F0E1" }}><td style={sLabel}>CITY</td><td style={sTd}>{entity.principal_address?.city ?? "N/A"}</td></tr>
          <tr><td style={sLabel}>STATE</td><td style={sTd}>{entity.principal_address?.state ?? "N/A"}</td></tr>
          <tr style={{ backgroundColor: "#F5F0E1" }}><td style={sLabel}>ZIP</td><td style={sTd}>{entity.principal_address?.zip ?? "N/A"}</td></tr>
        </tbody>
      </table>

      {/* ── Mailing Address ───────────────────────────────────────────── */}
      <div style={sHeader}>Mailing Address</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%", border: `1px solid ${BLACK}`, borderTop: "none" }}>
        <tbody>
          {hasDifferentMailing ? (
            <>
              <tr><td style={sLabel}>STREET</td><td style={sTd}>{entity.mailing_address?.street ?? "N/A"}</td></tr>
              <tr style={{ backgroundColor: "#F5F0E1" }}><td style={sLabel}>CITY</td><td style={sTd}>{entity.mailing_address?.city ?? "N/A"}</td></tr>
              <tr><td style={sLabel}>STATE</td><td style={sTd}>{entity.mailing_address?.state ?? "N/A"}</td></tr>
              <tr style={{ backgroundColor: "#F5F0E1" }}><td style={sLabel}>ZIP</td><td style={sTd}>{entity.mailing_address?.zip ?? "N/A"}</td></tr>
            </>
          ) : (
            <tr><td colSpan={2} style={{ ...sTd, fontStyle: "italic", color: "#555" }}>Mailing Address Same as Principal Address</td></tr>
          )}
        </tbody>
      </table>

      {/* ── Registered Agent ──────────────────────────────────────────── */}
      <div style={sHeader}>Registered Agent Name &amp; Address</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%", border: `1px solid ${BLACK}`, borderTop: "none" }}>
        <tbody>
          <tr><td style={sLabel}>NAME</td><td style={sTd}>{entity.registered_agent_name ?? "N/A"}</td></tr>
          <tr style={{ backgroundColor: "#F5F0E1" }}><td style={sLabel}>STREET</td><td style={sTd}>{entity.registered_agent_address?.street ?? "N/A"}</td></tr>
          <tr><td style={sLabel}>CITY</td><td style={sTd}>{entity.registered_agent_address?.city ?? "N/A"}</td></tr>
          <tr style={{ backgroundColor: "#F5F0E1" }}><td style={sLabel}>STATE</td><td style={sTd}>{entity.registered_agent_address?.state ?? "N/A"}</td></tr>
          <tr><td style={sLabel}>ZIP</td><td style={sTd}>{entity.registered_agent_address?.zip ?? "N/A"}</td></tr>
        </tbody>
      </table>

      {/* ── Authorized Persons ────────────────────────────────────────── */}
      <div style={sHeader}>Authorized Person(s) Detail</div>
      {entity.officers.length > 0 ? (
        <table cellPadding={0} cellSpacing={0} style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${BLACK}` }}>
          <thead>
            <tr>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Address</th>
            </tr>
          </thead>
          <tbody>
            {entity.officers.map((o, i) => (
              <tr key={o.id} style={{ backgroundColor: i % 2 === 1 ? YELLOW : WHITE }}>
                <td style={tdBorder}>{o.title}</td>
                <td style={tdBorder}>{o.name}</td>
                <td style={tdBorder}>{formatAddr(o.address)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ fontFamily: "Arial", fontSize: "11px", color: "#888", padding: "4px 0", fontStyle: "italic" }}>
          No authorized persons on record.
        </p>
      )}

      {/* ── Annual Reports ────────────────────────────────────────────── */}
      <div style={sHeader}>Annual Reports</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${BLACK}` }}>
        <thead>
          <tr>
            <th style={thStyle}>Year</th>
            <th style={thStyle}>Filed Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2} style={{ ...sTd, textAlign: "center", fontStyle: "italic", color: "#888" }}>
              No annual reports filed yet.
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Document Images ───────────────────────────────────────────── */}
      <div style={sHeader}>Document Images</div>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${BLACK}` }}>
        <thead>
          <tr>
            <th style={thStyle}>Doc Number</th>
            <th style={thStyle}>View Doc</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Effective Date</th>
            <th style={thStyle}>Filed</th>
          </tr>
        </thead>
        <tbody>
          {entity.filings.length > 0 ? (
            entity.filings.map((f, i) => {
              const doc = entity.filing_documents.find(d => d.filing_id === f.id);
              return (
                <tr key={f.id} style={{ backgroundColor: i % 2 === 1 ? YELLOW : WHITE }}>
                  <td style={monoTd}>{entity.document_number}</td>
                  <td style={tdBorder}>
                    {doc ? (
                      <PdfViewButton filingDocumentId={doc.id} label="View" />
                    ) : (
                      <form action={handleRetry} style={{ display: "inline" }}>
                        <input type="hidden" name="entityId" value={entity.id} />
                        <button
                          type="submit"
                          style={{
                            fontFamily: "Arial, Helvetica, sans-serif",
                            fontSize: "11px",
                            color: "#800000",
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          Retry
                        </button>
                      </form>
                    )}
                  </td>
                  <td style={tdBorder}>
                    {f.filing_type === "formation" ? "ARTICLES OF ORGANIZATION" : f.filing_type.toUpperCase()}
                  </td>
                  <td style={tdBorder}>{formatDate(f.effective_date ?? f.filed_at)}</td>
                  <td style={tdBorder}>{formatDate(f.filed_at)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} style={{ ...sTd, textAlign: "center", fontStyle: "italic", color: "#888" }}>
                No documents on record.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <div style={{ marginTop: "14px", fontFamily: "Arial", fontSize: "11px" }}>
        <Link href="/starbiz" style={{ color: MAROON }}>← Return to StarBiz Home</Link>
        &nbsp;&nbsp;
        <Link href="/starbiz/search/by-name" style={{ color: MAROON }}>Search Records</Link>
      </div>
    </StarBizShell>
  );
}
