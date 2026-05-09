/**
 * Uploads a generated CP575G PDF buffer to the irs-documents bucket and
 * upserts an ein_documents row pointing at the storage path.
 *
 * Idempotent: if a row already exists for (ein_application_id, document_kind),
 * the storage object is overwritten and the row is updated in place.
 *
 * Pattern mirrors src/lib/starbiz/pdf/upload.ts exactly.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type UploadCp575gArgs = {
  einApplicationId: string;   // UUID from ein_applications
  ein:              string;   // e.g. "99-1234567"
  buffer:           Buffer;
};

export type UploadCp575gResult = {
  storagePath:  string;
  documentId:   string;
};

const BUCKET       = "irs-documents";
const DOCUMENT_KIND = "cp575g";

export async function uploadCp575gPdf(args: UploadCp575gArgs): Promise<UploadCp575gResult> {
  const admin = createSupabaseAdminClient();

  // Storage path: ein/<ein_without_dash>/cp575g.pdf
  const einWithoutDash = args.ein.replace("-", "");
  const storagePath    = `ein/${einWithoutDash}/${DOCUMENT_KIND}.pdf`;

  // 1. Upload (overwrite-safe via upsert: true)
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, args.buffer, {
      contentType: "application/pdf",
      upsert:      true,
    });
  if (uploadError) {
    throw new Error(`irs-documents upload failed: ${uploadError.message}`);
  }

  // 2. Upsert ein_documents row (idempotent on UNIQUE(ein_application_id, document_kind))
  const { data: existing } = await admin
    .from("ein_documents")
    .select("id")
    .eq("ein_application_id", args.einApplicationId)
    .eq("document_kind", DOCUMENT_KIND)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await admin
      .from("ein_documents")
      .update({
        storage_path:    storagePath,
        file_size_bytes: args.buffer.length,
        generated_at:    new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (updateError) {
      throw new Error(`ein_documents update failed: ${updateError.message}`);
    }
    return { storagePath, documentId: existing.id };
  }

  const { data: inserted, error: insertError } = await admin
    .from("ein_documents")
    .insert({
      ein_application_id: args.einApplicationId,
      document_kind:      DOCUMENT_KIND,
      storage_path:       storagePath,
      file_size_bytes:    args.buffer.length,
    })
    .select("id")
    .single();
  if (insertError) {
    throw new Error(`ein_documents insert failed: ${insertError.message}`);
  }
  return { storagePath, documentId: inserted.id };
}
