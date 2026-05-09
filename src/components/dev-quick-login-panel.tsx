"use client";

import { useState } from "react";

const ROLES = [
  { key: "student",   label: "Log in as Student" },
  { key: "professor", label: "Log in as Professor" },
  { key: "admin",     label: "Log in as Admin" },
] as const;

export function DevQuickLoginPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function quickLogin(role: string) {
    setLoading(role);
    setError(null);
    try {
      const res = await fetch("/api/dev/quick-login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ as: role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Quick-login failed.");
        return;
      }
      // Hard navigation — required so the dashboard's Server Components
      // fetch fresh and observe the session cookies the API just Set-Cookie'd.
      // router.push does a soft RSC fetch that can render against a stale
      // (logged-out) cache. The route's own contract documents this.
      window.location.href = json.redirectTo ?? "/";
    } catch {
      setError("Network error — is the dev server running?");
    }
    // Note: do NOT clear `loading` on success — we're navigating away.
    // Clear it only on failure so the buttons re-enable.
    setLoading(null);
  }

  return (
    <div
      style={{
        border:          "2px dashed #B71C1C",
        borderRadius:    "4px",
        backgroundColor: "#FFF8E1",
        padding:         "14px 16px",
        marginTop:       "24px",
        position:        "relative",
      }}
    >
      {/* DEV ONLY badge */}
      <div
        style={{
          position:        "absolute",
          top:             "-1px",
          left:            "-1px",
          backgroundColor: "#B71C1C",
          color:           "#fff",
          fontSize:        "10px",
          fontWeight:      700,
          letterSpacing:   "0.1em",
          padding:         "2px 8px",
          lineHeight:      "1.4",
        }}
      >
        DEV ONLY
      </div>

      <div className="flex flex-col gap-3 pt-3">
        {/* Warning text */}
        <p className="text-xs text-red-800 leading-5">
          Quick-login bypasses password auth. Visible only in development.
          <br />
          <strong>If you see this in production, something is wrong — report immediately.</strong>
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          {ROLES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              disabled={loading !== null}
              onClick={() => quickLogin(key)}
              className="rounded border border-red-800 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-50"
            >
              {loading === key ? "Signing in…" : label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-700">⚠ {error}</p>
        )}
      </div>
    </div>
  );
}
