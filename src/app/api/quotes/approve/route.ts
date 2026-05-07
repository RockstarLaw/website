// GET /api/quotes/approve?token=<approveToken>
//
// Magic-link handler for quote approval. The reviewer clicks this link from
// their email and the quote is immediately marked approved.
//
// NOTE: GET routes accept the small risk that email pre-fetchers (some corporate
// spam filters) may fetch links without human intent, triggering an unintended
// approval. If this becomes a problem, switch to a two-step pattern: GET shows
// a confirm page, POST actually acts. For now, the simpler GET-acts pattern is
// acceptable given the low-stakes nature of quote approvals.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function htmlPage(title: string, heading: string, body: string, accent: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title} — RockStar Law</title>
  <style>
    body{font-family:system-ui,Arial,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#111;background:#fff;text-align:center;}
    h1{font-size:22px;font-weight:700;margin-bottom:12px;}
    p{font-size:15px;color:#555;line-height:1.6;}
    .badge{display:inline-block;border-radius:9999px;padding:6px 18px;font-size:13px;font-weight:600;color:#fff;background:${accent};margin-bottom:24px;}
    .wordmark{font-size:12px;color:#999;margin-top:48px;letter-spacing:.08em;}
  </style>
</head>
<body>
  <div class="badge">${title}</div>
  <h1>${heading}</h1>
  <p>${body}</p>
  <p class="wordmark">ROCKSTAR LAW</p>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return htmlPage(
      "Invalid Link",
      "This link is invalid.",
      "This approval link is invalid or has already been used.",
      "#64748b",
    );
  }

  const admin = createSupabaseAdminClient();

  const { data: row } = await admin
    .from("quote_submissions")
    .select("id, status, token_expires_at")
    .eq("approve_token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!row) {
    return htmlPage(
      "Invalid Link",
      "This link is invalid.",
      "This approval link is invalid or has already been used.",
      "#64748b",
    );
  }

  if (row.token_expires_at && new Date(row.token_expires_at) < new Date()) {
    return htmlPage(
      "Expired",
      "This link has expired.",
      "The approval link expired. Contact the submitter if you still want to approve this quote.",
      "#92400e",
    );
  }

  const { error } = await admin
    .from("quote_submissions")
    .update({
      status: "approved",
      approve_token: null,
      reject_token: null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) {
    console.error("[quotes/approve] update error:", error.message);
    return htmlPage(
      "Error",
      "Something went wrong.",
      "Unable to approve this quote. Please try again.",
      "#b91c1c",
    );
  }

  return htmlPage(
    "Approved",
    "Quote approved.",
    "The quote will now appear in the RockStar Law dashboard rotation.",
    "#15803d",
  );
}
