/**
 * LLC Formation — Receipt Page (Retrofit R6)
 * Final step in the LLC Sunbiz chain.
 *
 * disclaimer → form → review → filing-info → payment → [receipt]
 *
 * On first load (session.status = 'in_progress'):
 *   1. Calls create_llc_entity RPC to create the entity atomically.
 *   2. Generates Articles of Organization PDF (best-effort; entity filed even if PDF fails).
 *   3. Marks the session submitted.
 *
 * Idempotent on reload (session.status = 'submitted'):
 *   Reads existing entity_id from session → skips creation.
 *
 * CRITICAL:
 *   - Entity creation happens HERE, not on form submit (matches real Sunbiz:
 *     filing isn't real until payment succeeds).
 *   - form_data uses Sunbiz field names (corp_name, princ_addr1, etc.) —
 *     actions.ts translates to camelCase p_form for the RPC.
 *   - The existing /starbiz/entity/[document_number] detail page is linked,
 *     not replicated.
 */

import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StarBizShell } from "@/components/starbiz/StarBizShell";
import { PdfViewButton } from "@/components/starbiz/PdfViewButton";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createLLCFilingFromSession } from "./actions";

// ─── Per-filing-type configuration ───────────────────────────────────────────

type FilingConfig = {
  entityLabel: string;
  baseFee: number;
};

const FILING_CONFIG: Record<string, FilingConfig> = {
  llc: {
    entityLabel: "Florida Limited Liability Company",
    baseFee: 125.0,
  },
  "profit-corp": {
    entityLabel: "Florida Profit Corporation",
    baseFee: 125.0,
  },
  "non-profit": {
    entityLabel: "Florida Non-Profit Corporation",
    baseFee: 70.0,
  },
  lp: {
    entityLabel: "Florida Limited Partnership",
    baseFee: 125.0,
  },
};

const DEFAULT_CONFIG = FILING_CONFIG["llc"];

const FEE_CERT_OF_STATUS = 5.0;
const FEE_CERTIFIED_COPY  = 30.0;

// ─── Style constants ──────────────────────────────────────────────────────────

const F   = "Arial, Helvetica, sans-serif";
const MONO = "Courier New, Courier, monospace";
const NAVY = "#003366";

const sLabel: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  fontStyle: "italic",
  color: NAVY,
  whiteSpace: "nowrap",
  paddingRight: "10px",
  paddingBottom: "4px",
  verticalAlign: "top",
  width: "180px",
};

const sValue: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  paddingBottom: "4px",
  verticalAlign: "top",
};

const sBodyText: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  marginBottom: "8px",
};

const sBtn: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  padding: "4px 14px",
  cursor: "pointer",
  marginRight: "8px",
  marginBottom: "6px",
  backgroundColor: "#f5f5f5",
  border: "1px solid #999",
  color: NAVY,
  textDecoration: "none",
  display: "inline-block",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function v(fd: Record<string, string>, key: string): string {
  return (fd[key] ?? "").trim();
}

function computeTotal(fd: Record<string, string>, baseFee: number): number {
  let total = baseFee;
  if (v(fd, "cos_num_flag")  === "Y") total += FEE_CERT_OF_STATUS;
  if (v(fd, "cert_num_flag") === "Y") total += FEE_CERTIFIED_COPY;
  return total;
}

/** Today's date in MM/DD/YYYY, Eastern Time. */
function todayET(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month:    "2-digit",
    day:      "2-digit",
    year:     "numeric",
  }).format(new Date());
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[]; method?: string | string[] }>;
}) {
  // ── 1. Resolve params ─────────────────────────────────────────────────────
  const params    = await searchParams;
  const rawSess   = params.session;
  const sessionId = Array.isArray(rawSess) ? rawSess[0] : rawSess;
  if (!sessionId) notFound();

  const rawMethod    = params.method;
  const methodParam  = (Array.isArray(rawMethod) ? rawMethod[0] : rawMethod) ?? "credit";
  const paymentMethod =
    methodParam === "account" ? "Sunbiz E-file Account" : "Credit Card";

  // ── 2. Auth check ─────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 3. Load session — allow both in_progress (first visit) and submitted (reload) ─
  const admin = createSupabaseAdminClient();
  const { data: session } = await admin
    .from("filing_sessions")
    .select("id, filing_type, form_data, tracking_number, status, entity_id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .in("status", ["in_progress", "submitted"])
    .maybeSingle();

  if (!session) notFound();

  const fd     = (session.form_data ?? {}) as Record<string, string>;
  const config: FilingConfig =
    FILING_CONFIG[session.filing_type as string] ?? DEFAULT_CONFIG;
  const total     = computeTotal(fd, config.baseFee);
  const totalStr  = `$${total.toFixed(2)}`;
  const corpName  = v(fd, "corp_name");
  const email     = v(fd, "ret_email_addr");
  const trackingNum = (session.tracking_number as string | null) ?? sessionId.replace(/-/g, "").slice(0, 12).toUpperCase();

  // ── 4. Idempotency: check if already submitted ────────────────────────────
  let documentNumber: string;
  let filingDocumentId: string | null = null;
  let filingError: string | null = null;

  if (session.status === "submitted" && session.entity_id) {
    // ── Idempotent reload: look up existing entity ─────────────────────────
    const entityId = session.entity_id as string;
    const { data: entity } = await admin
      .from("entities")
      .select("document_number")
      .eq("id", entityId)
      .maybeSingle();

    documentNumber = (entity?.document_number as string | null) ?? trackingNum;

    const { data: filingDoc } = await admin
      .from("filing_documents")
      .select("id")
      .eq("entity_id", entityId)
      .eq("document_kind", "articles_of_organization")
      .maybeSingle();

    filingDocumentId = (filingDoc?.id as string | null) ?? null;
  } else {
    // ── First visit: create the entity ────────────────────────────────────
    const result = await createLLCFilingFromSession(
      sessionId,
      user.id,
      fd,
    );

    if (!result.ok) {
      // Creation failed — render an error screen (don't 404; user needs to see the message)
      return (
        <StarBizShell>
          <div style={{ padding: "16px" }}>
            <p style={{ ...sBodyText, color: "red", fontWeight: "bold" }}>
              Filing Error
            </p>
            <p style={sBodyText}>{result.error}</p>
            {result.nameTaken ? (
              <p style={sBodyText}>
                <Link
                  href="/starbiz/filing/llc/disclaimer"
                  style={{ color: NAVY }}
                >
                  ← Start a new filing with a different name
                </Link>
              </p>
            ) : (
              <p style={sBodyText}>
                <Link
                  href={`/starbiz/filing/llc/payment?session=${sessionId}`}
                  style={{ color: NAVY }}
                >
                  ← Return to payment page and try again
                </Link>
              </p>
            )}
            <p style={{ fontFamily: F, fontSize: "11px", color: "#888" }}>
              Questions? Contact our Help Desk at (954) 426-6424.
            </p>
          </div>
        </StarBizShell>
      );
    }

    documentNumber   = result.documentNumber;
    filingDocumentId = result.filingDocumentId;
    filingError      = result.pdfError;
  }

  const filedDate = todayET();

  // ── 5. Render receipt ─────────────────────────────────────────────────────
  return (
    <StarBizShell>
      <div style={{ padding: "4px 0 12px 0" }}>

        {/* ══ Success banner ════════════════════════════════════════════════ */}
        <table
          cellPadding={0}
          cellSpacing={0}
          style={{
            width: "100%",
            backgroundColor: "#e8f5e9",
            border: "2px solid #2E7D32",
            marginBottom: "16px",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "12px 16px" }}>
                <div
                  style={{
                    fontFamily: F,
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#1B5E20",
                    marginBottom: "4px",
                  }}
                >
                  ✓ Filing Successful
                </div>
                <div style={{ fontFamily: F, fontSize: "12px", color: "#2E7D32" }}>
                  Your {config.entityLabel} has been filed with the RockStar
                  Department of State.
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ Document number (prominent monospace) ════════════════════════ */}
        <table
          cellPadding={0}
          cellSpacing={0}
          style={{
            marginBottom: "16px",
            border: `1px solid ${NAVY}`,
            backgroundColor: "#f5f0e1",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: "6px 16px 2px 16px",
                  fontFamily: F,
                  fontSize: "11px",
                  color: NAVY,
                  fontStyle: "italic",
                }}
              >
                Document Number
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "2px 16px 10px 16px",
                  fontFamily: MONO,
                  fontSize: "22px",
                  fontWeight: "bold",
                  color: NAVY,
                  letterSpacing: "2px",
                }}
              >
                {documentNumber}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══ Details table ═════════════════════════════════════════════════ */}
        <table
          cellPadding={0}
          cellSpacing={0}
          style={{
            marginBottom: "16px",
            border: "1px solid #999",
            width: "100%",
          }}
        >
          <tbody>
            {[
              ["Entity Name",     corpName],
              ["Filing Type",     config.entityLabel],
              ["Status",          "ACTIVE"],
              ["Filed",           filedDate],
              ["Tracking Number", trackingNum],
              ["Charge Total",    totalStr],
              ["Payment Method",  paymentMethod],
            ].map(([label, val], i) => (
              <tr
                key={label}
                style={{ backgroundColor: i % 2 === 0 ? "#f5f0e1" : "#ffffff" }}
              >
                <td style={sLabel}>{label}</td>
                <td
                  style={{
                    ...sValue,
                    fontFamily: label === "Entity Name" ? "Times New Roman, Georgia, serif" : F,
                    fontSize:   label === "Entity Name" ? "13px" : "12px",
                    fontWeight: label === "Status" ? "bold" : "normal",
                    color:      label === "Status" ? "#2E7D32" : "inherit",
                  }}
                >
                  {val}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ══ Body text ═════════════════════════════════════════════════════ */}
        <p style={sBodyText}>
          Your filing has been submitted
          {email ? (
            <>
              {" "}and an email confirmation has been sent to{" "}
              <strong>{email}</strong>.
            </>
          ) : (
            "."
          )}
        </p>
        <p style={sBodyText}>
          Your document is being processed. You can view the filed Articles of
          Organization PDF below.
        </p>

        {/* PDF generation failure notice */}
        {filingError && (
          <p
            style={{
              ...sBodyText,
              color: "#800000",
              border: "1px solid #800000",
              padding: "6px 10px",
              backgroundColor: "#fff0f0",
            }}
          >
            Document is regenerating — the PDF will be available shortly.{" "}
            <Link
              href={`/starbiz/entity/${documentNumber}`}
              style={{ color: NAVY }}
            >
              View entity details
            </Link>{" "}
            for a retry link once generation is complete.
          </p>
        )}

        {/* ══ Action buttons ════════════════════════════════════════════════ */}
        <div style={{ marginBottom: "16px" }}>
          {filingDocumentId && (
            <PdfViewButton
              filingDocumentId={filingDocumentId}
              label="View Filed Articles PDF"
            />
          )}
          <span style={{ display: "inline-block", marginRight: "8px", marginBottom: "6px" }}>
            <Link
              href={`/starbiz/entity/${documentNumber}`}
              style={sBtn}
            >
              View Entity Details
            </Link>
          </span>
          <span style={{ display: "inline-block", marginBottom: "6px" }}>
            <Link href="/starbiz" style={sBtn}>
              Return to StarBiz Home
            </Link>
          </span>
        </div>

        {/* ══ Help desk ═════════════════════════════════════════════════════ */}
        <p
          style={{
            fontFamily: F,
            fontSize: "12px",
            borderTop: "1px solid #ddd",
            paddingTop: "10px",
            marginTop: "10px",
          }}
        >
          Questions? Contact our Help Desk at (954) 426-6424.
        </p>

        {/* ══ Disclaimer ════════════════════════════════════════════════════ */}
        <p
          style={{
            fontFamily: F,
            fontSize: "10px",
            color: "#888",
            marginTop: "8px",
          }}
        >
          © RockStar Law — Educational simulation only. Not affiliated with the
          Florida Department of State.
        </p>

      </div>
    </StarBizShell>
  );
}

// Session state changes on first load — never cache
export const dynamic = "force-dynamic";
