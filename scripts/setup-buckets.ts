/**
 * Idempotent setup: ensures all Supabase Storage buckets exist.
 * Safe to re-run — skips any bucket that already exists.
 *
 * Buckets managed:
 *   projects          — private. Project source files + catalog images.
 *   professor-photos  — private. Professor profile photos. Authenticated read via RLS.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/setup-buckets.ts
 *   — or —
 *   npm run setup:buckets
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

async function ensureBucket(id: string, isPublic: boolean) {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    console.error(`Failed to list buckets:`, listError.message);
    process.exit(1);
  }
  if (buckets?.some((b) => b.id === id)) {
    console.log(`Bucket "${id}" already exists. Skipping.`);
    return;
  }
  const { error } = await admin.storage.createBucket(id, { public: isPublic });
  if (error) {
    console.error(`Failed to create bucket "${id}":`, error.message);
    process.exit(1);
  }
  console.log(`Bucket "${id}" created (${isPublic ? "public" : "private"}).`);
}

async function main() {
  await ensureBucket("projects", false);
  await ensureBucket("professor-photos", false);
  console.log("Storage setup complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
