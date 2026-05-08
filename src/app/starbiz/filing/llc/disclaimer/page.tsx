/**
 * LLC Disclaimer Page — Retrofit R1
 *
 * Matches the real Sunbiz disclaimer page (efile.sunbiz.org/llc_file.html)
 * captured in Florida_Sunbiz_website/3_Step_3_2_SUNBIZ FILING AN LLC/
 * 2_Articles of Organization for Florida Limited Liability Company - Sunbiz.html
 *
 * Two-column layout:
 *   LEFT  — "File Articles of Organization" → posts to /starbiz/filing/llc/form (Phase R2)
 *   RIGHT — "Correct Articles of Organization" → placeholder only, deferred
 *
 * DO NOT import or touch /starbiz/filing/llc/page.tsx.
 * The existing 4-step wizard stays functional during the retrofit.
 */

import { StarBizShell } from "@/components/starbiz/StarBizShell";

// ─── Style constants ────────────────────────────────────────────────────────────

const NAVY   = "#003366";
const MAROON = "#800000";
const WHITE  = "#FFFFFF";
const CREAM  = "#FFFFF0";

const sPageTitle: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "16px",
  fontWeight: "bold",
  color: NAVY,
  marginBottom: "10px",
  marginTop: "4px",
};

const sDisclaimerBox: React.CSSProperties = {
  border: "1px solid #999",
  backgroundColor: CREAM,
  padding: "8px 12px",
  marginBottom: "14px",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px",
};

const sDisclaimerHeading: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "13px",
  fontWeight: "bold",
  color: NAVY,
  marginBottom: "6px",
  marginTop: "2px",
};

const sListItem: React.CSSProperties = {
  marginBottom: "5px",
  lineHeight: "1.5",
};

const sColumnHeading: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "13px",
  fontWeight: "bold",
  color: MAROON,
  marginBottom: "8px",
};

const sBodyText: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px",
  color: "#333",
  lineHeight: "1.5",
};

const sLabel: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px",
  fontWeight: "bold",
  color: "#333",
  padding: "3px 8px 3px 0",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

const sInput: React.CSSProperties = {
  border: "1px solid #666",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px",
  padding: "2px 4px",
};

const sBtn: React.CSSProperties = {
  backgroundColor: WHITE,
  border: "2px outset #aaa",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px",
  padding: "3px 12px",
  cursor: "pointer",
};

const sBtnDisabled: React.CSSProperties = {
  ...sBtn,
  cursor: "not-allowed",
  color: "#999",
};

const sDivider: React.CSSProperties = {
  borderLeft: "1px solid #ccc",
  margin: "0 18px",
  alignSelf: "stretch",
};

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function LLCDisclaimerPage() {
  return (
    <StarBizShell>

      {/* ── Page title ────────────────────────────────────────────────── */}
      <h1 style={sPageTitle}>
        Articles of Organization for Florida Limited Liability Company
      </h1>

      {/* ── Disclaimer ───────────────────────────────────────────────── */}
      <div style={sDisclaimerBox}>
        <h3 style={sDisclaimerHeading}>Disclaimer</h3>
        <ul style={{ margin: "0", paddingLeft: "20px" }}>
          <li style={sListItem}>
            <strong>
              This form creates a Florida Limited Liability Company OR corrects
              your rejected online filing.
            </strong>
          </li>
          <li style={sListItem}>
            Review and verify your information for accuracy. Once submitted, the
            Articles of Organization cannot be changed, removed, canceled or
            refunded.
          </li>
          <li style={sListItem}>
            Review the{" "}
            <a
              href="#"
              style={{ color: MAROON }}
              title="Phase R-future: will link to hosted instructions PDF"
            >
              instructions for filing the Articles of Organization for Florida
              Limited Liability Company
            </a>
            .
          </li>
        </ul>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0,
          border: "1px solid #ccc",
          padding: "14px",
          backgroundColor: WHITE,
        }}
      >

        {/* LEFT — File Articles of Organization */}
        <div style={{ flex: "0 0 auto", minWidth: "340px" }}>
          <h3 style={sColumnHeading}>File Articles of Organization</h3>

          {/*
           * Form posts to /starbiz/filing/llc/form (Phase R2).
           * Returns 404 until R2 ships — that is expected and acceptable for R1.
           * The `required` attribute on the checkbox enforces HTML5 validation
           * so the browser prevents submission if unchecked.
           */}
          <form
            action="/starbiz/filing/llc/form"
            method="get"
            style={{ margin: 0 }}
          >
            <p style={{ ...sBodyText, marginBottom: "10px" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="Disclaimer"
                  value="accept"
                  required
                  style={{ marginTop: "3px", flexShrink: 0 }}
                />
                <span>
                  I have read and accept the terms of this disclaimer and
                  acknowledge receipt of the{" "}
                  <a
                    href="#"
                    style={{ color: MAROON }}
                    title="Phase R-future: will link to filing information page"
                  >
                    filing information
                  </a>{" "}
                  provided.
                </span>
              </label>
            </p>

            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <input type="submit" value="Start New Filing" style={sBtn} />
            </div>
          </form>
        </div>

        {/* Vertical divider */}
        <div style={sDivider} />

        {/* RIGHT — Correct Articles of Organization */}
        {/*
         * Correction flow not implemented yet — placeholder layout only.
         * Phase R-future: wire to correction/amendment workflow.
         */}
        <div style={{ flex: "1 1 auto", paddingLeft: "4px" }}>
          <h3 style={sColumnHeading}>Correct Articles of Organization</h3>

          <p style={{ ...sBodyText, marginBottom: "10px", color: "#555" }}>
            Enter the tracking number and PIN (supplied in the rejection email)
            and click &ldquo;Update Filing&rdquo;.
          </p>

          <table cellPadding={0} cellSpacing={0}>
            <tbody>
              <tr>
                <td style={sLabel}>
                  <label htmlFor="track_number">Tracking Number:</label>
                </td>
                <td style={{ padding: "3px 0" }}>
                  <input
                    type="text"
                    id="track_number"
                    name="track_number"
                    size={12}
                    maxLength={12}
                    disabled
                    style={{ ...sInput, color: "#aaa", backgroundColor: "#f5f5f5" }}
                  />
                </td>
              </tr>
              <tr>
                <td style={sLabel}>
                  <label htmlFor="pin_number">PIN:</label>
                </td>
                <td style={{ padding: "3px 0" }}>
                  <input
                    type="text"
                    id="pin_number"
                    name="pin_number"
                    size={4}
                    maxLength={4}
                    disabled
                    style={{ ...sInput, color: "#aaa", backgroundColor: "#f5f5f5" }}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ paddingTop: "8px" }}>
                  <button type="button" disabled style={sBtnDisabled}>
                    Update Filing
                  </button>
                  <span
                    style={{
                      fontFamily: "Arial",
                      fontSize: "10px",
                      color: "#888",
                      marginLeft: "8px",
                      fontStyle: "italic",
                    }}
                  >
                    (not available — deferred)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </StarBizShell>
  );
}
