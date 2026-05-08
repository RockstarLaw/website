"use server";

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  DirectorRow,
  OfficerRow,
  ProfitCorpSubmitResult,
  WizardData,
} from "@/lib/starbiz/profit-corp-types";
import { renderArticlesOfIncorporation, type ArticlesOfIncorporationData } from "@/lib/starbiz/pdf/render";
import { uploadFilingPdf } from "@/lib/starbiz/pdf/upload";
import { formatDate } from "@/lib/starbiz/queries";

type Address = { street: string; city: string; state: string; zip: string };

function asAddress(v: Partial<Address> | null | undefined): Address {
  return { street: v?.street ?? "", city: v?.city ?? "", state: v?.state ?? "", zip: v?.zip ?? "" };
}

// ─── FormData parsing ─────────────────────────────────────────────────────────

function s(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function b(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return v === "true" || v === "on" || v === "1";
}

function readWizardData(formData: FormData): WizardData {
  return {
    name:               s(formData, "name"),
    purpose:            s(formData, "purpose"),
    effectiveDate:      s(formData, "effectiveDate"),
    sharesAuthorized:   s(formData, "sharesAuthorized"),
    parValueDollars:    s(formData, "parValueDollars"),
    shareClassName:     s(formData, "shareClassName"),
    principalStreet:    s(formData, "principalStreet"),
    principalCity:      s(formData, "principalCity"),
    principalState:     s(formData, "principalState"),
    principalZip:       s(formData, "principalZip"),
    mailingIsSame:      b(formData, "mailingIsSame"),
    mailingStreet:      s(formData, "mailingStreet"),
    mailingCity:        s(formData, "mailingCity"),
    mailingState:       s(formData, "mailingState"),
    mailingZip:         s(formData, "mailingZip"),
    raName:             s(formData, "raName"),
    raStreet:           s(formData, "raStreet"),
    raCity:             s(formData, "raCity"),
    raState:            s(formData, "raState"),
    raZip:              s(formData, "raZip"),
    raEmail:            s(formData, "raEmail"),
    raAccepted:         b(formData, "raAccepted"),
    incorporatorName:   s(formData, "incorporatorName"),
    incorporatorStreet: s(formData, "incorporatorStreet"),
    incorporatorCity:   s(formData, "incorporatorCity"),
    incorporatorState:  s(formData, "incorporatorState"),
    incorporatorZip:    s(formData, "incorporatorZip"),
    feiEin:             s(formData, "feiEin"),
    feeAcknowledged:    b(formData, "feeAcknowledged"),
  };
}

function readRows<T>(formData: FormData, key: string): T[] {
  const raw = s(formData, key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

// ─── Server-side validation ───────────────────────────────────────────────────

function serverValidate(
  data: WizardData,
  directors: DirectorRow[],
  officers: OfficerRow[],
): Record<string, string> {
  const e: Record<string, string> = {};

  if (!data.name.trim()) {
    e.name = "Corporate name is required.";
  } else if (!/\b(corp\.?|corporation|company|co\.?|incorporated|inc\.?)\b/i.test(data.name)) {
    e.name =
      "Name must include 'Corporation', 'Incorporated', 'Company', or an abbreviation ('Corp.', 'Inc.', 'Co.').";
  }

  const sharesNum = Number(data.sharesAuthorized);
  if (!data.sharesAuthorized.trim()) {
    e.sharesAuthorized = "Number of authorized shares is required.";
  } else if (!Number.isInteger(sharesNum) || sharesNum <= 0) {
    e.sharesAuthorized = "Authorized shares must be a positive whole number.";
  }

  const parRaw = data.parValueDollars.trim();
  if (parRaw && parRaw !== "0") {
    const parNum = Number(parRaw);
    if (!Number.isFinite(parNum) || parNum < 0) {
      e.parValueDollars = "Par value must be a non-negative number, or blank for no par value.";
    }
  }

  if (!data.principalStreet.trim()) e.principalStreet = "Principal street address is required.";
  if (!data.principalCity.trim())   e.principalCity    = "Principal city is required.";
  if (!data.principalState.trim())  e.principalState   = "Principal state is required.";
  if (!data.principalZip.trim())    e.principalZip     = "Principal ZIP is required.";

  if (!data.raName.trim()) e.raName = "Registered agent name is required.";
  if (data.raState.trim().toUpperCase() !== "FL") e.raState = "Registered agent must be in Florida.";
  if (!data.raStreet.trim()) e.raStreet = "Registered agent street address is required.";
  if (!data.raZip.trim())    e.raZip    = "Registered agent ZIP is required.";
  if (!data.raAccepted)      e.raAccepted = "Registered agent must accept the appointment.";

  if (!directors[0]?.name?.trim()) e["director_0_name"] = "At least one director is required.";
  if (!data.incorporatorName.trim())   e.incorporatorName   = "Incorporator name is required.";
  if (!data.incorporatorStreet.trim()) e.incorporatorStreet = "Incorporator address is required.";
  if (!data.feeAcknowledged)           e.feeAcknowledged    = "You must acknowledge the filing fee.";

  void officers; // officers optional client-side; server accepts empty array

  return e;
}

function stepForField(field: string): 1 | 2 | 3 | 4 {
  if (["name", "sharesAuthorized", "parValueDollars", "shareClassName", "effectiveDate", "purpose"].includes(field)) return 1;
  if (field.startsWith("principal") || field.startsWith("mailing")) return 2;
  if (field.startsWith("ra")) return 3;
  return 4;
}

// ─── Main action ──────────────────────────────────────────────────────────────

export async function submitProfitCorp(
  _prevState: ProfitCorpSubmitResult | null,
  formData: FormData,
): Promise<ProfitCorpSubmitResult> {
  // 1. Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to file." };

  // 2. Parse FormData
  const wizardData   = readWizardData(formData);
  const directorRows = readRows<DirectorRow>(formData, "directors");
  const officerRows  = readRows<OfficerRow>(formData, "officers");

  // 3. Server-side validation
  const valErrors = serverValidate(wizardData, directorRows, officerRows);
  if (Object.keys(valErrors).length) {
    const firstKey = Object.keys(valErrors)[0];
    return { fieldErrors: valErrors, returnToStep: stepForField(firstKey) };
  }

  // 4. Build pForm payload for the stored procedure
  const mailingAddress = wizardData.mailingIsSame
    ? { street: wizardData.principalStreet, city: wizardData.principalCity, state: wizardData.principalState, zip: wizardData.principalZip }
    : { street: wizardData.mailingStreet,   city: wizardData.mailingCity,   state: wizardData.mailingState,   zip: wizardData.mailingZip };

  const pForm = {
    name:             wizardData.name,
    purpose:          wizardData.purpose || "any lawful purpose",
    effectiveDate:    wizardData.effectiveDate || null,
    sharesAuthorized: wizardData.sharesAuthorized,
    parValueDollars:  wizardData.parValueDollars || null,
    shareClassName:   wizardData.shareClassName || "Common",
    principalAddress: { street: wizardData.principalStreet, city: wizardData.principalCity, state: wizardData.principalState, zip: wizardData.principalZip },
    mailingAddress,
    raName:           wizardData.raName,
    raEmail:          wizardData.raEmail || null,
    raAccepted:       wizardData.raAccepted,
    raAddress:        { street: wizardData.raStreet, city: wizardData.raCity, state: wizardData.raState, zip: wizardData.raZip },
    directors: directorRows
      .filter(r => r.name.trim())
      .map(r => ({
        name:   r.name.trim(),
        title:  r.title.trim() || null,
        street: r.street.trim(),
        city:   r.city.trim(),
        state:  r.state.trim().toUpperCase(),
        zip:    r.zip.trim(),
      })),
    officers: officerRows
      .filter(r => r.name.trim())
      .map(r => ({
        name:   r.name.trim(),
        title:  r.title.trim() || null,
        street: r.street.trim(),
        city:   r.city.trim(),
        state:  r.state.trim().toUpperCase(),
        zip:    r.zip.trim(),
      })),
    incorporator: {
      name:    wizardData.incorporatorName,
      address: { street: wizardData.incorporatorStreet, city: wizardData.incorporatorCity, state: wizardData.incorporatorState, zip: wizardData.incorporatorZip },
    },
    feiEin:          wizardData.feiEin.trim() || null,
    feeAcknowledged: wizardData.feeAcknowledged,
  };

  // 5. Call atomic stored procedure
  const admin = createSupabaseAdminClient();
  const { data: result, error } = await admin.rpc("create_profit_corp_entity", {
    p_user_id: user.id,
    p_form:    pForm,
  });

  if (error) {
    console.error("[submitProfitCorp] rpc error:", error.message, error.code);
    if (error.message === "NAME_TAKEN") {
      return {
        fieldErrors:  { name: "That name is already in use. Please choose a different name." },
        returnToStep: 1,
      };
    }
    return { error: "Filing could not be submitted. Please try again." };
  }

  const { document_number: documentNumber, entity_id: entityId, filing_id: filingId } =
    result as { document_number: string; entity_id: string; filing_id: string };

  // 6. Generate Articles of Incorporation PDF (best-effort)
  try {
    const { data: entity } = await admin
      .from("entities")
      .select("name, filed_at, effective_date, principal_address, mailing_address, registered_agent_name, registered_agent_address, type_specific_data")
      .eq("document_number", documentNumber)
      .maybeSingle();

    if (entity) {
      const { data: officers } = await admin
        .from("entity_officers")
        .select("name, title, role, address")
        .eq("entity_id", entityId)
        .order("role")
        .order("name");

      const filedDateLabel     = formatDate(entity.filed_at);
      const effectiveDateLabel = formatDate(entity.effective_date);
      const principal = asAddress(entity.principal_address as Partial<Address>);
      const mailing   = asAddress(entity.mailing_address   as Partial<Address>);
      const sameMailing =
        principal.street === mailing.street && principal.city === mailing.city &&
        principal.state  === mailing.state  && principal.zip  === mailing.zip;

      const tsd = (entity.type_specific_data ?? {}) as {
        incorporator?: { name?: string; address?: unknown };
        shares_authorized?: number;
        par_value_cents?: number | null;
        share_class_name?: string;
        purpose?: string;
      };

      const pdfData: ArticlesOfIncorporationData = {
        documentNumber,
        entityName:         entity.name,
        filedDateLabel,
        effectiveDateLabel,
        effectiveOnFiling:  filedDateLabel === effectiveDateLabel,
        principalAddress:   principal,
        mailingAddress:     sameMailing ? null : mailing,
        registeredAgent: {
          name:    entity.registered_agent_name ?? "",
          address: asAddress(entity.registered_agent_address as Partial<Address>),
        },
        sharesAuthorized: tsd.shares_authorized ?? 0,
        parValueCents:    tsd.par_value_cents ?? null,
        shareClassName:   tsd.share_class_name ?? "Common",
        directors: (officers ?? [])
          .filter(o => o.role === "director")
          .map(o => ({
            title:   o.title,
            name:    o.name,
            address: asAddress(o.address as Partial<Address>),
          })),
        officers: (officers ?? [])
          .filter(o => o.role === "officer")
          .map(o => ({
            title:   o.title,
            name:    o.name,
            address: asAddress(o.address as Partial<Address>),
          })),
        incorporator: {
          name:    tsd.incorporator?.name ?? "",
          address: asAddress(tsd.incorporator?.address as Partial<Address>),
        },
        purpose: tsd.purpose ?? "any lawful purpose",
      };

      const buffer = await renderArticlesOfIncorporation(pdfData);
      await uploadFilingPdf({ documentNumber, entityId, filingId, kind: "articles_of_incorporation", buffer });
    }
  } catch (pdfErr) {
    console.error("[submitProfitCorp] PDF gen failed (entity still filed):", pdfErr);
  }

  // 7. Redirect to entity detail page
  redirect(`/starbiz/entity/${documentNumber}`);
}
