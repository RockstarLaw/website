"use server";

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LLCSubmitResult, PersonRow, WizardData } from "@/lib/starbiz/llc-types";

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

  // 5. Redirect to entity detail page (Phase 2.3 builds the full page)
  const documentNumber = (result as { document_number: string }).document_number;
  redirect(`/starbiz/entity/${documentNumber}`);
}
