"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  DirectorRow,
  OfficerRow,
  ProfitCorpSubmitResult,
  WizardData,
} from "@/lib/starbiz/profit-corp-types";

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

// ─── Server-side validation (mirrors client; never trust the client) ──────────

function serverValidate(
  data: WizardData,
  directors: DirectorRow[],
  officers: OfficerRow[],
): Record<string, string> {
  const e: Record<string, string> = {};

  // Step 1 — Identity & Stock
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

  // Step 2 — Addresses
  if (!data.principalStreet.trim()) e.principalStreet = "Principal street address is required.";
  if (!data.principalCity.trim())   e.principalCity    = "Principal city is required.";
  if (!data.principalState.trim())  e.principalState   = "Principal state is required.";
  if (!data.principalZip.trim())    e.principalZip     = "Principal ZIP is required.";

  // Step 3 — Registered Agent
  if (!data.raName.trim()) e.raName = "Registered agent name is required.";
  if (data.raState.trim().toUpperCase() !== "FL") e.raState = "Registered agent must be in Florida.";
  if (!data.raStreet.trim()) e.raStreet = "Registered agent street address is required.";
  if (!data.raZip.trim())    e.raZip    = "Registered agent ZIP is required.";
  if (!data.raAccepted)      e.raAccepted = "Registered agent must accept the appointment.";

  // Step 4 — Directors, Officers, Incorporator
  if (!directors[0]?.name?.trim()) e["director_0_name"] = "At least one director is required.";
  if (!officers[0]?.name?.trim())  e["officer_0_name"]  = "At least one officer is required.";
  if (!data.incorporatorName.trim())   e.incorporatorName   = "Incorporator name is required.";
  if (!data.incorporatorStreet.trim()) e.incorporatorStreet = "Incorporator address is required.";
  if (!data.feeAcknowledged)           e.feeAcknowledged    = "You must acknowledge the filing fee.";

  return e;
}

// Convert "12.345" dollars → 1234 cents. Blank or "0" → null (no par value).
// Caller must validate first; this returns null for any non-numeric input.
function parValueDollarsToCents(input: string): number | null {
  const s = input.trim();
  if (!s || s === "0") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function stepForField(field: string): 1 | 2 | 3 | 4 {
  if (field.startsWith("principal") || field.startsWith("mailing")) return 2;
  if (field.startsWith("ra")) return 3;
  if (
    field.startsWith("director_") ||
    field.startsWith("officer_") ||
    field.startsWith("incorporator") ||
    field === "feeAcknowledged" ||
    field === "feiEin"
  ) {
    return 4;
  }
  return 1;
}

// ─── Main action (Phase 3.1a placeholder — no DB write yet) ───────────────────

export async function submitProfitCorp(
  _prevState: ProfitCorpSubmitResult | null,
  formData: FormData,
): Promise<ProfitCorpSubmitResult> {
  // 1. Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to file." };

  // 2. Parse FormData → typed wizard payload
  const wizardData   = readWizardData(formData);
  const directorRows = readRows<DirectorRow>(formData, "directors");
  const officerRows  = readRows<OfficerRow>(formData, "officers");

  // 3. Server-side validation
  const valErrors = serverValidate(wizardData, directorRows, officerRows);
  if (Object.keys(valErrors).length) {
    const firstKey = Object.keys(valErrors)[0];
    return { fieldErrors: valErrors, returnToStep: stepForField(firstKey) };
  }

  // 4. parValueDollars → integer cents (validated above; null = no par value).
  // Persistence comes in Phase 3.1c.
  const _parValueCents = parValueDollarsToCents(wizardData.parValueDollars);
  void _parValueCents;

  // 5. Phase 3.1a: no rpc call yet
  return { ok: true };
}
