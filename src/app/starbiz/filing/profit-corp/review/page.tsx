/**
 * Profit Corp Review Page — R8-3
 *
 * 1:1 clone of the real Sunbiz coredisp.exe review page (DOMP filing type).
 * HTML template at public/sunbiz/profit-corp-review.html.
 * Served via dangerouslySetInnerHTML — no React rebuild.
 *
 * Auth-gated. Reads the most recent in-progress 'corp' filing_session for the
 * current user. If none → redirect to disclaimer. Generates tracking_number
 * if null. Persists current_step='review'. Substitutes {{TEMPLATE_PLACEHOLDERS}}
 * from filing_sessions.form_data before render.
 *
 * Scoped <style> block: verbatim copy of LLC review/page.tsx (987c9e5) with
 * [6] selector still targeting #MainContentEfiling (same wrapper as LLC review).
 *
 * Key Profit Corp additions vs LLC review:
 *   • Corporate Stock Shares display row
 *   • Incorporator Name And Address section (incorporator1–4 + signature)
 *   • Corporate Purpose shown as readonly textarea
 *   • Officer blocks use "Officer/Director" heading (vs "Name And Address of
 *     Person(s) Authorized to Manage LLC" in LLC review — but the per-slot
 *     "Name And Address #N" heading and field labels are identical)
 *   • Mailing address same-text: "CORPORATE" (not "LIMITED LIABILITY COMPANY")
 */

import { readFileSync } from "fs";
import { join } from "path";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── Helper: escape value for safe insertion into HTML attribute value ─────────
function esc(v: string | undefined | null): string {
  return (v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Helper: escape for HTML text content ─────────────────────────────────────
function escText(v: string | undefined | null): string {
  return (v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Build officer/director display block for one slot ─────────────────────────
function buildOfficerBlock(n: number, fd: Record<string, string>): string {
  const title    = (fd[`off${n}_name_title`]     ?? "").trim();
  const last     = (fd[`off${n}_name_last_name`]  ?? "").trim();
  const first    = (fd[`off${n}_name_first_name`] ?? "").trim();
  const middle   = (fd[`off${n}_name_m_name`]     ?? "").trim();
  const suffix   = (fd[`off${n}_name_title_name`] ?? "").trim();
  const corpName = (fd[`off${n}_name_corp_name`]  ?? "").trim();
  const addr1    = (fd[`off${n}_name_addr1`]      ?? "").trim();
  const city     = (fd[`off${n}_name_city`]       ?? "").trim();
  const st       = (fd[`off${n}_name_st`]         ?? "").trim();
  const zip      = (fd[`off${n}_name_zip`]        ?? "").trim();
  const cntry    = (fd[`off${n}_name_cntry`]      ?? "").trim();

  // Slot is occupied only if it has a title AND (individual name OR entity name) AND address
  if (!title || (!(last && first) && !corpName) || !addr1) return "";

  const isIndividual = !!(last && first);
  let displayName: string;
  let nameLabel: string;
  if (isIndividual) {
    const parts = [last, first, middle, suffix];
    while (parts.length > 2 && !parts[parts.length - 1]) parts.pop();
    displayName = parts.map(escText).join(", ");
    nameLabel = "Name (Last, First, Middle, Title)";
  } else {
    displayName = escText(corpName);
    nameLabel = "Entity Name";
  }

  const citySt   = [escText(city), escText(st)].filter(Boolean).join(", ");
  const zipCntry = [escText(zip), escText(cntry)].filter(Boolean).join(", ");

  return `<tr><td><table summary="Table displays the officers name and address or the Entity Name to serve as Officer/Director and address, depending on filing type that was input by user on 1st page for review.">
<tbody><tr><td><span class="heading">Name And Address #${n}</span></td></tr>
<tr><td align="left" nowrap="" class="descript">Title</td><td class="data">${escText(title)}</td></tr>
<tr><td align="left" nowrap="" class="descript">${nameLabel}</td><td class="data">${displayName}
</td></tr>
<tr><td align="left" nowrap="" class="descript">Street Address</td><td class="data">${escText(addr1)}</td></tr>
<tr><td align="left" nowrap="" class="descript">City, State</td><td class="data">${citySt}</td></tr>
<tr><td align="left" nowrap="" class="descript">Zip Code &amp; Country</td><td class="data">${zipCntry}</td></tr>
</tbody></table></td></tr>`;
}

export default async function ProfitCorpReviewPage() {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Fetch most recent in-progress corp session ───────────────────────────────
  const admin = createSupabaseAdminClient();
  const { data: session, error } = await admin
    .from("filing_sessions")
    .select("id, form_data, tracking_number, current_step")
    .eq("user_id", user.id)
    .eq("filing_type", "corp")
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !session) redirect("/starbiz/filing/profit-corp/disclaimer");

  const fd: Record<string, string> = (session.form_data as Record<string, string>) ?? {};

  // ── Generate tracking number if null (first 12 hex of UUID, uppercase) ───────
  let trackingNumber = session.tracking_number;
  if (!trackingNumber) {
    trackingNumber = session.id.replace(/-/g, "").slice(0, 12).toUpperCase();
    await admin
      .from("filing_sessions")
      .update({ tracking_number: trackingNumber, last_saved_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  // ── Update current_step to 'review' ─────────────────────────────────────────
  if (session.current_step !== "review") {
    await admin
      .from("filing_sessions")
      .update({ current_step: "review", last_saved_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  // ── Compose display values ───────────────────────────────────────────────────

  // Effective date
  const effMm   = fd.eff_date_mm?.trim()   ?? "";
  const effDd   = fd.eff_date_dd?.trim()   ?? "";
  const effYyyy = fd.eff_date_yyyy?.trim() ?? "";
  const displayEffDate = effMm && effDd && effYyyy
    ? `${effMm}/${effDd}/${effYyyy}`
    : "";

  // Certificate of Status / Certified Copy
  const displayCos  = fd.cos_num_flag  === "Y" ? "Yes" : "No";
  const displayCert = fd.cert_num_flag === "Y" ? "Yes" : "No";
  const fieldCosNum  = fd.cos_num_flag  === "Y" ? "1" : "0";
  const fieldCertNum = fd.cert_num_flag === "Y" ? "1" : "0";

  // Principal Place of Business
  const princCitySt   = [fd.princ_city, fd.princ_st].filter(Boolean).map(v => v.trim()).join(", ");
  const princZipCntry = [fd.princ_zip,  fd.princ_cntry].filter(Boolean).map(v => v.trim()).join(", ");

  // Mailing address — resolve same-as-principal
  const isSameAddr = fd.same_addr_flag === "Y";
  const effMailAddr1  = isSameAddr ? (fd.princ_addr1  ?? "") : (fd.mail_addr1  ?? "");
  const effMailAddr2  = isSameAddr ? (fd.princ_addr2  ?? "") : (fd.mail_addr2  ?? "");
  const effMailCity   = isSameAddr ? (fd.princ_city   ?? "") : (fd.mail_city   ?? "");
  const effMailSt     = isSameAddr ? (fd.princ_st     ?? "") : (fd.mail_st     ?? "");
  const effMailZip    = isSameAddr ? (fd.princ_zip    ?? "") : (fd.mail_zip    ?? "");
  const effMailCntry  = isSameAddr ? (fd.princ_cntry  ?? "") : (fd.mail_cntry  ?? "");

  let mailingAddressSection: string;
  if (isSameAddr) {
    mailingAddressSection =
      `<tbody><tr><td nowrap="" align="left" class="data">CORPORATE MAILING ADDRESS SAME AS PRINCIPAL ADDRESS.</td></tr></tbody>`;
  } else {
    const mailCitySt   = [effMailCity, effMailSt].filter(Boolean).join(", ");
    const mailZipCntry = [effMailZip,  effMailCntry].filter(Boolean).join(", ");
    mailingAddressSection = `<tbody>
<tr><td nowrap="" align="left" class="descript">Address</td><td class="data">${escText(effMailAddr1)}</td></tr>
<tr><td nowrap="" align="left" class="descript">Suite, Apt. #, etc.</td><td class="data">${escText(effMailAddr2)}</td></tr>
<tr><td nowrap="" align="left" class="descript">City, State</td><td class="data">${escText([effMailCity, effMailSt].filter(Boolean).join(", "))}</td></tr>
<tr><td nowrap="" align="left" class="descript">Zip Code &amp; Country</td><td class="data">${escText(mailZipCntry)}</td></tr>
</tbody>`;
  }

  // Registered Agent
  const raLast   = (fd.ra_name_last_name  ?? "").trim();
  const raFirst  = (fd.ra_name_first_name ?? "").trim();
  const raMiddle = (fd.ra_name_m_name     ?? "").trim();
  const raTitle  = (fd.ra_name_title_name ?? "").trim();
  const raCorp   = (fd.ra_name_corp_name  ?? "").trim();
  const raIsIndividual = !!(raLast && raFirst);
  const displayRaName = raIsIndividual
    ? `${escText(raLast)}, ${escText(raFirst)}, ${escText(raMiddle)}, ${escText(raTitle)}`
    : escText(raCorp);
  const raCitySt   = [fd.ra_city, "FL"].filter(Boolean).join(", ");
  const raZipCntry = [(fd.ra_zip ?? "").trim(), "US"].filter(Boolean).join(", ");

  // Corporate Purpose — render as readonly textarea matching the capture
  const purposeFlag = fd.purpose_flag === "Y";
  const purposeText = purposeFlag
    ? "ANY AND ALL LAWFUL BUSINESS."
    : (fd.purpose?.trim() ?? "");
  const displayPurpose =
    `<textarea name="purposetext" id="corppurposetext" wrap="hard" readonly="" rows="10" cols="60">${escText(purposeText)}</textarea>`;

  // Officer blocks — render only occupied slots (off1–off6)
  const officerBlocks = [1, 2, 3, 4, 5, 6]
    .map(n => buildOfficerBlock(n, fd))
    .join("\n");

  // off{N}_name_type — P for individual, C for entity/empty
  function nameType(n: number): string {
    const last  = (fd[`off${n}_name_last_name`]  ?? "").trim();
    const first = (fd[`off${n}_name_first_name`] ?? "").trim();
    return last && first ? "P" : "C";
  }

  // ── Read template and substitute placeholders ────────────────────────────────
  let html = readFileSync(
    join(process.cwd(), "public/sunbiz/profit-corp-review.html"),
    "utf-8",
  );

  const displayMap: Record<string, string> = {
    "{{display_eff_date}}":        escText(displayEffDate),
    "{{display_cos}}":             displayCos,
    "{{display_cert}}":            displayCert,
    "{{display_corp_name}}":       escText((fd.corp_name    ?? "").trim()),
    "{{display_stock_shares}}":    escText((fd.stock_shares ?? "").trim()),
    "{{display_princ_addr1}}":     escText((fd.princ_addr1  ?? "").trim()),
    "{{display_princ_addr2}}":     escText((fd.princ_addr2  ?? "").trim()),
    "{{display_princ_city_st}}":   escText(princCitySt),
    "{{display_princ_zip_cntry}}": escText(princZipCntry),
    "{{mailing_address_section}}": mailingAddressSection,
    "{{display_ra_name}}":         displayRaName,
    "{{display_ra_addr1}}":        escText((fd.ra_addr1     ?? "").trim()),
    "{{display_ra_addr2}}":        escText((fd.ra_addr2     ?? "").trim()),
    "{{display_ra_city_st}}":      escText(raCitySt),
    "{{display_ra_zip_cntry}}":    escText(raZipCntry),
    "{{display_ra_signature}}":    escText((fd.ra_signature ?? "").trim()),
    "{{display_incorporator1}}":   escText((fd.incorporator1 ?? "").trim()),
    "{{display_incorporator2}}":   escText((fd.incorporator2 ?? "").trim()),
    "{{display_incorporator3}}":   escText((fd.incorporator3 ?? "").trim()),
    "{{display_incorporator4}}":   escText((fd.incorporator4 ?? "").trim()),
    "{{display_signature}}":       escText((fd.signature    ?? "").trim()),
    "{{display_purpose}}":         displayPurpose,
    "{{display_ret_name}}":        escText((fd.ret_name      ?? "").trim()),
    "{{display_ret_email}}":       escText((fd.ret_email_addr ?? "").trim()),
    "{{officer_blocks}}":          officerBlocks,
  };

  const fieldMap: Record<string, string> = {
    "{{field_track_number}}":          esc(trackingNumber),
    "{{field_eff_date_mm}}":           esc(fd.eff_date_mm),
    "{{field_eff_date_dd}}":           esc(fd.eff_date_dd),
    "{{field_eff_date_yyyy}}":         esc(fd.eff_date_yyyy),
    "{{field_corp_name}}":             esc(fd.corp_name),
    "{{field_stock_shares}}":          esc(fd.stock_shares),
    "{{field_cos_num}}":               fieldCosNum,
    "{{field_cert_num}}":              fieldCertNum,
    "{{field_princ_addr1}}":           esc(fd.princ_addr1),
    "{{field_princ_addr2}}":           esc(fd.princ_addr2),
    "{{field_princ_city}}":            esc(fd.princ_city),
    "{{field_princ_st}}":              esc(fd.princ_st),
    "{{field_princ_zip}}":             esc(fd.princ_zip),
    "{{field_princ_cntry}}":           esc(fd.princ_cntry),
    "{{field_mail_addr1}}":            esc(effMailAddr1),
    "{{field_mail_addr2}}":            esc(effMailAddr2),
    "{{field_mail_city}}":             esc(effMailCity),
    "{{field_mail_st}}":               esc(effMailSt),
    "{{field_mail_zip}}":              esc(effMailZip),
    "{{field_mail_cntry}}":            esc(effMailCntry),
    "{{field_ra_name_last_name}}":     esc(fd.ra_name_last_name),
    "{{field_ra_name_first_name}}":    esc(fd.ra_name_first_name),
    "{{field_ra_name_m_name}}":        esc(fd.ra_name_m_name),
    "{{field_ra_name_title_name}}":    esc(fd.ra_name_title_name),
    "{{field_ra_name_corp_name}}":     esc(fd.ra_name_corp_name),
    "{{field_ra_addr1}}":              esc(fd.ra_addr1),
    "{{field_ra_addr2}}":              esc(fd.ra_addr2),
    "{{field_ra_city}}":               esc(fd.ra_city),
    "{{field_ra_zip}}":                esc(fd.ra_zip),
    "{{field_ra_signature}}":          esc(fd.ra_signature),
    "{{field_incorporator1}}":         esc(fd.incorporator1),
    "{{field_incorporator2}}":         esc(fd.incorporator2),
    "{{field_incorporator3}}":         esc(fd.incorporator3),
    "{{field_incorporator4}}":         esc(fd.incorporator4),
    "{{field_signature}}":             esc(fd.signature),
    "{{field_purpose}}":               esc(fd.purpose),
    "{{field_ret_name}}":              esc(fd.ret_name),
    "{{field_ret_email_addr}}":        esc(fd.ret_email_addr),
    "{{field_off1_name_type}}":        nameType(1),
    "{{field_off1_name_seq}}":         esc(fd.off1_name_seq),
    "{{field_off1_name_title}}":       esc(fd.off1_name_title),
    "{{field_off1_name_last_name}}":   esc(fd.off1_name_last_name),
    "{{field_off1_name_first_name}}":  esc(fd.off1_name_first_name),
    "{{field_off1_name_m_name}}":      esc(fd.off1_name_m_name),
    "{{field_off1_name_title_name}}":  esc(fd.off1_name_title_name),
    "{{field_off1_name_corp_name}}":   esc(fd.off1_name_corp_name),
    "{{field_off1_name_addr1}}":       esc(fd.off1_name_addr1),
    "{{field_off1_name_city}}":        esc(fd.off1_name_city),
    "{{field_off1_name_st}}":          esc(fd.off1_name_st),
    "{{field_off1_name_zip}}":         esc(fd.off1_name_zip),
    "{{field_off1_name_cntry}}":       esc(fd.off1_name_cntry),
    "{{field_off2_name_type}}":        nameType(2),
    "{{field_off2_name_seq}}":         esc(fd.off2_name_seq),
    "{{field_off2_name_title}}":       esc(fd.off2_name_title),
    "{{field_off2_name_last_name}}":   esc(fd.off2_name_last_name),
    "{{field_off2_name_first_name}}":  esc(fd.off2_name_first_name),
    "{{field_off2_name_m_name}}":      esc(fd.off2_name_m_name),
    "{{field_off2_name_title_name}}":  esc(fd.off2_name_title_name),
    "{{field_off2_name_corp_name}}":   esc(fd.off2_name_corp_name),
    "{{field_off2_name_addr1}}":       esc(fd.off2_name_addr1),
    "{{field_off2_name_city}}":        esc(fd.off2_name_city),
    "{{field_off2_name_st}}":          esc(fd.off2_name_st),
    "{{field_off2_name_zip}}":         esc(fd.off2_name_zip),
    "{{field_off2_name_cntry}}":       esc(fd.off2_name_cntry),
    "{{field_off3_name_type}}":        nameType(3),
    "{{field_off3_name_seq}}":         esc(fd.off3_name_seq),
    "{{field_off3_name_title}}":       esc(fd.off3_name_title),
    "{{field_off3_name_last_name}}":   esc(fd.off3_name_last_name),
    "{{field_off3_name_first_name}}":  esc(fd.off3_name_first_name),
    "{{field_off3_name_m_name}}":      esc(fd.off3_name_m_name),
    "{{field_off3_name_title_name}}":  esc(fd.off3_name_title_name),
    "{{field_off3_name_corp_name}}":   esc(fd.off3_name_corp_name),
    "{{field_off3_name_addr1}}":       esc(fd.off3_name_addr1),
    "{{field_off3_name_city}}":        esc(fd.off3_name_city),
    "{{field_off3_name_st}}":          esc(fd.off3_name_st),
    "{{field_off3_name_zip}}":         esc(fd.off3_name_zip),
    "{{field_off3_name_cntry}}":       esc(fd.off3_name_cntry),
    "{{field_off4_name_type}}":        nameType(4),
    "{{field_off4_name_seq}}":         esc(fd.off4_name_seq),
    "{{field_off4_name_title}}":       esc(fd.off4_name_title),
    "{{field_off4_name_last_name}}":   esc(fd.off4_name_last_name),
    "{{field_off4_name_first_name}}":  esc(fd.off4_name_first_name),
    "{{field_off4_name_m_name}}":      esc(fd.off4_name_m_name),
    "{{field_off4_name_title_name}}":  esc(fd.off4_name_title_name),
    "{{field_off4_name_corp_name}}":   esc(fd.off4_name_corp_name),
    "{{field_off4_name_addr1}}":       esc(fd.off4_name_addr1),
    "{{field_off4_name_city}}":        esc(fd.off4_name_city),
    "{{field_off4_name_st}}":          esc(fd.off4_name_st),
    "{{field_off4_name_zip}}":         esc(fd.off4_name_zip),
    "{{field_off4_name_cntry}}":       esc(fd.off4_name_cntry),
    "{{field_off5_name_type}}":        nameType(5),
    "{{field_off5_name_seq}}":         esc(fd.off5_name_seq),
    "{{field_off5_name_title}}":       esc(fd.off5_name_title),
    "{{field_off5_name_last_name}}":   esc(fd.off5_name_last_name),
    "{{field_off5_name_first_name}}":  esc(fd.off5_name_first_name),
    "{{field_off5_name_m_name}}":      esc(fd.off5_name_m_name),
    "{{field_off5_name_title_name}}":  esc(fd.off5_name_title_name),
    "{{field_off5_name_corp_name}}":   esc(fd.off5_name_corp_name),
    "{{field_off5_name_addr1}}":       esc(fd.off5_name_addr1),
    "{{field_off5_name_city}}":        esc(fd.off5_name_city),
    "{{field_off5_name_st}}":          esc(fd.off5_name_st),
    "{{field_off5_name_zip}}":         esc(fd.off5_name_zip),
    "{{field_off5_name_cntry}}":       esc(fd.off5_name_cntry),
    "{{field_off6_name_type}}":        nameType(6),
    "{{field_off6_name_seq}}":         esc(fd.off6_name_seq),
    "{{field_off6_name_title}}":       esc(fd.off6_name_title),
    "{{field_off6_name_last_name}}":   esc(fd.off6_name_last_name),
    "{{field_off6_name_first_name}}":  esc(fd.off6_name_first_name),
    "{{field_off6_name_m_name}}":      esc(fd.off6_name_m_name),
    "{{field_off6_name_title_name}}":  esc(fd.off6_name_title_name),
    "{{field_off6_name_corp_name}}":   esc(fd.off6_name_corp_name),
    "{{field_off6_name_addr1}}":       esc(fd.off6_name_addr1),
    "{{field_off6_name_city}}":        esc(fd.off6_name_city),
    "{{field_off6_name_st}}":          esc(fd.off6_name_st),
    "{{field_off6_name_zip}}":         esc(fd.off6_name_zip),
    "{{field_off6_name_cntry}}":       esc(fd.off6_name_cntry),
  };

  // Apply all substitutions
  for (const [token, value] of Object.entries(displayMap)) {
    html = html.replaceAll(token, value);
  }
  for (const [token, value] of Object.entries(fieldMap)) {
    html = html.replaceAll(token, value);
  }

  // Extract body innerHTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/sunbiz/sunbiz_style.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/sunbiz/sunbiz_dos_style.css" />

      {/*
       * Scoped reset — verbatim copy of LLC review/page.tsx (987c9e5).
       * [6] selector targets #MainContentEfiling (same as LLC review).
       * [8] .redtext alias — review HTML uses class="redtext" (lowercase);
       *     sunbiz_style.css defines .RedText (PascalCase — case-sensitive).
       */}
      <style>{`
        body {
          display: block !important;
          flex-direction: initial !important;
          align-items: initial !important;
          min-height: auto !important;
          line-height: normal !important;
        }

        #wrapper table {
          border-collapse: separate !important;
        }

        #wrapper input,
        #wrapper textarea,
        #wrapper select {
          border-width: revert !important;
          border-style: revert !important;
          border-color: revert !important;
          appearance: revert !important;
          -webkit-appearance: revert !important;
          padding: revert !important;
          background-color: revert !important;
        }

        .heading {
          font: bold 13px Arial, sans-serif !important;
          border-bottom: 1px solid #333 !important;
          color: #333 !important;
        }

        .bodytext {
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 9pt !important;
          font-weight: normal;
          color: #000000;
        }

        .redtext {
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 12pt !important;
          font-weight: bold !important;
          color: red !important;
        }

        #wrapper #content {
          font-size: 1em !important;
        }

        #wrapper #MainContentEfiling > form > table > tbody > tr > td {
          padding-top: 2px !important;
          padding-bottom: 2px !important;
        }

        #wrapper a:link,
        #wrapper a:visited {
          color: #236faf !important;
          text-decoration: underline !important;
        }
        #wrapper a:hover {
          color: #5582a9 !important;
        }
      `}</style>

      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}
