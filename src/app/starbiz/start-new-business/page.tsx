import Link from "next/link";

import { StarBizShell } from "@/components/starbiz/StarBizShell";

const NAVY   = "#003366";
const MAROON = "#800000";
const WHITE  = "#FFFFFF";

const FILING_TYPES = [
  {
    label:       "Limited Liability Company (LLC)",
    description: "File Articles of Organization — Form LLC-1",
    fee:         "$125.00",
    href:        "/starbiz/filing/llc",
    active:      true,
  },
  {
    label:       "Profit Corporation",
    description: "File Articles of Incorporation — Form CR2E022",
    fee:         "$70.00",
    href:        "/starbiz/filing/profit-corp",
    active:      true,
  },
  {
    label:       "Non-Profit Corporation",
    description: "File Articles of Incorporation — Form CR2E028",
    fee:         "$70.00",
    href:        null,
    active:      false,
  },
  {
    label:       "Limited Partnership",
    description: "File Certificate of Limited Partnership — Form LP-1",
    fee:         "$965.00",
    href:        null,
    active:      false,
  },
  {
    label:       "Fictitious Name Registration (DBA)",
    description: "Register a Fictitious Name — Form DR-1",
    fee:         "$50.00",
    href:        null,
    active:      false,
  },
  {
    label:       "Annual Report",
    description: "File an Annual Report for an existing entity",
    fee:         "$138.75",
    href:        null,
    active:      false,
  },
  {
    label:       "State Trademark Application",
    description: "Register a Florida trademark — Form TM-1",
    fee:         "$87.50",
    href:        null,
    active:      false,
  },
];

export default function StartNewBusinessPage() {
  return (
    <StarBizShell>
      {/* Page header */}
      <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: "12px", paddingBottom: "4px" }}>
        <h1 style={{ fontFamily: "Times New Roman, Georgia, serif", fontSize: "18px", fontWeight: "bold", color: NAVY, margin: 0 }}>
          E-Filing Services
        </h1>
        <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: "#555", marginTop: "3px" }}>
          Choose the type of filing below. Applicable fees are listed per transaction.
        </p>
      </div>

      {/* Filing type table */}
      <table
        cellPadding={0}
        cellSpacing={0}
        style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}
      >
        <thead>
          <tr style={{ backgroundColor: NAVY, color: WHITE }}>
            <th style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontWeight: "bold", padding: "4px 8px", border: "1px solid #000", textAlign: "left" }}>
              Filing Type
            </th>
            <th style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontWeight: "bold", padding: "4px 8px", border: "1px solid #000", textAlign: "left" }}>
              Description
            </th>
            <th style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontWeight: "bold", padding: "4px 8px", border: "1px solid #000", textAlign: "center", whiteSpace: "nowrap" }}>
              Fee
            </th>
            <th style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontWeight: "bold", padding: "4px 8px", border: "1px solid #000", textAlign: "center" }}>
              File Online
            </th>
          </tr>
        </thead>
        <tbody>
          {FILING_TYPES.map((ft, i) => (
            <tr key={ft.label} style={{ backgroundColor: i % 2 === 1 ? "#FFFF99" : WHITE }}>
              <td style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", padding: "6px 8px", border: "1px solid #999", color: ft.active ? MAROON : "#666", fontWeight: ft.active ? "bold" : "normal" }}>
                {ft.label}
              </td>
              <td style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", padding: "6px 8px", border: "1px solid #999", color: ft.active ? "#000" : "#888" }}>
                {ft.description}
              </td>
              <td style={{ fontFamily: "Courier New, Courier, monospace", fontSize: "12px", padding: "6px 8px", border: "1px solid #999", textAlign: "center", color: ft.active ? "#000" : "#888" }}>
                {ft.fee}
              </td>
              <td style={{ padding: "6px 8px", border: "1px solid #999", textAlign: "center" }}>
                {ft.active && ft.href ? (
                  <Link
                    href={ft.href}
                    style={{ backgroundColor: NAVY, color: WHITE, padding: "2px 12px", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", fontWeight: "bold", textDecoration: "none", display: "inline-block" }}
                  >
                    File Now
                  </Link>
                ) : (
                  <span style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px", color: "#999", fontStyle: "italic" }}>
                    Coming soon
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px", color: "#888", marginTop: "10px" }}>
        Fees listed above match the real Florida Division of Corporations fee schedule and are displayed for simulation purposes only. No actual charges are made.
      </p>
    </StarBizShell>
  );
}
