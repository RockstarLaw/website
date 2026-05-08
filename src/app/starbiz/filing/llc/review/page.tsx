/**
 * LLC Formation — Review Page (Retrofit R3)
 * Shared infrastructure for all formation filings.
 *
 * Reference: Florida_Sunbiz_website/3_Step_3_2_SUNBIZ FILING AN LLC/
 *            4_sunbiz.org - Florida Department of State_CONFIRM INFO PAGE.html
 *
 * Matches coredisp.exe: readonly display of every submitted field,
 * then a "Continue" button that navigates to the filing-info step (R4).
 *
 * Per-filing-type labels live in FILING_CONFIG — extending to Profit Corp /
 * Non-Profit / LP requires only a new entry there, no structural changes.
 *
 * Route:  /starbiz/filing/llc/review?session=<uuid>
 * Source: form page (R2) inserts filing_session, redirects here.
 * Next:   /starbiz/filing/llc/filing-info?session=<uuid> (R4 — 404 until then)
 *
 * CRITICAL: Reads form_data using Sunbiz field names (corp_name, princ_addr1,
 *           etc.) — NOT camelCase wizard keys.
 */

import type { CSSProperties } from "react";
import { notFound, redirect } from "next/navigation";

import { StarBizShell } from "@/components/starbiz/StarBizShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Per-filing-type configuration ───────────────────────────────────────────
// Add entries here as new formation types ship. Nothing else needs changing.

type FilingConfig = {
  /** Label for the entity name review row (§ entity name). */
  entityLabel: string;
  /** Section heading for the manager/officer block (§ manager slots). */
  managersHeading: string;
  /** All-caps mailing-same notice (replaces address rows when same_addr_flag=Y). */
  mailingSameText: string;
};

const FILING_CONFIG: Record<string, FilingConfig> = {
  llc: {
    entityLabel: "Limited Liability Company Name",
    managersHeading: "Name And Address of Person(s) Authorized to Manage LLC",
    mailingSameText:
      "LIMITED LIABILITY COMPANY MAILING ADDRESS SAME AS PRINCIPAL ADDRESS.",
  },
  "profit-corp": {
    entityLabel: "Corporate Name",
    managersHeading: "Name And Address of Officer(s)/Director(s)",
    mailingSameText: "CORPORATION MAILING ADDRESS SAME AS PRINCIPAL ADDRESS.",
  },
  "non-profit": {
    entityLabel: "Non-Profit Corporation Name",
    managersHeading: "Name And Address of Officer(s)/Director(s)",
    mailingSameText:
      "NON-PROFIT CORPORATION MAILING ADDRESS SAME AS PRINCIPAL ADDRESS.",
  },
  lp: {
    entityLabel: "Limited Partnership Name",
    managersHeading: "Name And Address of General Partner(s)",
    mailingSameText:
      "LIMITED PARTNERSHIP MAILING ADDRESS SAME AS PRINCIPAL ADDRESS.",
  },
};

const DEFAULT_CONFIG = FILING_CONFIG["llc"];

// ─── Style constants (faithful to Sunbiz CSS classes) ────────────────────────

const F = "Arial, Helvetica, sans-serif";

const sPageTitle: CSSProperties = {
  fontFamily: F,
  fontSize: "15px",
  fontWeight: "bold",
  color: "#003366",
};

const sHeading: CSSProperties = {
  fontFamily: F,
  fontSize: "13px",
  fontWeight: "bold",
  backgroundColor: "#d0d8e8",
  border: "1px solid #aabbcc",
  padding: "2px 6px",
  whiteSpace: "nowrap",
};

/** .descript — italic label cells */
const sLabel: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  fontStyle: "italic",
  whiteSpace: "nowrap",
  paddingRight: "6px",
  verticalAlign: "top",
};

/** .data — value cells */
const sData: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  verticalAlign: "top",
  paddingLeft: "8px",
};

const sRedText: CSSProperties = {
  fontFamily: F,
  fontSize: "12px",
  color: "red",
  fontWeight: "bold",
};

const sButton: CSSProperties = {
  fontFamily: F,
  fontSize: "13px",
  padding: "3px 18px",
  cursor: "pointer",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Trim a key from form_data; returns "" if missing. */
function v(fd: Record<string, string>, key: string): string {
  return (fd[key] ?? "").trim();
}

/**
 * Format individual name as "Last, First, Middle, TitleSrJr"
 * — empty parts still emit a trailing comma, matching the real coredisp.exe output.
 */
function fmtName(last: string, first: string, middle: string, titleSr: string): string {
  return [last, first, middle, titleSr].join(", ");
}

/** Null-safe join: skips undefined/empty-string parts from city+state / zip+country. */
function pair(a: string, b: string): string {
  if (a && b) return `${a}, ${b}`;
  return a || b;
}

// ─── Sub-components (server-side, no 'use client' needed) ────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td>
        <table>
          <tbody>
            <tr>
              <td style={sHeading}>{children}</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

function LabelValueRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={sLabel}>{label}</td>
      <td />
      <td style={sData}>{value}</td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[] }>;
}) {
  // ── 1. Resolve session ID from query param ─────────────────────────────────
  const params = await searchParams;
  const rawSession = params.session;
  const sessionId = Array.isArray(rawSession) ? rawSession[0] : rawSession;
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

  // ── 4. Derive display values ───────────────────────────────────────────────
  const fd = (session.form_data ?? {}) as Record<string, string>;
  const config: FilingConfig =
    FILING_CONFIG[session.filing_type as string] ?? DEFAULT_CONFIG;

  // Effective date
  const effMm   = v(fd, "eff_date_mm");
  const effDd   = v(fd, "eff_date_dd");
  const effYyyy = v(fd, "eff_date_yyyy");
  const effDate =
    effMm && effDd && effYyyy
      ? `${effMm}/${effDd}/${effYyyy}`
      : "Immediate upon filing";

  // Cert of status / certified copy
  const certStatus = v(fd, "cos_num_flag")  === "Y" ? "Yes" : "No";
  const certCopy   = v(fd, "cert_num_flag") === "Y" ? "Yes" : "No";

  // Mailing same-as-principal
  const mailingIsSame = v(fd, "same_addr_flag") === "Y";

  // Registered Agent — individual path vs business path
  const raLast  = v(fd, "ra_name_last_name");
  const raFirst = v(fd, "ra_name_first_name");
  const raIsIndividual = raLast.length > 0 || raFirst.length > 0;

  // Populated manager slots: any slot where title + (lastName OR corpName) is non-empty
  const populatedSlots = [1, 2, 3, 4, 5, 6].filter((n) => {
    const title = v(fd, `off${n}_name_title`);
    const last  = v(fd, `off${n}_name_last_name`);
    const corp  = v(fd, `off${n}_name_corp_name`);
    return title.length > 0 && (last.length > 0 || corp.length > 0);
  });

  // ── 5. Render ──────────────────────────────────────────────────────────────
  return (
    <StarBizShell>
      {/*
       * The real coredisp.exe POSTs all fields as hidden inputs to corefile.exe.
       * We carry state in the filing_session row; the "Continue" button just
       * navigates to the next step with the session ID in the URL.
       */}
      <form method="GET" action="/starbiz/filing/llc/filing-info">
        <input type="hidden" name="session" value={sessionId} />

        <table
          summary="This table is used for page layout."
          style={{ borderCollapse: "collapse" }}
          cellPadding={4}
          cellSpacing={2}
        >
          <tbody>

            {/* ══ Page title ════════════════════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sPageTitle}>Filing Information</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Red accuracy warning ══════════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td colSpan={2} style={sRedText}>
                        Please review the filing for accuracy. If you need to make
                        corrections, do so at this time. The filing information will
                        be added/edited exactly as you have entered it. Once you have
                        submitted the information, your filing cannot be updated,
                        removed, cancelled or refunded.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Effective date ════════════════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <LabelValueRow
                      label="Effective date for this filing"
                      value={effDate}
                    />
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Cert flags ════════════════════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <LabelValueRow
                      label="Certificate of Status Requested"
                      value={certStatus}
                    />
                    <LabelValueRow
                      label="Certified Copy Requested"
                      value={certCopy}
                    />
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Entity name (type-parameterized label) ════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>{config.entityLabel}</td>
                      <td style={sData}>{v(fd, "corp_name")}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Principal Place of Business ══════════════════════════════ */}
            <SectionHeading>Principal Place of Business</SectionHeading>
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <LabelValueRow label="Address"           value={v(fd, "princ_addr1")} />
                    <LabelValueRow label="Suite, Apt. #, etc." value={v(fd, "princ_addr2")} />
                    <LabelValueRow
                      label="City, State"
                      value={pair(v(fd, "princ_city"), v(fd, "princ_st"))}
                    />
                    <LabelValueRow
                      label="Zip Code &amp; Country"
                      value={pair(v(fd, "princ_zip"), v(fd, "princ_cntry"))}
                    />
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Mailing Address ═══════════════════════════════════════════ */}
            <SectionHeading>Mailing Address</SectionHeading>
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    {mailingIsSame ? (
                      <tr>
                        <td style={sData}>{config.mailingSameText}</td>
                      </tr>
                    ) : (
                      <>
                        <LabelValueRow label="Address"             value={v(fd, "mail_addr1")} />
                        <LabelValueRow label="Suite, Apt. #, etc." value={v(fd, "mail_addr2")} />
                        <LabelValueRow
                          label="City, State"
                          value={pair(v(fd, "mail_city"), v(fd, "mail_st"))}
                        />
                        <LabelValueRow
                          label="Zip Code &amp; Country"
                          value={pair(v(fd, "mail_zip"), v(fd, "mail_cntry"))}
                        />
                      </>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Name and Address of Registered Agent ═════════════════════ */}
            <SectionHeading>Name and Address of Registered Agent</SectionHeading>
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    {raIsIndividual ? (
                      <LabelValueRow
                        label="Name (Last, First, Middle, Title)"
                        value={fmtName(
                          v(fd, "ra_name_last_name"),
                          v(fd, "ra_name_first_name"),
                          v(fd, "ra_name_m_name"),
                          v(fd, "ra_name_title_name"),
                        )}
                      />
                    ) : (
                      <LabelValueRow
                        label="Business Name"
                        value={v(fd, "ra_name_corp_name")}
                      />
                    )}
                    <LabelValueRow label="Address"             value={v(fd, "ra_addr1")} />
                    <LabelValueRow label="Suite, Apt. #, etc." value={v(fd, "ra_addr2")} />
                    <LabelValueRow
                      label="City, State"
                      value={pair(v(fd, "ra_city"), "FL")}
                    />
                    <LabelValueRow
                      label="Zip Code &amp; Country"
                      value={pair(v(fd, "ra_zip"), "US")}
                    />
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Registered Agent Signature ════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>Registered Agent Signature</td>
                      <td style={sData}>{v(fd, "ra_signature")}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Any Other Provision(s) — Optional ════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td>
                        {/* Matches: <span class="heading"><label for="llcpurposetext">…</label></span> */}
                        <span style={sHeading}>
                          <label htmlFor="llcpurposetext">
                            Any Other Provision(s) - Optional (Purpose, Statements, etc.)
                          </label>
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td
                        id="llcpurposetext"
                        style={{ fontFamily: F, fontSize: "12px", paddingTop: "4px" }}
                      >
                        {v(fd, "purpose")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Correspondence Name And E-mail Address ════════════════════ */}
            <SectionHeading>Correspondence Name And E-mail Address</SectionHeading>
            <tr>
              <td>
                <table>
                  <tbody>
                    <tr>
                      <td style={sLabel}>
                        Name and e-mail address to whom correspondence should be
                        e-mailed
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <LabelValueRow label="Name"           value={v(fd, "ret_name")} />
                    <LabelValueRow label="E-mail Address" value={v(fd, "ret_email_addr")} />
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Signature of member ═══════════════════════════════════════ */}
            <SectionHeading>
              Signature of a member or an authorized representative.
            </SectionHeading>
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <LabelValueRow label="Signature" value={v(fd, "signature")} />
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Manager/Officer slots (type-parameterized heading) ════════ */}
            <SectionHeading>
              <span style={{ whiteSpace: "normal" }}>
                {config.managersHeading}
              </span>
            </SectionHeading>

            {populatedSlots.map((n) => {
              const p          = `off${n}`;
              const offTitle   = v(fd, `${p}_name_title`);
              const offLast    = v(fd, `${p}_name_last_name`);
              const offFirst   = v(fd, `${p}_name_first_name`);
              const offMiddle  = v(fd, `${p}_name_m_name`);
              const offTitleSr = v(fd, `${p}_name_title_name`);
              const offCorp    = v(fd, `${p}_name_corp_name`);
              const isIndiv    = offLast.length > 0;
              const offAddr1   = v(fd, `${p}_name_addr1`);
              const offCity    = v(fd, `${p}_name_city`);
              const offSt      = v(fd, `${p}_name_st`);
              const offZip     = v(fd, `${p}_name_zip`);
              const offCntry   = v(fd, `${p}_name_cntry`);

              return (
                <tr key={n}>
                  <td>
                    <table cellPadding={2} cellSpacing={0}>
                      <tbody>
                        {/* "Name And Address #N" subheading — matches <span class="heading"> in capture */}
                        <tr>
                          <td>
                            <span style={sHeading}>Name And Address #{n}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={sLabel}>Title</td>
                          <td style={sData}>{offTitle}</td>
                        </tr>
                        {isIndiv ? (
                          <tr>
                            <td style={sLabel}>Name (Last, First, Middle, Title)</td>
                            <td style={sData}>
                              {fmtName(offLast, offFirst, offMiddle, offTitleSr)}
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td style={sLabel}>Entity Name</td>
                            <td style={sData}>{offCorp}</td>
                          </tr>
                        )}
                        <tr>
                          <td style={sLabel}>Street Address</td>
                          <td style={sData}>{offAddr1}</td>
                        </tr>
                        <tr>
                          <td style={sLabel}>City, State</td>
                          <td style={sData}>{pair(offCity, offSt)}</td>
                        </tr>
                        <tr>
                          <td style={sLabel}>Zip Code &amp; Country</td>
                          <td style={sData}>{pair(offZip, offCntry)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              );
            })}

            {/* Empty-slot fallback — shown only when zero slots were populated */}
            {populatedSlots.length === 0 && (
              <tr>
                <td
                  style={{ fontFamily: F, fontSize: "12px", color: "#888", padding: "4px 8px" }}
                >
                  (No managers or authorized representatives entered.)
                </td>
              </tr>
            )}

            {/* ══ Continue button ═══════════════════════════════════════════ */}
            <tr>
              <td>
                <table
                  style={{ width: "80%", textAlign: "center" }}
                  cellPadding={4}
                  cellSpacing={0}
                >
                  <tbody>
                    <tr>
                      <td style={{ textAlign: "center" }}>
                        {/*
                         * Navigates to /starbiz/filing/llc/filing-info?session=<id>
                         * (Phase R4 — will 404 until R4 ships — expected behaviour)
                         *
                         * We use GET + hidden field so the URL carries the session ID
                         * cleanly, matching our session-based state model.
                         * The real Sunbiz posted all form data as hidden fields;
                         * our equivalent is the filing_session row.
                         */}
                        <button type="submit" style={sButton}>
                          Continue
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

          </tbody>
        </table>

        {/* Back-link — not in real Sunbiz but useful during dev/testing */}
        <p style={{ fontFamily: F, fontSize: "11px", color: "#888", marginTop: "12px" }}>
          <a
            href={`/starbiz/filing/llc/form`}
            style={{ color: "#003366" }}
          >
            ← Return to filing form
          </a>
          {" · "}
          <a
            href="/starbiz/filing/llc/disclaimer"
            style={{ color: "#003366" }}
          >
            Start over (disclaimer)
          </a>
        </p>

      </form>
    </StarBizShell>
  );
}

// Keep Next.js from caching this page — it reads live DB data
export const dynamic = "force-dynamic";

