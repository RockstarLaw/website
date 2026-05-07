"use server";

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LLCSubmitResult, PersonRow, WizardData } from "@/lib/starbiz/llc-types";
import { renderArticlesOfOrganization, type ArticlesData } from "@/lib/starbiz/pdf/render";
import { uploadFilingPdf } from "@/lib/starbiz/pdf/upload";
import { formatDate } from "@/lib/starbiz/queries";

type Address = { street: string; city: string; state: string; zip: string };

function asAddress(v: Partial<Address> | null | undefined): Address {
  return { street: v?.street ?? "", city: v?.city ?? "", state: v?.state ?? "", zip: v?.zip ?? "" };
}

// ─── Server-side validation (mirrors client; never trust the client) ──────────

function serverValidate(data: WizardData, persons: PersonRow[]): Record<string, string> {
  const e: Record<string, string> = {};

  if (!data.name.trim()) e.name = "LLC name is required.";
  else if (!/\b(llc|l\.l\.c\.|limited liability company)\b/i.test(data.name))
    e.name = "Name must include 'LLC', 'L.L.C.', or 'Limited Liability Company'.";

  if (!data.managementStructure) e.managementStructure = "Select a management structure.";

  if (!data.principalStreet.trim()) e.principalStreet = "Principal street address is required.";
  if (!data.principalCity.trim())   e.principalCity    = "Principal city is required.";
  if (!data.principalState.trim())  e.principalState   = "Principal state is required.";
  if (!data.principalZip.trim())    e.principalZip     = "Principal ZIP is required.";

  if (!data.raName.trim()) e.raName = "Registered agent name is required.";
  if (data.raState.trim().toUpperCase() !== "FL") e.raState = "Registered agent must be in Florida.";
  if (!data.raStreet.trim()) e.raStreet = "Registered agent street address is required.";
  if (!data.raZip.trim())   e.raZip   = "Registered agent ZIP is required.";
  if (!data.raAccepted)     e.raAccepted = "Registered agent must accept the appointment.";

  if (!persons[0]?.name.trim()) e["person_0_name"] = "At least one member or manager is required.";
  if (!data.organizerName.trim()) e.organizerName = "Organizer name is required.";
  if (!data.organizerStreet.trim()) e.organizerStreet = "Organizer address is required.";
  if (!data.feeAcknowledged) e.feeAcknowledged = "You must acknowledge the filing fee.";

  return e;
}

// ─── Main action ──────────────────────────────────────────────────────────────

export async function submitLLCFormation(
  wizardData: WizardData,
  personRows: PersonRow[],
): Promise<LLCSubmitResult> {
  // 1. Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to file." };

  // 2. Server-side validation
  const valErrors = serverValidate(wizardData, personRows);
  if (Object.keys(valErrors).length) {
    return { fieldErrors: valErrors, returnToStep: 1 };
  }

  // 3. Build JSONB payload for the stored procedure
  const mailingAddress = wizardData.mailingIsSame
    ? { street: wizardData.principalStreet, city: wizardData.principalCity, state: wizardData.principalState, zip: wizardData.principalZip }
    : { street: wizardData.mailingStreet,   city: wizardData.mailingCity,   state: wizardData.mailingState,   zip: wizardData.mailingZip };

  const pForm = {
    name:               wizardData.name,
    managementStructure: wizardData.managementStructure,
    purpose:            wizardData.purpose || "any lawful purpose",
    effectiveDate:      wizardData.effectiveDate || null,
    principalAddress:   { street: wizardData.principalStreet, city: wizardData.principalCity, state: wizardData.principalState, zip: wizardData.principalZip },
    mailingAddress,
    raName:             wizardData.raName,
    raEmail:            wizardData.raEmail || null,
    raAccepted:         wizardData.raAccepted,
    raAddress:          { street: wizardData.raStreet, city: wizardData.raCity, state: wizardData.raState, zip: wizardData.raZip },
    organizer: {
      name:    wizardData.organizerName,
      address: { street: wizardData.organizerStreet, city: wizardData.organizerCity, state: wizardData.organizerState, zip: wizardData.organizerZip },
    },
    officers: personRows
      .filter((p) => p.name.trim())
      .map((p) => ({
        name:         p.name.trim(),
        title:        p.title.trim() || null,
        street:       p.street.trim(),
        city:         p.city.trim(),
        state:        p.state.trim().toUpperCase(),
        zip:          p.zip.trim(),
        ownershipPct: p.ownershipPct.trim() || null,
      })),
    feiEin:           wizardData.feiEin.trim() || null,
    feeAcknowledged:  wizardData.feeAcknowledged,
  };

  // 4. Call atomic stored procedure
  const admin = createSupabaseAdminClient();
  const { data: result, error } = await admin.rpc("create_llc_entity", {
    p_user_id: user.id,
    p_form:    pForm,
  });

  if (error) {
    console.error("[submitLLCFormation] rpc error:", error.message, error.code);
    if (error.message === "NAME_TAKEN") {
      return {
        fieldErrors:  { name: "That name is already in use. Please choose a different name." },
        returnToStep: 1,
      };
    }
    return { error: "Filing could not be submitted. Please try again." };
  }

  // 5. Generate Articles of Organization PDF (best-effort; entity is filed regardless)
  const { document_number: documentNumber, entity_id: entityId, filing_id: filingId } =
    result as { document_number: string; entity_id: string; filing_id: string };

  try {
    const { data: entity } = await admin
      .from("entities")
      .select("name, filed_at, effective_date, principal_address, mailing_address, registered_agent_name, registered_agent_address, type_specific_data")
      .eq("document_number", documentNumber)
      .maybeSingle();

    if (entity) {
      const { data: officers } = await admin
        .from("entity_officers")
        .select("name, title, address")
        .eq("entity_id", entityId)
        .order("name");

      const filedDateLabel     = formatDate(entity.filed_at);
      const effectiveDateLabel = formatDate(entity.effective_date);
      const principal = asAddress(entity.principal_address as Partial<Address>);
      const mailing   = asAddress(entity.mailing_address   as Partial<Address>);
      const sameMailing =
        principal.street === mailing.street && principal.city === mailing.city &&
        principal.state  === mailing.state  && principal.zip  === mailing.zip;
      const tsd = (entity.type_specific_data ?? {}) as { organizer?: { name?: string; address?: unknown } };

      const pdfData: ArticlesData = {
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
        authorizedPersons: (officers ?? []).map((o) => ({
          title:   o.title,
          name:    o.name,
          address: asAddress(o.address as Partial<Address>),
        })),
        organizer: {
          name:    tsd.organizer?.name ?? "",
          address: asAddress(tsd.organizer?.address as Partial<Address>),
        },
      };

      const buffer = await renderArticlesOfOrganization(pdfData);
      await uploadFilingPdf({ documentNumber, entityId, filingId, kind: "articles_of_organization", buffer });
    }
  } catch (pdfErr) {
    console.error("[submitLLCFormation] PDF gen failed (entity still filed):", pdfErr);
  }

  // 6. Redirect to entity detail page
  redirect(`/starbiz/entity/${documentNumber}`);
}
