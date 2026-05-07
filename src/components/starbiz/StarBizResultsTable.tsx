// Sunbiz-faithful results table. Document numbers link to entity detail.

import Link from "next/link";

type EntityRow = {
  document_number: string;
  name: string;
  status: string;
  filing_type: string;
  filed_date: string;
};

const NAVY  = "#003366";
const WHITE = "#FFFFFF";
const YELLOW = "#FFFF99";
const BLACK  = "#000000";

const thStyle: React.CSSProperties = {
  backgroundColor: NAVY,
  color: WHITE,
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "11px",
  fontWeight: "bold",
  padding: "3px 6px",
  border: `1px solid ${BLACK}`,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px",
  padding: "3px 6px",
  border: `1px solid #999`,
};

const monoStyle: React.CSSProperties = {
  ...tdStyle,
  fontFamily: "Courier New, Courier, monospace",
  fontSize: "11px",
};

export type { EntityRow };
export function StarBizResultsTable({ rows = [] }: { rows?: EntityRow[] }) {
  return (
    <div>
      <table
        cellPadding={0}
        cellSpacing={0}
        style={{ borderCollapse: "collapse", width: "100%", border: `1px solid ${BLACK}` }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Document Number</th>
            <th style={thStyle}>Entity Name</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Filing Type</th>
            <th style={thStyle}>Filed Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{
                  ...tdStyle,
                  textAlign: "center",
                  padding: "12px",
                  color: "#444",
                  fontStyle: "italic",
                }}
              >
                No matching records found.
                <span style={{ display: "block", fontSize: "11px", marginTop: "4px", color: "#888" }}>
                  (No entities have been filed yet in this simulation.)
                </span>
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row.document_number} style={{ backgroundColor: i % 2 === 1 ? YELLOW : WHITE }}>
                <td style={monoStyle}>
                  <Link href={`/starbiz/entity/${row.document_number}`} style={{ color: "#800000", textDecoration: "underline" }}>
                    {row.document_number}
                  </Link>
                </td>
                <td style={{ ...tdStyle, color: "#800000" }}>{row.name}</td>
                <td style={tdStyle}>{row.status}</td>
                <td style={tdStyle}>{row.filing_type}</td>
                <td style={tdStyle}>{row.filed_date}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {rows.length > 0 && (
        <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", marginTop: "4px", color: "#444" }}>
          {rows.length} record(s) found.
        </p>
      )}
    </div>
  );
}
