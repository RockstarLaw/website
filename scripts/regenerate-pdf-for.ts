/**
 * One-off: regenerate the Articles of Organization PDF for a given entity.
 * Uses the admin client directly (bypasses the auth gate in the server action).
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/regenerate-pdf-for.ts <document_number>
 */

import { createClient } from "@supabase/supabase-js";

import { renderArticlesOfOrganization, type ArticlesData } from "@/lib/starbiz/pdf/render";
import { uploadFilingPdf } from "@/lib/starbiz/pdf/upload";
import { formatDate } from "@/lib/starbiz/queries";

type Address = { street: string; city: string; state: string; zip: string };

function asAddress(v: Partial<Address> | null | undefined): Address {
  return { street: v?.street ?? "", city: v?.city ?? "", state: v?.state ?? "", zip: v?.zip ?? "" };
}

async function main() {
  const docNum = process.argv[2];
  if (!docNum) {
    console.error("usage: regenerate-pdf-for.ts <document_number>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data: entity, error: entityErr } = await admin
    .from("entities")
    .select("id, document_number, name, filed_at, effective_date, principal_address, mailing_address, registered_agent_name, registered_agent_address, type_specific_data")
    .eq("document_number", docNum.toUpperCase())
    .maybeSingle();
  if (entityErr || !entity) { console.error("entity not found", entityErr?.message); process.exit(1); }

  const { data: filing } = await admin
    .from("entity_filings")
    .select("id")
    .eq("entity_id", entity.id)
    .eq("filing_type", "formation")
    .order("filed_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!filing) { console.error("formation filing not found"); process.exit(1); }

  const { data: officers } = await admin
    .from("entity_officers")
    .select("name, title, address")
    .eq("entity_id", entity.id)
    .order("name");

  const filedDateLabel     = formatDate(entity.filed_at);
  const effectiveDateLabel = formatDate(entity.effective_date);
  const principal = asAddress(entity.principal_address as Partial<Address>);
  const mailing   = asAddress(entity.mailing_address   as Partial<Address>);
  const sameMailing =
    principal.street === mailing.street && principal.city === mailing.city &&
    principal.state  === mailing.state  && principal.zip  === mailing.zip;
  const tsd = (entity.type_specific_data ?? {}) as { organizer?: { name?: string; address?: unknown } };

  const data: ArticlesData = {
    documentNumber:     entity.document_number,
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

  const buffer = await renderArticlesOfOrganization(data);
  const result = await uploadFilingPdf({
    documentNumber: entity.document_number,
    entityId:       entity.id,
    filingId:       filing.id,
    kind:           "articles_of_organization",
    buffer,
  });

  console.log(JSON.stringify({ ok: true, documentNumber: entity.document_number, ...result, bytes: buffer.length }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
