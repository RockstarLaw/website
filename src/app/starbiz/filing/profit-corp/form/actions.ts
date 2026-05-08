"use server";

/**
 * Profit Corp Form — Server Action (R8-2, amended R8-7)
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
 * R8-7 amendment: On validation failure → redirect to
 *   /starbiz/filing/profit-corp/error?msg=<encoded> with the FIRST specific
 *   error message from getValidationError(). Matches Sunbiz one-error-at-a-time
 *   behavior observed in capture (coredisp.exe shows one error per page load).
 *
 * Error message routing uses query param ?msg= (URL-encoded). Using form_data
 * would require a spurious DB insert since no session exists at failure time.
 * The message is user-facing only — tampered ?msg= only changes the displayed
 * string, no security impact.
 *
 * On success → INSERT filing_sessions + redirect to
 *   /starbiz/filing/profit-corp/review?session=<id>.
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ── Validation helper ─────────────────────────────────────────────────────────
// Returns the first error message string, or null if all fields are valid.
// Mirrors Sunbiz one-error-at-a-time behavior (each capture shows one error).
// Error message wording: verbatim from captures where available; Sunbiz-style
// for remaining fields.
function getValidationError(fd: Record<string, string>): string | null {
  // ── corp_name: required; must end with a Profit Corp suffix
  const corpName = fd.corp_name?.trim() ?? "";
  if (!corpName) return "Corporation name is a required field.";
  if (!/\b(corp\.?|inc\.?|incorporated|corporation|p\.a\.?|pa)\b/i.test(corpName)) {
    return "Corporation name must include a valid Profit Corporation suffix (Corp., Inc., Incorporated, P.A.).";
  }

  // ── stock_shares: required, non-empty, non-zero
  const stockShares = fd.stock_shares?.trim() ?? "";
  if (!stockShares) return "Number of authorized shares is a required field.";
  const parsedShares = parseFloat(stockShares);
  if (isNaN(parsedShares) || parsedShares <= 0) {
    return "Number of authorized shares must be greater than zero.";
  }

  // ── Principal place of business
  if (!fd.princ_addr1?.trim()) return "Principal address is a required field.";
  if (!fd.princ_city?.trim())  return "Principal city is a required field.";
  if (!fd.princ_st?.trim())    return "Principal state is a required field.";
  if (!fd.princ_zip?.trim())   return "Principal ZIP code is a required field.";

  // ── Mailing address (skip if same_addr_flag = Y)
  if (fd.same_addr_flag !== "Y") {
    if (!fd.mail_addr1?.trim()) return "Mailing address is a required field.";
    if (!fd.mail_city?.trim())  return "Mailing city is a required field.";
    if (!fd.mail_st?.trim())    return "Mailing state is a required field.";
    if (!fd.mail_zip?.trim())   return "Mailing ZIP code is a required field.";
  }

  // ── Registered Agent: individual (last + first) OR business name
  const raLast  = fd.ra_name_last_name?.trim()  ?? "";
  const raFirst = fd.ra_name_first_name?.trim() ?? "";
  const raCorp  = fd.ra_name_corp_name?.trim()  ?? "";
  if (!(raLast && raFirst) && !raCorp) {
    return "Registered agent name is a required field.";
  }

  // ── RA address (state hardcoded FL)
  if (!fd.ra_addr1?.trim()) return "Registered agent street address is a required field.";
  if (!fd.ra_city?.trim())  return "Registered agent city is a required field.";
  if (!fd.ra_zip?.trim())   return "Registered agent ZIP code is a required field.";

  // ── RA signature: required; must not equal corp_name
  const raSig = fd.ra_signature?.trim() ?? "";
  if (!raSig) return "Registered agent signature is a required field.";
  if (corpName && raSig.toLowerCase() === corpName.toLowerCase()) {
    return "Registered agent signature cannot be the same as the corporation name.";
  }

  // ── Incorporator: name (incorporator1) and address (incorporator2) required
  if (!fd.incorporator1?.trim()) return "Incorporator name is a required field.";
  if (!fd.incorporator2?.trim()) return "Incorporator address is a required field.";

  // ── Electronic Signature of Incorporator
  if (!fd.signature?.trim()) {
    return "Electronic signature of incorporator is a required field.";
  }

  // ── Corporate Purpose: either flag checked OR purpose text provided
  const purposeFlag = fd.purpose_flag === "Y";
  const purposeText = fd.purpose?.trim() ?? "";
  if (!purposeFlag && !purposeText) {
    return "Corporate purpose is a required field.";
  }

  // ── Correspondence name
  if (!fd.ret_name?.trim()) return "Correspondence name is a required field.";

  // ── E-mail address (verbatim from capture: "E-mail address is a required field.")
  if (!fd.ret_email_addr?.trim()) return "E-mail address is a required field.";

  // ── E-mail confirmation
  if (!fd.email_addr_verify?.trim()) {
    return "E-mail address confirmation is a required field.";
  }
  if (fd.ret_email_addr?.trim() !== fd.email_addr_verify?.trim()) {
    return "E-mail address and confirmation do not match.";
  }

  // ── At least one officer slot: title + (individual OR business name) + addr1
  const hasOfficer = [1, 2, 3, 4, 5, 6].some((n) => {
    const title    = fd[`off${n}_name_title`]?.trim()     ?? "";
    const lastName = fd[`off${n}_name_last_name`]?.trim() ?? "";
    const corp     = fd[`off${n}_name_corp_name`]?.trim() ?? "";
    const addr     = fd[`off${n}_name_addr1`]?.trim()     ?? "";
    return title && (lastName || corp) && addr;
  });
  if (!hasOfficer) return "At least one officer with a title, name, and address is required.";

  // ── Effective date: all parts required if any part is present
  // (verbatim from capture: "Invalid Effective date")
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
      return "Invalid Effective date";
    }
  }

  return null; // all valid
}

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

  // 3. Validate — on first error, redirect to error page with message
  const validationError = getValidationError(fd);
  if (validationError) {
    redirect(
      `/starbiz/filing/profit-corp/error?msg=${encodeURIComponent(validationError)}`,
    );
  }

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
