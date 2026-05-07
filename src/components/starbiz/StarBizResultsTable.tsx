// Sunbiz-faithful results table.
// Phase 3: always empty-state. Slice 2 populates real entities.

type EntityRow = {
  documentNumber: string;
  name: string;
  status: string;
  filingType: string;
  filedDate: string;
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
              <tr key={row.documentNumber} style={{ backgroundColor: i % 2 === 1 ? YELLOW : WHITE }}>
                <td style={monoStyle}>{row.documentNumber}</td>
                <td style={{ ...tdStyle, color: "#800000", textDecoration: "underline", cursor: "pointer" }}>{row.name}</td>
                <td style={tdStyle}>{row.status}</td>
                <td style={tdStyle}>{row.filingType}</td>
                <td style={tdStyle}>{row.filedDate}</td>
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
