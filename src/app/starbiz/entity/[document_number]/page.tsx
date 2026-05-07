import Link from "next/link";
import { notFound } from "next/navigation";

import { StarBizShell } from "@/components/starbiz/StarBizShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ document_number: string }>;
}) {
  const { document_number } = await params;

  const admin = createSupabaseAdminClient();
  const { data: entity } = await admin
    .from("entities")
    .select("document_number, name, entity_type, status, filed_at, effective_date")
    .eq("document_number", document_number.toUpperCase())
    .maybeSingle();

  if (!entity) notFound();

  const filedDate = new Date(entity.filed_at).toLocaleDateString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
  });

  return (
    <StarBizShell>
      <div style={{ textAlign: "center", padding: "24px 8px" }}>

        {/* Success indicator */}
        <div style={{ color: "#2E7D32", fontFamily: "Times New Roman, Georgia, serif", fontSize: "20px", fontWeight: "bold", marginBottom: "6px" }}>
          ✓ Filing Successful
        </div>
        <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", color: "#555", marginBottom: "16px" }}>
          Your LLC has been filed with the RockStar Department of State.
        </p>

        {/* Document number — large monospace */}
        <div style={{
          fontFamily: "Courier New, Courier, monospace", fontSize: "22px",
          fontWeight: "bold", color: "#003366", border: "2px solid #003366",
          display: "inline-block", padding: "8px 24px", marginBottom: "12px",
        }}>
          {entity.document_number}
        </div>

        {/* Entity name */}
        <p style={{ fontFamily: "Times New Roman, Georgia, serif", fontSize: "17px", fontWeight: "bold", color: "#000", marginBottom: "4px" }}>
          {entity.name}
        </p>
        <p style={{ fontFamily: "Arial", fontSize: "11px", color: "#666" }}>
          Limited Liability Company &nbsp;·&nbsp; Status: <strong>{entity.status}</strong> &nbsp;·&nbsp; Filed: {filedDate}
        </p>

        {/* Phase 2.2 note */}
        <p style={{ fontFamily: "Arial", fontSize: "10px", color: "#999", marginTop: "20px", fontStyle: "italic", borderTop: "1px solid #ddd", paddingTop: "10px" }}>
          This page will be replaced with the full Sunbiz-style entity detail view in Phase 2.3.
        </p>

        {/* Navigation */}
        <div style={{ marginTop: "14px", display: "flex", gap: "16px", justifyContent: "center" }}>
          <Link href="/starbiz" style={{ color: "#800000", fontFamily: "Arial", fontSize: "12px", textDecoration: "underline" }}>
            ← StarBiz Home
          </Link>
          <Link href="/starbiz/search/by-name" style={{ color: "#800000", fontFamily: "Arial", fontSize: "12px", textDecoration: "underline" }}>
            Search Records
          </Link>
        </div>
      </div>
    </StarBizShell>
  );
}
