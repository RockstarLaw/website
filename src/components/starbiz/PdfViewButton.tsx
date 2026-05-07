"use client";

import { useState } from "react";
import { getSignedDocumentUrl } from "@/lib/starbiz/actions/get-signed-document-url";

type Props = {
  filingDocumentId: string;
  label?: string;
};

export function PdfViewButton({ filingDocumentId, label = "View" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const url = await getSignedDocumentUrl(filingDocumentId);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        color: loading ? "#888" : "#003366",
        background: "none",
        border: "none",
        padding: 0,
        cursor: loading ? "default" : "pointer",
        textDecoration: loading ? "none" : "underline",
      }}
    >
      {loading ? "Loading…" : label}
    </button>
  );
}
