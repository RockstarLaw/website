"use server";

/**
 * LLC Form — Server Action (Retrofit R7b-2 retry)
 *
 * Plain server action: submitLLCForm(formData: FormData) → void.
 * The cloned HTML form POSTs to /starbiz/filing/llc/review; this action
 * is called from that route's POST handler.
 *
 * Field names mirror the Sunbiz input name= attributes exactly from form.html.
 *
 * On validation failure → redirect back to /starbiz/filing/llc/form (form re-renders blank).
 * Field-level error decoration is a follow-up polish phase (SESSION_HANDOFF §R7b-2).
 * On success → INSERT filing_sessions + redirect to /starbiz/filing/llc/review?session=<id>.
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitLLCForm(formData: FormData): Promise<void> {
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

  // ── corp_name: required; must end with LLC / L.L.C. / Limited Liability Company
  const corpName = fd.corp_name?.trim() ?? "";
  if (!corpName || !/\b(llc|l\.l\.c\.|limited liability company)\b/i.test(corpName)) {
    invalid = true;
  }

  // ── Principal place of business
  if (!fd.princ_addr1?.trim() || !fd.princ_city?.trim() ||
      !fd.princ_st?.trim()    || !fd.princ_zip?.trim()) {
    invalid = true;
  }

  // ── Mailing address (skip if same_addr_flag = Y)
  if (fd.same_addr_flag !== "Y") {
    if (!fd.mail_addr1?.trim() || !fd.mail_city?.trim() ||
        !fd.mail_st?.trim()    || !fd.mail_zip?.trim()) {
      invalid = true;
    }
  }

  // ── Registered Agent: individual (last+first) OR business name
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

  // ── Correspondence
  if (!fd.ret_name?.trim() || !fd.ret_email_addr?.trim()) invalid = true;
  if (!fd.email_addr_verify?.trim() ||
      fd.ret_email_addr?.trim() !== fd.email_addr_verify?.trim()) {
    invalid = true;
  }

  // ── Member/authorized rep signature
  if (!fd.signature?.trim()) invalid = true;

  // ── At least one manager slot: title + (last OR corp name) + addr1
  const hasManager = [1, 2, 3, 4, 5, 6].some((n) => {
    const title    = fd[`off${n}_name_title`]?.trim()     ?? "";
    const lastName = fd[`off${n}_name_last_name`]?.trim() ?? "";
    const corp     = fd[`off${n}_name_corp_name`]?.trim() ?? "";
    const addr     = fd[`off${n}_name_addr1`]?.trim()     ?? "";
    return title && (lastName || corp) && addr;
  });
  if (!hasManager) invalid = true;

  // ── Effective date: all parts required if any part is present
  const effMm = fd.eff_date_mm?.trim() ?? "";
  const effDd = fd.eff_date_dd?.trim() ?? "";
  const effYy = fd.eff_date_yyyy?.trim() ?? "";
  if (effMm || effDd || effYy) {
    const m = parseInt(effMm, 10), d = parseInt(effDd, 10), y = parseInt(effYy, 10);
    if (!effMm || !effDd || !effYy ||
        isNaN(m) || isNaN(d) || isNaN(y) ||
        m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) {
      invalid = true;
    }
  }

  // 4. On validation failure: redirect back to form (re-renders blank)
  if (invalid) redirect("/starbiz/filing/llc/form");

  // 5. INSERT into filing_sessions
  const admin = createSupabaseAdminClient();
  const { data: session, error: dbError } = await admin
    .from("filing_sessions")
    .insert({
      user_id:      user.id,
      filing_type:  "llc",
      current_step: "review",
      status:       "in_progress",
      form_data:    fd,
    })
    .select("id")
    .single();

  if (dbError || !session) {
    console.error("[submitLLCForm] DB error:", dbError?.message);
    redirect("/starbiz/filing/llc/form");
  }

  // 6. Redirect to review
  redirect(`/starbiz/filing/llc/review?session=${session.id}`);
}
