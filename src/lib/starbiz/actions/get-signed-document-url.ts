"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 3600;

export async function getSignedDocumentUrl(filingDocumentId: string): Promise<string | null> {
  // Sign-in required — public corpus reads are still gated to authenticated users.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data: doc } = await admin
    .from("filing_documents")
    .select("storage_path")
    .eq("id", filingDocumentId)
    .maybeSingle();
  if (!doc?.storage_path) return null;

  const { data: signed } = await admin.storage
    .from("starbiz-documents")
    .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SECONDS);

  return signed?.signedUrl ?? null;
}
