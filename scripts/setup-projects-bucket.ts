/**
 * One-time idempotent setup: creates the "projects" Supabase Storage bucket.
 * Safe to re-run — exits cleanly if bucket already exists.
 *
 * Usage:
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/setup-projects-bucket.ts
 *   — or —
 *   npm run setup:projects-bucket
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();

  if (listError) {
    console.error("Failed to list buckets:", listError.message);
    process.exit(1);
  }

  if (buckets?.some((b) => b.id === "projects")) {
    console.log('Bucket "projects" already exists. Nothing to do.');
    return;
  }

  const { error: createError } = await admin.storage.createBucket("projects", {
    public: false,
  });

  if (createError) {
    console.error("Failed to create bucket:", createError.message);
    process.exit(1);
  }

  console.log('Bucket "projects" created successfully (private).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
