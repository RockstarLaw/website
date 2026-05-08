"use server";

/**
 * Profit Corp Form — Server Action (R8-2)
 *
 * submitProfitCorpForm(formData: FormData) → void.
 *
 * The cloned HTML form POSTs to /starbiz/filing/profit-corp/review; this action
 * is called from that route's POST handler (wired in R8-3).
 *
 * Field names mirror the Sunbiz input name= attributes exactly from
 * public/sunbiz/profit-corp-form.html.
 *
 * Key differences from submitLLCForm (R7b-2):
 *   • corp_name suffix: must include Corp / Inc. / Incorporated / P.A. / PA / etc.
 *     (Profit Corp suffixes, not LLC suffixes)
 *   • stock_shares: required, cannot be zero or empty (Profit Corp only)
 *   • Incorporator fields (incorporator1–4) instead of no LLC-equivalent
 *   • Electronic Signature of Incorporator (name=signature) instead of member sig
 *   • Corporate Purpose: purpose_flag OR non-empty purpose textarea required
 *   • filing_type: 'corp' in filing_sessions
 *
 * On validation failure → redirect back to /starbiz/filing/profit-corp/form.
 * On success → INSERT filing_sessions + redirect to
 *   /starbiz/filing/profit-corp/review?session=<id>.
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitProfitCorpForm(formData: FormData): Promise<void> {
  // 1. Auth check
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Flatten FormData → plain string map keyed by Sunbiz field names
  const fd: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") fd[key] = value;
  }

  let invalid = false;

  // ── corp_name: required; must end with a Profit Corp suffix
  const corpName = fd.corp_name?.trim() ?? "";
  if (
    !corpName ||
    !/\b(corp\.?|inc\.?|incorporated|corporation|p\.a\.?|pa)\b/i.test(corpName)
  ) {
    invalid = true;
  }

  // ── stock_shares: required, non-empty, non-zero
  const stockShares = fd.stock_shares?.trim() ?? "";
  if (!stockShares) {
    invalid = true;
  } else {
    // Accept integer or decimal; reject "0", "0.0", "00", etc.
    const parsed = parseFloat(stockShares);
    if (isNaN(parsed) || parsed <= 0) invalid = true;
  }

  // ── Principal place of business
  if (
    !fd.princ_addr1?.trim() ||
    !fd.princ_city?.trim() ||
    !fd.princ_st?.trim() ||
    !fd.princ_zip?.trim()
  ) {
    invalid = true;
  }

  // ── Mailing address (skip if same_addr_flag = Y)
  if (fd.same_addr_flag !== "Y") {
    if (
      !fd.mail_addr1?.trim() ||
      !fd.mail_city?.trim() ||
      !fd.mail_st?.trim() ||
      !fd.mail_zip?.trim()
    ) {
      invalid = true;
    }
  }

  // ── Registered Agent: individual (last + first) OR business name
  const raLast  = fd.ra_name_last_name?.trim()  ?? "";
  const raFirst = fd.ra_name_first_name?.trim() ?? "";
  const raCorp  = fd.ra_name_corp_name?.trim()  ?? "";
  if (!(raLast && raFirst) && !raCorp) invalid = true;

  // ── RA address (state hardcoded FL)
  if (!fd.ra_addr1?.trim() || !fd.ra_city?.trim() || !fd.ra_zip?.trim()) {
    invalid = true;
  }

  // ── RA signature: required; must not equal corp_name
  const raSig = fd.ra_signature?.trim() ?? "";
  if (!raSig || (corpName && raSig.toLowerCase() === corpName.toLowerCase())) {
    invalid = true;
  }

  // ── Incorporator name (incorporator1) required; address (incorporator2) required
  if (!fd.incorporator1?.trim() || !fd.incorporator2?.trim()) invalid = true;

  // ── Electronic Signature of Incorporator
  if (!fd.signature?.trim()) invalid = true;

  // ── Corporate Purpose: either flag checked OR purpose text provided
  const purposeFlag = fd.purpose_flag === "Y";
  const purposeText = fd.purpose?.trim() ?? "";
  if (!purposeFlag && !purposeText) invalid = true;

  // ── Correspondence
  if (!fd.ret_name?.trim() || !fd.ret_email_addr?.trim()) invalid = true;
  if (
    !fd.email_addr_verify?.trim() ||
    fd.ret_email_addr?.trim() !== fd.email_addr_verify?.trim()
  ) {
    invalid = true;
  }

  // ── At least one officer slot: title + (individual OR business name) + addr1
  const hasOfficer = [1, 2, 3, 4, 5, 6].some((n) => {
    const title    = fd[`off${n}_name_title`]?.trim()     ?? "";
    const lastName = fd[`off${n}_name_last_name`]?.trim() ?? "";
    const corp     = fd[`off${n}_name_corp_name`]?.trim() ?? "";
    const addr     = fd[`off${n}_name_addr1`]?.trim()     ?? "";
    return title && (lastName || corp) && addr;
  });
  if (!hasOfficer) invalid = true;

  // ── Effective date: all parts required if any part is present
  const effMm = fd.eff_date_mm?.trim()   ?? "";
  const effDd = fd.eff_date_dd?.trim()   ?? "";
  const effYy = fd.eff_date_yyyy?.trim() ?? "";
  if (effMm || effDd || effYy) {
    const m = parseInt(effMm, 10);
    const d = parseInt(effDd, 10);
    const y = parseInt(effYy, 10);
    if (
      !effMm || !effDd || !effYy ||
      isNaN(m) || isNaN(d) || isNaN(y) ||
      m < 1 || m > 12 ||
      d < 1 || d > 31 ||
      y < 2000 || y > 2100
    ) {
      invalid = true;
    }
  }

  // 3. On validation failure: redirect back to form (re-renders blank)
  if (invalid) redirect("/starbiz/filing/profit-corp/form");

  // 4. INSERT into filing_sessions
  const admin = createSupabaseAdminClient();
  const { data: session, error: dbError } = await admin
    .from("filing_sessions")
    .insert({
      user_id:      user.id,
      filing_type:  "corp",
      current_step: "review",
      status:       "in_progress",
      form_data:    fd,
    })
    .select("id")
    .single();

  if (dbError || !session) {
    console.error("[submitProfitCorpForm] DB error:", dbError?.message);
    redirect("/starbiz/filing/profit-corp/form");
  }

  // 5. Redirect to review
  redirect(`/starbiz/filing/profit-corp/review?session=${session.id}`);
}
