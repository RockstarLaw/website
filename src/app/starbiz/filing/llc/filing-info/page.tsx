/**
 * LLC Formation — Filing-Info Interstitial (Retrofit R4 — recovery)
 * Shared infrastructure for all formation filings.
 *
 * Reference: Florida_Sunbiz_website/3_Step_3_2_SUNBIZ FILING AN LLC/
 *            5_sunbiz.org - Florida Department of State.html
 *            (saved from corefile.exe)
 *
 * Sits between Review (R3) and Payment (R5) in the Sunbiz chain:
 *   disclaimer → form → review → [filing-info] → payment → receipt
 *
 * First visit:  generates a display tracking number from the session UUID,
 *               writes it to filing_sessions.tracking_number, and shows it.
 * Repeat visit: reads the already-stored tracking number.
 *
 * Route:  /starbiz/filing/llc/filing-info?session=<uuid>
 * Source: /starbiz/filing/llc/review?session=<uuid>    (R3 Continue button)
 * Next:   /starbiz/filing/llc/payment?session=<uuid>   (R5 — already live)
 *
 * Shared: per-type labels and fees come from FILING_CONFIG.
 *         Adding Profit Corp / Non-Profit / LP = one new row there, no
 *         structural changes to this page.
 */

import type { CSSProperties } from "react";
import { notFound, redirect } from "next/navigation";

import { StarBizShell } from "@/components/starbiz/StarBizShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Per-filing-type configuration ───────────────────────────────────────────
// Extend here for Corp / Non-Profit / LP — no structural page changes needed.

type FilingConfig = {
  /**
   * Used in the page title: "{filingInfoTitle} Online Filing Information".
   * Matches the real Sunbiz corefile.exe heading (includes "Florida" prefix).
   */
  filingInfoTitle: string;
  /** Base filing fee in USD (before optional add-ons). */
  baseFee: number;
};

const FILING_CONFIG: Record<string, FilingConfig> = {
  llc: {
    filingInfoTitle: "Florida Limited Liability Company",
    baseFee: 125.0,
  },
  "profit-corp": {
    filingInfoTitle: "Florida Profit Corporation",
    baseFee: 125.0,
  },
  "non-profit": {
    filingInfoTitle: "Florida Non-Profit Corporation",
    baseFee: 70.0,
  },
  lp: {
    filingInfoTitle: "Florida Limited Partnership",
    baseFee: 125.0,
  },
};

const DEFAULT_CONFIG = FILING_CONFIG["llc"];

// Optional add-on fees (same across all types — real Sunbiz schedule)
const FEE_CERT_OF_STATUS = 5.0;
const FEE_CERTIFIED_COPY  = 30.0;

// ─── Style constants (faithful to Sunbiz CSS) ─────────────────────────────────

const F = "Arial, Helvetica, sans-serif";

const sPageTitle: CSSProperties = {
  fontFamily: F,
  fontSize: "15px",
  fontWeight: "bold",
  color: "#003366",
};

const sLabel: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  fontStyle: "italic",
  whiteSpace: "nowrap",
  paddingRight: "6px",
  verticalAlign: "middle",
};

/** .efiledata — tracking number and charge value cells */
const sEfileData: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  fontWeight: "bold",
  verticalAlign: "middle",
};

const sBodyText: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  textAlign: "justify",
};

const sButton: CSSProperties = {
  fontFamily: F,
  fontSize: "13px",
  padding: "3px 18px",
  cursor: "pointer",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function v(fd: Record<string, string>, key: string): string {
  return (fd[key] ?? "").trim();
}

/**
 * Generate a display tracking number from a session UUID.
 * Takes the first 12 hex chars (hyphens stripped, uppercased).
 * Example: "550E8400E29B" from "550e8400-e29b-..."
 *
 * The real sequential document number (L26-XXXXXXXX format) is assigned
 * at receipt time (R6) when the entity is created in the entities table.
 */
function generateTrackingNumber(sessionId: string): string {
  return sessionId.replace(/-/g, "").slice(0, 12).toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FilingInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[] }>;
}) {
  // ── 1. Resolve session ID ──────────────────────────────────────────────────
  const params    = await searchParams;
  const rawSess   = params.session;
  const sessionId = Array.isArray(rawSess) ? rawSess[0] : rawSess;
  if (!sessionId) notFound();

  // ── 2. Auth check ──────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 3. Load filing session ─────────────────────────────────────────────────
  const admin = createSupabaseAdminClient();
  const { data: session } = await admin
    .from("filing_sessions")
    .select("id, filing_type, form_data, tracking_number")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!session) notFound();

  // ── 4. Generate / retrieve tracking number ────────────────────────────────
  let trackingNumber: string = session.tracking_number as string | null ?? "";
  if (!trackingNumber) {
    trackingNumber = generateTrackingNumber(sessionId);
    // Write back — best-effort; display still works even if this UPDATE fails
    await admin
      .from("filing_sessions")
      .update({ tracking_number: trackingNumber, current_step: "filing-info" })
      .eq("id", sessionId);
  }

  // ── 5. Compute charge ─────────────────────────────────────────────────────
  const fd     = (session.form_data ?? {}) as Record<string, string>;
  const config: FilingConfig =
    FILING_CONFIG[session.filing_type as string] ?? DEFAULT_CONFIG;

  let total = config.baseFee;
  if (v(fd, "cos_num_flag")  === "Y") total += FEE_CERT_OF_STATUS;
  if (v(fd, "cert_num_flag") === "Y") total += FEE_CERTIFIED_COPY;
  const totalStr = `$ ${total.toFixed(2)}`;

  // ── 6. Page title ─────────────────────────────────────────────────────────
  const pageTitle = `${config.filingInfoTitle} Online Filing Information`;

  // ── 7. Render ──────────────────────────────────────────────────────────────
  return (
    <StarBizShell>
      <form method="GET" action="/starbiz/filing/llc/payment">
        <input type="hidden" name="session" value={sessionId} />

        <table
          summary="Table is used for page lay out."
          cellPadding={4}
          cellSpacing={2}
        >
          <tbody>

            {/* ══ Page title ══════════════════════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sPageTitle}>{pageTitle}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Document Tracking # ══════════════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>Document Tracking #:</td>
                      <td style={sEfileData}>&nbsp;{trackingNumber}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Charge ════════════════════════════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>The charge for your filing is:</td>
                      <td style={sEfileData}>{totalStr}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Body text (verbatim from capture — spec overrides help desk #) ═ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sBodyText}>
                        Your data entry is now complete and will be placed in a
                        queue and processed by a document examiner on a first in,
                        first out basis.&nbsp;&nbsp;If you feel you may have
                        entered incorrect data, you must use the &ldquo;Back
                        Browser Arrow&rdquo; and return to the first page of data
                        entry.&nbsp;&nbsp;After verifying and correcting the
                        information, be sure to use the &ldquo;Continue&rdquo;
                        button to return back to this page.&nbsp;&nbsp;If all
                        data is entered correctly, proceed to the &ldquo;Payment
                        Page&rdquo; by pressing the &ldquo;Continue&rdquo; button
                        below.
                      </td>
                    </tr>
                    <tr>
                      <td style={sBodyText}>
                        Your document will be examined and filed in the order
                        received by this office.&nbsp;&nbsp;Do not apply for a
                        federal employer identification number (FEI#) until your
                        document has been officially filed and you have received
                        acknowledgment by e-mail from our office.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Help desk ═════════════════════════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sBodyText}>
                        If you have any questions, please contact our Help Desk
                        at (954) 426-6424.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Continue button → Payment (R5, already live) ══════════════════ */}
            <tr>
              <td>
                <br />
                <table
                  style={{ width: "80%", textAlign: "center" }}
                  cellPadding={2}
                  cellSpacing={0}
                >
                  <tbody>
                    <tr>
                      <td style={{ textAlign: "center" }}>
                        <button type="submit" style={sButton}>
                          Continue
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Back-link (dev/testing aid) ═══════════════════════════════════ */}
            <tr>
              <td
                style={{
                  fontFamily: F,
                  fontSize: "11px",
                  color: "#888",
                  paddingTop: "14px",
                }}
              >
                <a
                  href={`/starbiz/filing/llc/review?session=${sessionId}`}
                  style={{ color: "#003366" }}
                >
                  ← Back to review
                </a>
              </td>
            </tr>

          </tbody>
        </table>
      </form>
    </StarBizShell>
  );
}

// Live DB read + write — do not cache
export const dynamic = "force-dynamic";
