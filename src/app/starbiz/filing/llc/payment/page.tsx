/**
 * LLC Formation — Payment Page (Retrofit R5)
 * Shared infrastructure for all formation filings.
 *
 * Reference: Florida_Sunbiz_website/3_Step_3_2_SUNBIZ FILING AN LLC/
 *            6_sunbiz.org - Florida Department of State.html
 *            (saved from corenrtn.exe)
 *
 * Displays computed charge, two payment options (both simulated),
 * and the cash-register easter egg (CashRegisterButton) on both buttons.
 *
 * Route:  /starbiz/filing/llc/payment?session=<uuid>
 * Source: /starbiz/filing/llc/review (R3) → [R4 filing-info, not yet built] → here
 * Next:   /starbiz/filing/llc/receipt?session=<uuid>&method=credit|account  (R6 — 404 until then)
 *
 * Shared: per-type labels and base fees come from FILING_CONFIG.
 *         To add Profit Corp: add one entry to FILING_CONFIG, no structural changes.
 */

import type { CSSProperties } from "react";
import { notFound, redirect } from "next/navigation";

import { StarBizShell } from "@/components/starbiz/StarBizShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { PaymentButtons } from "./PaymentButtons";

// ─── Per-filing-type configuration ───────────────────────────────────────────
// Extend here for Corp / Non-Profit / LP — no structural page changes needed.

type FilingConfig = {
  /** Human-readable entity type used in the charge sentence. */
  entityLabel: string;
  /** Base filing fee in USD (before optional add-ons). */
  baseFee: number;
};

const FILING_CONFIG: Record<string, FilingConfig> = {
  llc: {
    entityLabel: "Limited Liability Company",
    baseFee: 125.0,
  },
  "profit-corp": {
    entityLabel: "Corporate",
    baseFee: 125.0,
  },
  "non-profit": {
    entityLabel: "Non-Profit Corporation",
    baseFee: 70.0,
  },
  lp: {
    entityLabel: "Limited Partnership",
    baseFee: 125.0,
  },
};

const DEFAULT_CONFIG = FILING_CONFIG["llc"];

// Optional add-on fees (same across all entity types — matches real Sunbiz schedule)
const FEE_CERT_OF_STATUS = 5.0;
const FEE_CERTIFIED_COPY  = 30.0;

// ─── Style constants (faithful to Sunbiz CSS) ─────────────────────────────────

const F = "Arial, Helvetica, sans-serif";

const sPageTitle: CSSProperties = {
  fontFamily: F,
  fontSize: "15px",
  fontWeight: "bold",
  color: "#003366",
  whiteSpace: "nowrap",
};

const sLabel: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  fontStyle: "italic",
  whiteSpace: "nowrap",
  paddingRight: "6px",
  verticalAlign: "middle",
};

/** .efiledata — value cells on the payment page */
const sEfileData: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  fontWeight: "bold",
  verticalAlign: "middle",
};

const sBodyText: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function v(fd: Record<string, string>, key: string): string {
  return (fd[key] ?? "").trim();
}

/**
 * Derive a display tracking number from the session UUID.
 * Format mirrors real Sunbiz track_numbers (12 numeric-ish chars).
 * The real tracking number is assigned at receipt time (R6).
 */
function deriveTrackingNum(sessionId: string): string {
  return sessionId.replace(/-/g, "").slice(0, 12).toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PaymentPage({
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

  // ── 3. Load filing session (must belong to this user, still in-progress) ───
  const admin = createSupabaseAdminClient();
  const { data: session } = await admin
    .from("filing_sessions")
    .select("id, filing_type, form_data")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!session) notFound();

  // ── 4. Compute charge ─────────────────────────────────────────────────────
  const fd     = (session.form_data ?? {}) as Record<string, string>;
  const config: FilingConfig =
    FILING_CONFIG[session.filing_type as string] ?? DEFAULT_CONFIG;

  let total = config.baseFee;
  if (v(fd, "cos_num_flag")  === "Y") total += FEE_CERT_OF_STATUS;
  if (v(fd, "cert_num_flag") === "Y") total += FEE_CERTIFIED_COPY;
  const totalStr = `$${total.toFixed(2)}`;

  // ── 5. Build URLs for receipt page (R6 — 404 until R6 ships) ─────────────
  const trackingNum = deriveTrackingNum(sessionId);
  const creditUrl  = `/starbiz/filing/llc/receipt?session=${sessionId}&method=credit`;
  const accountUrl = `/starbiz/filing/llc/receipt?session=${sessionId}&method=account`;

  // ── 6. Render ──────────────────────────────────────────────────────────────
  return (
    <StarBizShell>
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
                    <td style={sPageTitle}>Payment Page</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ══ Document tracking # ═════════════════════════════════════════ */}
          <tr>
            <td>
              <table cellPadding={2} cellSpacing={2}>
                <tbody>
                  <tr>
                    <td style={sLabel}>Document Tracking #: </td>
                    <td style={sEfileData}>{trackingNum}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ══ Charge amount ════════════════════════════════════════════════ */}
          <tr>
            <td>
              <table cellPadding={2} cellSpacing={2}>
                <tbody>
                  <tr>
                    <td style={sLabel}>
                      The charge amount for your {config.entityLabel} filing
                      is:{" "}
                    </td>
                    <td style={sEfileData}>{totalStr}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ══ Processing notice + payment options ═════════════════════════ */}
          <tr>
            <td>
              <table cellPadding={2} cellSpacing={2}>
                <tbody>
                  {/* Verbatim body text from capture */}
                  <tr>
                    <td style={{ ...sBodyText, textAlign: "justify" }}>
                      When your payment approval is received, we will process
                      your filing request. When your document is filed, an
                      e-mail confirmation will be sent to the address entered
                      on the form.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <br />
                    </td>
                  </tr>

                  {/* ── Payment options ─────────────────────────────────── */}
                  <tr>
                    <td style={{ textAlign: "center" }}>
                      <strong style={sBodyText}>
                        Please select one of the payment options listed below.
                      </strong>
                      <br />
                      <br />

                      {/*
                       * PaymentButtons is a 'use client' island.
                       * It owns CashRegisterButton (sound + navigation) and the
                       * E-file account number / password / email inputs.
                       * Both buttons navigate to the receipt page (R6 — 404
                       * until R6 ships). No real payment is processed.
                       */}
                      <PaymentButtons
                        creditUrl={creditUrl}
                        accountUrl={accountUrl}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ══ Credit card explanatory text (verbatim from capture) ════════ */}
          <tr>
            <td style={{ ...sBodyText, textAlign: "justify" }}>
              If you press the &ldquo;Credit Card Payment&rdquo; button from
              this screen, you will be sent to the payment screen to be charged
              for this filing.
            </td>
          </tr>

          {/* ══ E-file account explanatory text (verbatim from capture) ═════ */}
          <tr>
            <td style={sBodyText}>
              If you enter an account number and password and press the
              &ldquo;Sunbiz E-file Account Payment&rdquo; button from this
              screen, your account will be charged.
            </td>
          </tr>

          {/* ══ Back-link (dev/testing aid — not in real Sunbiz) ═══════════ */}
          <tr>
            <td
              style={{
                fontFamily: F,
                fontSize: "11px",
                color: "#888",
                paddingTop: "16px",
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
    </StarBizShell>
  );
}

// Live DB read — do not cache
export const dynamic = "force-dynamic";
