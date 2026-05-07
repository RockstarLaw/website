/**
 * StarBiz public-corpus query functions.
 * Read-only. Uses the admin client since these are public-corpus reads;
 * auth is enforced at the route level (proxy middleware requires sign-in).
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type EntityResultRow = {
  document_number: string;
  name: string;
  status: string;
  filing_type: string;   // derived from entity_type for display
  filed_date: string;    // date-only string MM/DD/YYYY
};

export type EntityOfficer = {
  id: string;
  role: string;
  name: string;
  title: string | null;
  address: { street?: string; city?: string; state?: string; zip?: string } | null;
  ownership_percent: number | null;
};

export type EntityFiling = {
  id: string;
  filing_type: string;
  filed_at: string;
  effective_date: string | null;
  fee_paid_cents: number | null;
};

export type EntityDetail = {
  id: string;
  document_number: string;
  name: string;
  status: string;
  entity_type: string;
  governance_structure: string | null;
  filed_at: string;
  effective_date: string | null;
  fei_ein: string | null;
  principal_address: { street: string; city: string; state: string; zip: string } | null;
  mailing_address: { street: string; city: string; state: string; zip: string } | null;
  registered_agent_name: string | null;
  registered_agent_address: { street: string; city: string; state: string; zip: string } | null;
  type_specific_data: Record<string, unknown>;
  officers: EntityOfficer[];
  filings: EntityFiling[];
};

// ─── Display helpers ──────────────────────────────────────────────────────────

const ENTITY_TYPE_LABELS: Record<string, string> = {
  llc:           "Florida Limited Liability Company",
  corp:          "Florida Profit Corporation",
  nonprofit_corp:"Florida Non-Profit Corporation",
  lp:            "Florida Limited Partnership",
  dba:           "Fictitious Name",
  trademark:     "Florida State Trademark",
};

export function entityTypeLabel(t: string): string {
  return ENTITY_TYPE_LABELS[t] ?? t.toUpperCase();
}

function formatDate(ts: string | null | undefined): string {
  if (!ts) return "N/A";
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function toResultRow(row: {
  document_number: string;
  name: string;
  status: string;
  entity_type: string;
  filed_at: string;
}): EntityResultRow {
  return {
    document_number: row.document_number,
    name:            row.name,
    status:          row.status,
    filing_type:     entityTypeLabel(row.entity_type),
    filed_date:      formatDate(row.filed_at),
  };
}

const BASE_SELECT = "document_number, name, status, entity_type, filed_at";

// ─── Search functions ─────────────────────────────────────────────────────────

export async function searchByName(q: string): Promise<EntityResultRow[]> {
  if (!q.trim()) return [];
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("entities")
    .select(BASE_SELECT)
    .ilike("name", `%${q.trim()}%`)
    .order("name")
    .limit(50);
  if (error) { console.error("[searchByName]", error.message); return []; }
  return (data ?? []).map(toResultRow);
}

export async function searchByDocumentNumber(q: string): Promise<EntityResultRow[]> {
  if (!q.trim()) return [];
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("entities")
    .select(BASE_SELECT)
    .eq("document_number", q.trim().toUpperCase())
    .limit(1);
  if (error) { console.error("[searchByDocumentNumber]", error.message); return []; }
  return (data ?? []).map(toResultRow);
}

export async function searchByOfficer(q: string): Promise<EntityResultRow[]> {
  if (!q.trim()) return [];
  const admin = createSupabaseAdminClient();

  // Step 1: find matching officer entity_ids (deduplicated)
  const { data: officers, error: offError } = await admin
    .from("entity_officers")
    .select("entity_id")
    .ilike("name", `%${q.trim()}%`)
    .limit(100);
  if (offError) { console.error("[searchByOfficer officers]", offError.message); return []; }
  if (!officers || officers.length === 0) return [];

  const entityIds = [...new Set(officers.map(o => o.entity_id))].slice(0, 50);

  // Step 2: fetch those entities
  const { data, error } = await admin
    .from("entities")
    .select(BASE_SELECT)
    .in("id", entityIds)
    .order("name");
  if (error) { console.error("[searchByOfficer entities]", error.message); return []; }
  return (data ?? []).map(toResultRow);
}

export async function searchByFei(q: string): Promise<EntityResultRow[]> {
  if (!q.trim()) return [];
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("entities")
    .select(BASE_SELECT)
    .eq("fei_ein", q.trim())
    .limit(50);
  if (error) { console.error("[searchByFei]", error.message); return []; }
  return (data ?? []).map(toResultRow);
}

// Fictitious-name, trademark, trademark-owner: return empty until Slice 4
export async function searchByFictitiousOwner(q: string): Promise<EntityResultRow[]> {
  if (!q.trim()) return [];
  return [];
}
export async function searchByTrademark(q: string): Promise<EntityResultRow[]> {
  if (!q.trim()) return [];
  return [];
}
export async function searchByTrademarkOwner(q: string): Promise<EntityResultRow[]> {
  if (!q.trim()) return [];
  return [];
}

// ─── Entity detail ────────────────────────────────────────────────────────────

export async function getEntityByDocumentNumber(docNum: string): Promise<EntityDetail | null> {
  const admin = createSupabaseAdminClient();
  const upper = docNum.trim().toUpperCase();

  const { data: entity, error: entityError } = await admin
    .from("entities")
    .select("id, document_number, name, status, entity_type, governance_structure, filed_at, effective_date, fei_ein, principal_address, mailing_address, registered_agent_name, registered_agent_address, type_specific_data")
    .eq("document_number", upper)
    .maybeSingle();

  if (entityError) { console.error("[getEntityByDocumentNumber]", entityError.message); return null; }
  if (!entity) return null;

  const [{ data: officers }, { data: filings }] = await Promise.all([
    admin.from("entity_officers").select("id, role, name, title, address, ownership_percent").eq("entity_id", entity.id).order("name"),
    admin.from("entity_filings").select("id, filing_type, filed_at, effective_date, fee_paid_cents").eq("entity_id", entity.id).order("filed_at", { ascending: true }),
  ]);

  return {
    id:                         entity.id,
    document_number:            entity.document_number,
    name:                       entity.name,
    status:                     entity.status,
    entity_type:                entity.entity_type,
    governance_structure:       entity.governance_structure,
    filed_at:                   entity.filed_at,
    effective_date:             entity.effective_date,
    fei_ein:                    entity.fei_ein,
    principal_address:          entity.principal_address as EntityDetail["principal_address"],
    mailing_address:            entity.mailing_address   as EntityDetail["mailing_address"],
    registered_agent_name:      entity.registered_agent_name,
    registered_agent_address:   entity.registered_agent_address as EntityDetail["registered_agent_address"],
    type_specific_data:         (entity.type_specific_data ?? {}) as Record<string, unknown>,
    officers:                   (officers ?? []) as EntityOfficer[],
    filings:                    (filings  ?? []) as EntityFiling[],
  };
}

export { formatDate };
