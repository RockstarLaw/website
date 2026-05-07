"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { renderArticlesOfOrganization, type ArticlesData } from "@/lib/starbiz/pdf/render";
import { uploadFilingPdf } from "@/lib/starbiz/pdf/upload";
import { formatDate } from "@/lib/starbiz/queries";

type Address = { street: string; city: string; state: string; zip: string };

function asAddress(value: unknown): Address {
  const v = (value ?? {}) as Partial<Address>;
  return {
    street: v.street ?? "",
    city:   v.city   ?? "",
    state:  v.state  ?? "",
    zip:    v.zip    ?? "",
  };
}

export async function regenerateFilingPdf(
  entityId: string,
): Promise<{ ok: boolean; error?: string }> {
  // Auth gate — anyone signed in can trigger regeneration on a public-corpus
  // entity. Document content is deterministic from row state, so this is safe.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign-in required." };

  const admin = createSupabaseAdminClient();

  const { data: entity, error: entityError } = await admin
    .from("entities")
    .select("id, document_number, name, filed_at, effective_date, principal_address, mailing_address, registered_agent_name, registered_agent_address, type_specific_data")
    .eq("id", entityId)
    .maybeSingle();
  if (entityError || !entity) return { ok: false, error: "Entity not found." };

  const { data: filing, error: filingError } = await admin
    .from("entity_filings")
    .select("id, filing_data, effective_date, filed_at")
    .eq("entity_id", entityId)
    .eq("filing_type", "formation")
    .order("filed_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (filingError || !filing) return { ok: false, error: "Formation filing not found." };

  const { data: officers, error: officersError } = await admin
    .from("entity_officers")
    .select("name, title, address")
    .eq("entity_id", entityId)
    .order("name");
  if (officersError) return { ok: false, error: "Officer lookup failed." };

  const filedDateLabel     = formatDate(entity.filed_at);
  const effectiveDateLabel = formatDate(entity.effective_date);
  const effectiveOnFiling  = filedDateLabel === effectiveDateLabel;

  const principal = asAddress(entity.principal_address);
  const mailing   = asAddress(entity.mailing_address);
  const sameMailing =
    principal.street === mailing.street &&
    principal.city   === mailing.city   &&
    principal.state  === mailing.state  &&
    principal.zip    === mailing.zip;

  const tsd = (entity.type_specific_data ?? {}) as { organizer?: { name?: string; address?: unknown } };
  const organizer = {
    name:    tsd.organizer?.name ?? "",
    address: asAddress(tsd.organizer?.address),
  };

  const data: ArticlesData = {
    documentNumber:     entity.document_number,
    entityName:         entity.name,
    filedDateLabel,
    effectiveDateLabel,
    effectiveOnFiling,
    principalAddress:   principal,
    mailingAddress:     sameMailing ? null : mailing,
    registeredAgent: {
      name:    entity.registered_agent_name ?? "",
      address: asAddress(entity.registered_agent_address),
    },
    authorizedPersons: (officers ?? []).map((o) => ({
      title:   o.title,
      name:    o.name,
      address: asAddress(o.address),
    })),
    organizer,
  };

  try {
    const buffer = await renderArticlesOfOrganization(data);
    await uploadFilingPdf({
      documentNumber: entity.document_number,
      entityId:       entity.id,
      filingId:       filing.id,
      kind:           "articles_of_organization",
      buffer,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[regenerateFilingPdf] failed:", message);
    return { ok: false, error: message };
  }

  revalidatePath(`/starbiz/entity/${entity.document_number}`);
  return { ok: true };
}
