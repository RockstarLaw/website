"use server";

/**
 * LLC Single-Page Form — Server Action (Retrofit R2)
 *
 * Reference: Florida_Sunbiz_website/3_Step_3_2_SUNBIZ FILING AN LLC/
 *            3_sunbiz.org - Florida Department of State.html
 *
 * useActionState-compatible signature: (prevState, formData) => Promise<state>
 * On validation failure  → returns { fieldErrors, formData } (page re-renders)
 * On DB failure          → returns { error }
 * On success             → redirect to /starbiz/filing/llc/review?session=<id>
 *                          (will 404 until Phase R3 ships — expected)
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── State shape ─────────────────────────────────────────────────────────────

export interface LLCFormState {
  fieldErrors?: Record<string, string>;
  formData?: Record<string, string>;
  error?: string;
}

// ─── Action ──────────────────────────────────────────────────────────────────

export async function submitLLCForm(
  _prevState: LLCFormState,
  formData: FormData,
): Promise<LLCFormState> {
  // 1. Auth check — redirect instead of error so the browser goes to login
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Flatten FormData into a plain string map for easy access and return-on-error
  const fd: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") fd[key] = value;
  }

  const errors: Record<string, string> = {};

  // ── corp_name ─────────────────────────────────────────────────────────────
  const corpName = fd.corp_name?.trim() ?? "";
  if (!corpName) {
    errors.corp_name = "LLC name is required.";
  } else if (
    !/\b(llc|l\.l\.c\.|limited liability company)\b/i.test(corpName)
  ) {
    errors.corp_name =
      "Name must end with 'LLC', 'L.L.C.', or 'Limited Liability Company'.";
  }

  // ── Principal address ─────────────────────────────────────────────────────
  if (!fd.princ_addr1?.trim()) errors.princ_addr1 = "Principal address is required.";
  if (!fd.princ_city?.trim())  errors.princ_city  = "Principal city is required.";
  if (!fd.princ_st?.trim())    errors.princ_st    = "Principal state is required.";
  if (!fd.princ_zip?.trim())   errors.princ_zip   = "Principal ZIP is required.";

  // ── Mailing address (skip if same_addr_flag checked) ─────────────────────
  const sameAddr = fd.same_addr_flag === "Y";
  if (!sameAddr) {
    if (!fd.mail_addr1?.trim())
      errors.mail_addr1 = 'Mailing address is required (or check "same as principal").';
    if (!fd.mail_city?.trim()) errors.mail_city = "Mailing city is required.";
    if (!fd.mail_st?.trim())   errors.mail_st   = "Mailing state is required.";
    if (!fd.mail_zip?.trim())  errors.mail_zip  = "Mailing ZIP is required.";
  }

  // ── Registered Agent: individual (last+first) OR business name ────────────
  const raLast  = fd.ra_name_last_name?.trim()  ?? "";
  const raFirst = fd.ra_name_first_name?.trim() ?? "";
  const raCorp  = fd.ra_name_corp_name?.trim()  ?? "";
  const hasRaIndividual = raLast.length > 0 && raFirst.length > 0;
  const hasRaCorp       = raCorp.length > 0;
  if (!hasRaIndividual && !hasRaCorp) {
    errors.ra_name_last_name =
      "Registered Agent name is required: provide Last + First name, or a Business name.";
  }

  // ── RA address ─────────────────────────────────────────────────────────────
  if (!fd.ra_addr1?.trim()) errors.ra_addr1 = "Registered Agent address is required.";
  if (!fd.ra_city?.trim())  errors.ra_city  = "Registered Agent city is required.";
  if (!fd.ra_zip?.trim())   errors.ra_zip   = "Registered Agent ZIP is required.";

  // ── RA signature ──────────────────────────────────────────────────────────
  const raSig = fd.ra_signature?.trim() ?? "";
  if (!raSig) {
    errors.ra_signature = "Registered Agent signature is required.";
  } else if (
    corpName.length > 0 &&
    raSig.toLowerCase() === corpName.toLowerCase()
  ) {
    errors.ra_signature =
      "RA signature must NOT be the same as the LLC name being filed.";
  }

  // ── Correspondence ────────────────────────────────────────────────────────
  if (!fd.ret_name?.trim())
    errors.ret_name = "Correspondence name is required.";
  if (!fd.ret_email_addr?.trim())
    errors.ret_email_addr = "E-mail address is required.";
  if (!fd.email_addr_verify?.trim()) {
    errors.email_addr_verify = "Please re-enter your e-mail address.";
  } else if (
    fd.ret_email_addr?.trim() !== fd.email_addr_verify?.trim()
  ) {
    errors.email_addr_verify = "E-mail addresses do not match.";
  }

  // ── Member/authorized rep signature ───────────────────────────────────────
  if (!fd.signature?.trim())
    errors.signature = "Member or authorized representative signature is required.";

  // ── At least 1 manager slot: title + (last name OR corp name) + addr1 ─────
  const hasManager = [1, 2, 3, 4, 5, 6].some((n) => {
    const title    = fd[`off${n}_name_title`]?.trim()      ?? "";
    const lastName = fd[`off${n}_name_last_name`]?.trim()  ?? "";
    const corp     = fd[`off${n}_name_corp_name`]?.trim()  ?? "";
    const addr     = fd[`off${n}_name_addr1`]?.trim()      ?? "";
    return title.length > 0 && (lastName.length > 0 || corp.length > 0) && addr.length > 0;
  });
  if (!hasManager) {
    errors.off1_name_title =
      "At least one manager or authorized representative (title + name + address) is required.";
  }

  // ── Effective date: if any part present, all must be valid ────────────────
  const effMm   = fd.eff_date_mm?.trim()   ?? "";
  const effDd   = fd.eff_date_dd?.trim()   ?? "";
  const effYyyy = fd.eff_date_yyyy?.trim() ?? "";
  if (effMm || effDd || effYyyy) {
    const m = parseInt(effMm,   10);
    const d = parseInt(effDd,   10);
    const y = parseInt(effYyyy, 10);
    if (
      !effMm || !effDd || !effYyyy ||
      isNaN(m) || isNaN(d) || isNaN(y) ||
      m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100
    ) {
      errors.eff_date_mm =
        "If using an effective date, all parts (MM/DD/YYYY) are required and must be valid.";
    }
  }

  // ── Return validation errors ──────────────────────────────────────────────
  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors, formData: fd };
  }

  // 3. INSERT into filing_sessions
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
    console.error("[submitLLCForm] DB insert error:", dbError?.message);
    return { error: "Failed to save your filing. Please try again." };
  }

  // 4. Redirect to review (Phase R3 — will 404 until R3 ships)
  redirect(`/starbiz/filing/llc/review?session=${session.id}`);
}
