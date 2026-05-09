/**
 * EIN wizard dev seed — creates a ready-to-test SMLLC ein_applications row.
 *
 * Inserts one in-progress EIN application for the dev professor account
 * (test-professor@rockstarlaw.dev) with W1+W2+W3 form_data already populated,
 * current_step = "additional_details", so you can jump straight to W4a at
 * http://localhost:3000/irs/ein/apply/additional-details without running
 * through the full wizard.
 *
 * Safe to run multiple times — DELETEs any existing in-progress row for the
 * dev professor before inserting a fresh one.
 *
 * Production guard: refuses to run against the production Supabase URL.
 *
 * Usage:
 *   npx tsx scripts/seed-ein-application.ts
 *   -- or --
 *   npm run seed:ein-dev
 */

import { createClient } from "@supabase/supabase-js";

const PRODUCTION_REF = "ytunujsljzfgsscovznf";
const DEV_PROFESSOR_EMAIL = "test-professor@rockstarlaw.dev";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (url.includes(PRODUCTION_REF)) {
  if (!process.argv.includes("--i-am-sure")) {
    console.error(
      "\nREFUSING — production Supabase URL detected (ref: " + PRODUCTION_REF + ").\n" +
      "Aborting to protect production data.\n" +
      "Pass --i-am-sure to override.\n",
    );
    process.exit(1);
  }
  console.warn("⚠  --i-am-sure passed. Running against production. You asked for it.");
}

const admin = createClient(url, key, { auth: { persistSession: false } });

async function main(): Promise<void> {

// ── 1. Find the dev professor auth user ID ────────────────────────────────────

const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
const professor = (listData?.users ?? []).find(u => u.email === DEV_PROFESSOR_EMAIL);

if (!professor) {
  console.error(
    `\nDev professor account not found: ${DEV_PROFESSOR_EMAIL}\n` +
    "Run 'npm run seed:dev-users' first to create the dev accounts.\n",
  );
  process.exit(1);
}

const userId = professor.id;
console.log(`\nDev professor: ${DEV_PROFESSOR_EMAIL} (${userId})`);

// ── 2. Delete any existing in-progress row for this user ─────────────────────

const { error: delErr } = await admin
  .from("ein_applications")
  .delete()
  .eq("user_id", userId)
  .eq("status", "in_progress");

if (delErr) {
  console.error("Delete failed:", delErr.message);
  process.exit(1);
}
console.log("  Cleared existing in-progress row (if any).");

// ── 3. Build the form_data payload ────────────────────────────────────────────
//
// Mirrors exactly what the W1 → W2 → W3 server actions would write:
//
//  W1 (submitLegalStructure):
//    legal_structure   = "LLC"
//    members_of_llc    = "1"   ← numeric count string (NOT "SINGLE_MEMBER_LLC")
//    llc_state         = "FL"  ← state/territory where LLC is organized
//
//  W2 (submitIdentity):  verbatim field names from IdentityForm.tsx / actions.ts
//    responsiblePartyType  = "INDIVIDUAL"
//    firstName             = "John"
//    lastName              = "Taddeo"
//    tinType               = "SSN"
//    tin                   = "123-45-6789"   ← fake SSN for dev; stripped on insert
//
//  W3 (submitAddress): verbatim field names from AddressForm.tsx / actions.ts
//    physicalStreet    = "123 Test Street"
//    physicalCity      = "Fort Lauderdale"
//    physicalState     = "FL"
//    physicalZipCode   = "33301"
//    thePhone          = "5555551234"
//    otherAddress      = "no"

const formData = {
  // W1
  legal_structure: "LLC",
  members_of_llc:  "1",
  llc_state:       "FL",

  // W2 — field names as written by submitIdentity() action
  responsiblePartyType: "INDIVIDUAL",
  firstName:            "John",
  lastName:             "Taddeo",
  tinType:              "SSN",
  tin:                  "123456789",   // fake 9-digit dev SSN

  // W3 — field names as written by submitAddress() action
  physicalStreet:    "123 Test Street",
  physicalCity:      "Fort Lauderdale",
  physicalState:     "FL",
  physicalZipCode:   "33301",
  thePhone:          "5555551234",
  otherAddress:      "no",
};

// ── 4. Insert the seeded row ──────────────────────────────────────────────────

const { data: inserted, error: insertErr } = await admin
  .from("ein_applications")
  .insert({
    user_id:      userId,
    status:       "in_progress",
    current_step: "additional_details",
    form_data:    formData,
  })
  .select("id")
  .single();

if (insertErr) {
  console.error("Insert failed:", insertErr.message);
  process.exit(1);
}

console.log(`\n✅ Seeded ein_applications row: ${inserted.id}`);
console.log(`   user_id:      ${userId}`);
console.log(`   current_step: additional_details`);
console.log(`   legal_structure: LLC  |  members_of_llc: 1  (→ SINGLE_MEMBER_LLC gate)`);
console.log("\nNow sign in as test-professor@rockstarlaw.dev and visit:");
console.log("  http://localhost:3000/irs/ein/apply/additional-details\n");
}

main().catch((err: unknown) => { console.error(err); process.exit(1); });
