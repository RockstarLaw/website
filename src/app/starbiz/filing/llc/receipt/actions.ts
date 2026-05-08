"use server";

/**
 * Receipt page server actions — Retrofit R6.
 *
 * createLLCFilingFromSession:
 *   Translates Sunbiz form_data (corp_name, princ_addr1, off1_name_*…)
 *   into the p_form shape expected by create_llc_entity, calls the RPC,
 *   generates and uploads the Articles of Organization PDF, then marks
 *   the session as submitted.
 *
 * Called once per session — the receipt page's idempotency check prevents
 * re-entry. If this function succeeds, the session.status flips to
 * 'submitted' and subsequent page loads skip straight to render.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/starbiz/queries";
import {
  renderArticlesOfOrganization,
  type ArticlesData,
} from "@/lib/starbiz/pdf/render";
import { uploadFilingPdf } from "@/lib/starbiz/pdf/upload";

// ─── Types ────────────────────────────────────────────────────────────────────

type Address = { street: string; city: string; state: string; zip: string };

export type CreateFilingResult =
  | {
      ok: true;
      documentNumber: string;
      entityId: string;
      filingId: string;
      /** null when PDF generation failed (entity is still filed) */
      filingDocumentId: string | null;
      /** Non-null when PDF generation failed; page shows retry notice */
      pdfError: string | null;
    }
  | {
      ok: false;
      error: string;
      /** true → user must fix the LLC name and refile */
      nameTaken: boolean;
    };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function v(fd: Record<string, string>, key: string): string {
  return (fd[key] ?? "").trim();
}

function asAddress(raw: unknown): Address {
  const obj = (raw ?? {}) as Partial<Address>;
  return {
    street: obj.street ?? "",
    city:   obj.city   ?? "",
    state:  obj.state  ?? "",
    zip:    obj.zip    ?? "",
  };
}

/**
 * Translate Sunbiz form_data keys → camelCase p_form expected by
 * the create_llc_entity stored procedure.
 *
 * Fields the Sunbiz form doesn't collect are given safe defaults:
 *   managementStructure → "member-managed"
 *   raAccepted          → true  (they signed the RA signature block)
 *   feeAcknowledged     → true  (they proceeded through payment)
 *   feiEin              → null
 *   raEmail             → null
 */
function buildPForm(fd: Record<string, string>): Record<string, unknown> {
  // Effective date: ISO format for the RPC, or empty = immediate
  const effMm   = v(fd, "eff_date_mm").padStart(2, "0");
  const effDd   = v(fd, "eff_date_dd").padStart(2, "0");
  const effYyyy = v(fd, "eff_date_yyyy");
  const effectiveDate =
    effMm && effDd && effYyyy ? `${effYyyy}-${effMm}-${effDd}` : "";

  // Principal address
  const principalAddress: Address = {
    street: v(fd, "princ_addr1"),
    city:   v(fd, "princ_city"),
    state:  v(fd, "princ_st"),
    zip:    v(fd, "princ_zip"),
  };

  // Mailing address (copy principal when same_addr_flag = Y)
  const sameAddr = v(fd, "same_addr_flag") === "Y";
  const mailingAddress: Address = sameAddr
    ? { ...principalAddress }
    : {
        street: v(fd, "mail_addr1"),
        city:   v(fd, "mail_city"),
        state:  v(fd, "mail_st"),
        zip:    v(fd, "mail_zip"),
      };

  // Registered Agent: individual path (last/first/mid/titleSr) or business name
  const raLast     = v(fd, "ra_name_last_name");
  const raFirst    = v(fd, "ra_name_first_name");
  const raMiddle   = v(fd, "ra_name_m_name");
  const raTitleSr  = v(fd, "ra_name_title_name");
  const raCorpName = v(fd, "ra_name_corp_name");
  const raName = raLast
    ? [raLast, raFirst, raMiddle, raTitleSr].filter(Boolean).join(", ")
    : raCorpName;

  const raAddress: Address = {
    street: v(fd, "ra_addr1"),
    city:   v(fd, "ra_city"),
    state:  "FL",  // hardcoded — RA must be in Florida
    zip:    v(fd, "ra_zip"),
  };

  // Organizer: the member who signed the Articles (uses member signature field)
  const organizer = {
    name:    v(fd, "signature") || v(fd, "corp_name"),
    address: { ...principalAddress },
  };

  // Officers from the 6 fixed manager slots (off1…off6)
  const officers = [1, 2, 3, 4, 5, 6].flatMap((n) => {
    const p     = `off${n}`;
    const title = v(fd, `${p}_name_title`);
    const last  = v(fd, `${p}_name_last_name`);
    const first = v(fd, `${p}_name_first_name`);
    const mid   = v(fd, `${p}_name_m_name`);
    const corp  = v(fd, `${p}_name_corp_name`);
    const addr1 = v(fd, `${p}_name_addr1`);

    // Skip empty slots
    if (!title || (!last && !corp) || !addr1) return [];

    const name = last
      ? [last, first, mid].filter(Boolean).join(", ")
      : corp;

    return [
      {
        name,
        title,
        street:      addr1,
        city:        v(fd, `${p}_name_city`),
        state:       v(fd, `${p}_name_st`),
        zip:         v(fd, `${p}_name_zip`),
        ownershipPct: null,
      },
    ];
  });

  return {
    name:                v(fd, "corp_name"),
    managementStructure: "member-managed", // Sunbiz form doesn't collect this; safe default
    purpose:             v(fd, "purpose") || "any lawful purpose",
    effectiveDate,
    principalAddress,
    mailingAddress,
    raName,
    raEmail:             null,
    raAccepted:          true,
    raAddress,
    organizer,
    officers,
    feiEin:              null,
    feeAcknowledged:     true,
  };
}

// ─── Main action ──────────────────────────────────────────────────────────────

export async function createLLCFilingFromSession(
  sessionId: string,
  userId: string,
  formData: Record<string, string>,
): Promise<CreateFilingResult> {
  const admin = createSupabaseAdminClient();
  const pForm = buildPForm(formData);

  // ── 1. Call the atomic stored procedure ───────────────────────────────────
  const { data: rpcResult, error: rpcError } = await admin.rpc(
    "create_llc_entity",
    { p_user_id: userId, p_form: pForm },
  );

  if (rpcError || !rpcResult) {
    const isNameTaken = rpcError?.message === "NAME_TAKEN";
    console.error("[createLLCFilingFromSession] rpc error:", rpcError?.message);
    return {
      ok:        false,
      error:     isNameTaken
        ? "That LLC name is already on record. Return to the form and choose a different name."
        : "Filing could not be submitted. Please try again.",
      nameTaken: isNameTaken,
    };
  }

  const { document_number: documentNumber, entity_id: entityId, filing_id: filingId } =
    rpcResult as { document_number: string; entity_id: string; filing_id: string };

  // ── 2. Mark session submitted (best-effort; do before PDF so reload is safe) ──
  await admin
    .from("filing_sessions")
    .update({
      status:       "submitted",
      current_step: "receipt",
      submitted_at: new Date().toISOString(),
      entity_id:    entityId,
    })
    .eq("id", sessionId);

  // ── 3. Generate and upload Articles of Organization PDF (best-effort) ─────
  let filingDocumentId: string | null = null;
  let pdfError: string | null = null;

  try {
    // Query the freshly-created entity so PDF data matches exactly what's in DB
    const { data: entity } = await admin
      .from("entities")
      .select("document_number, name, filed_at, effective_date, principal_address, mailing_address, registered_agent_name, registered_agent_address, type_specific_data")
      .eq("id", entityId)
      .maybeSingle();

    if (entity) {
      const { data: officers } = await admin
        .from("entity_officers")
        .select("name, title, address")
        .eq("entity_id", entityId)
        .order("name");

      const filedDateLabel     = formatDate(entity.filed_at as string);
      const effectiveDateLabel = formatDate(entity.effective_date as string);
      const principal          = asAddress(entity.principal_address);
      const mailing            = asAddress(entity.mailing_address);
      const sameMailing =
        principal.street === mailing.street &&
        principal.city   === mailing.city   &&
        principal.state  === mailing.state  &&
        principal.zip    === mailing.zip;

      const tsd = (entity.type_specific_data ?? {}) as {
        organizer?: { name?: string; address?: unknown };
      };

      const pdfData: ArticlesData = {
        documentNumber,
        entityName:         entity.name as string,
        filedDateLabel,
        effectiveDateLabel,
        effectiveOnFiling:  filedDateLabel === effectiveDateLabel,
        principalAddress:   principal,
        mailingAddress:     sameMailing ? null : mailing,
        registeredAgent: {
          name:    (entity.registered_agent_name as string | null) ?? "",
          address: asAddress(entity.registered_agent_address),
        },
        authorizedPersons: ((officers ?? []) as Array<{
          name: string;
          title: string | null;
          address: unknown;
        }>).map((o) => ({
          title:   o.title,
          name:    o.name,
          address: asAddress(o.address),
        })),
        organizer: {
          name:    tsd.organizer?.name ?? "",
          address: asAddress(tsd.organizer?.address),
        },
      };

      const buffer = await renderArticlesOfOrganization(pdfData);
      const uploaded = await uploadFilingPdf({
        documentNumber,
        entityId,
        filingId,
        kind:   "articles_of_organization",
        buffer,
      });
      filingDocumentId = uploaded.filingDocumentId;
    }
  } catch (pdfErr) {
    pdfError =
      pdfErr instanceof Error ? pdfErr.message : "Unknown PDF error";
    console.error(
      "[createLLCFilingFromSession] PDF gen failed (entity still filed):",
      pdfError,
    );
  }

  return {
    ok: true,
    documentNumber,
    entityId,
    filingId,
    filingDocumentId,
    pdfError,
  };
}
