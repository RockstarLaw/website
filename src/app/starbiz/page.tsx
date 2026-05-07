import Link from "next/link";

import { StarBizShell } from "@/components/starbiz/StarBizShell";

const NAVY   = "#003366";
const MAROON = "#800000";
const WHITE  = "#FFFFFF";
const CREAM  = "#F5F0E1";

const sectionHeaderStyle: React.CSSProperties = {
  backgroundColor: NAVY,
  color: WHITE,
  fontFamily: "Times New Roman, Georgia, serif",
  fontSize: "14px",
  fontWeight: "bold",
  padding: "4px 8px",
  marginBottom: "6px",
};

const linkStyle: React.CSSProperties = {
  color: MAROON,
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px",
  display: "block",
  marginBottom: "3px",
};

export default function StarBizHomePage() {
  return (
    <StarBizShell>
      {/* Page title */}
      <div style={{ borderBottom: `2px solid ${NAVY}`, marginBottom: "12px", paddingBottom: "6px" }}>
        <h1 style={{ fontFamily: "Times New Roman, Georgia, serif", fontSize: "20px", fontWeight: "bold", color: NAVY, margin: 0 }}>
          Welcome to RockStar StarBiz
        </h1>
        <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: "#555", marginTop: "3px" }}>
          Florida Division of Corporations — Educational Simulation
        </p>
      </div>

      {/* Two-column quick-access layout */}
      <table cellPadding={0} cellSpacing={8} style={{ width: "100%" }}>
        <tbody>
          <tr style={{ verticalAlign: "top" }}>

            {/* Search Records */}
            <td style={{ width: "48%", backgroundColor: CREAM, border: `1px solid #999`, padding: "8px" }}>
              <div style={sectionHeaderStyle}>Search Records</div>
              <Link href="/starbiz/search/by-name"             style={linkStyle}>› Entity Name</Link>
              <Link href="/starbiz/search/by-document-number"  style={linkStyle}>› Document Number</Link>
              <Link href="/starbiz/search/by-officer"          style={linkStyle}>› Officer / Registered Agent Name</Link>
              <Link href="/starbiz/search/by-fei"              style={linkStyle}>› FEI / EIN Number</Link>
              <Link href="/starbiz/search/by-fictitious-owner" style={linkStyle}>› Fictitious Name Owner</Link>
              <Link href="/starbiz/search/by-trademark"        style={linkStyle}>› Trademark Name</Link>
              <Link href="/starbiz/search/by-trademark-owner"  style={linkStyle}>› Trademark Owner Name</Link>
            </td>

            {/* E-Filing */}
            <td style={{ width: "48%", backgroundColor: CREAM, border: `1px solid #999`, padding: "8px" }}>
              <div style={sectionHeaderStyle}>E-Filing Services</div>
              <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: "#666", marginBottom: "6px" }}>
                Online filing available — Slice 2 wires these forms.
              </p>
              <span style={{ ...linkStyle, color: "#888" }}>› LLC Articles of Organization</span>
              <span style={{ ...linkStyle, color: "#888" }}>› Profit Articles of Incorporation</span>
              <span style={{ ...linkStyle, color: "#888" }}>› Non-Profit Articles</span>
              <span style={{ ...linkStyle, color: "#888" }}>› Limited Partnership</span>
              <span style={{ ...linkStyle, color: "#888" }}>› Fictitious Name</span>
              <span style={{ ...linkStyle, color: "#888" }}>› Annual Report</span>
              <span style={{ ...linkStyle, color: "#888" }}>› State Trademark</span>
            </td>

          </tr>
        </tbody>
      </table>

      {/* Disclaimer */}
      <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px", color: "#888", marginTop: "16px", borderTop: "1px solid #ccc", paddingTop: "6px" }}>
        This is a RockStar Law educational simulation. Filings entered here are practice only and have no legal effect.
        Public corpus — all filings are visible to enrolled students and professors.
      </p>
    </StarBizShell>
  );
}
