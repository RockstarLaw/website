/**
 * Uploads a generated PDF buffer to the starbiz-documents bucket and
 * upserts a filing_documents row pointing at the storage path.
 *
 * Idempotent: if a row already exists for (entity_id, document_kind),
 * the storage object is overwritten and the row is updated in place.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type UploadFilingPdfArgs = {
  documentNumber: string;
  entityId: string;
  filingId: string;
  kind: string;          // e.g. 'articles_of_organization'
  buffer: Buffer;
};

export type UploadFilingPdfResult = {
  storagePath: string;
  filingDocumentId: string;
};

export async function uploadFilingPdf(args: UploadFilingPdfArgs): Promise<UploadFilingPdfResult> {
  const admin = createSupabaseAdminClient();
  const filename    = `${args.kind}.pdf`;
  const storagePath = `entities/${args.documentNumber}/${filename}`;

  // 1. Upload (overwrite-safe).
  const { error: uploadError } = await admin.storage
    .from("starbiz-documents")
    .upload(storagePath, args.buffer, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadError) {
    throw new Error(`storage upload failed: ${uploadError.message}`);
  }

  // 2. Upsert the filing_documents row.
  const { data: existing } = await admin
    .from("filing_documents")
    .select("id")
    .eq("entity_id", args.entityId)
    .eq("document_kind", args.kind)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await admin
      .from("filing_documents")
      .update({
        filing_id:         args.filingId,
        storage_path:      storagePath,
        original_filename: filename,
        mime_type:         "application/pdf",
        file_size_bytes:   args.buffer.length,
        generated_at:      new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (updateError) {
      throw new Error(`filing_documents update failed: ${updateError.message}`);
    }
    return { storagePath, filingDocumentId: existing.id };
  }

  const { data: inserted, error: insertError } = await admin
    .from("filing_documents")
    .insert({
      entity_id:         args.entityId,
      filing_id:         args.filingId,
      document_kind:     args.kind,
      storage_path:      storagePath,
      original_filename: filename,
      mime_type:         "application/pdf",
      file_size_bytes:   args.buffer.length,
    })
    .select("id")
    .single();
  if (insertError) {
    throw new Error(`filing_documents insert failed: ${insertError.message}`);
  }
  return { storagePath, filingDocumentId: inserted.id };
}
