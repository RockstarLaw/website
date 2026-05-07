// GET /api/quotes/reject?token=<rejectToken>
//
// Magic-link handler for quote rejection. Same GET-acts pattern as approve.
// See approve/route.ts for the pre-fetcher risk note.

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
      "This rejection link is invalid or has already been used.",
      "#64748b",
    );
  }

  const admin = createSupabaseAdminClient();

  const { data: row } = await admin
    .from("quote_submissions")
    .select("id, status, token_expires_at")
    .eq("reject_token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!row) {
    return htmlPage(
      "Invalid Link",
      "This link is invalid.",
      "This rejection link is invalid or has already been used.",
      "#64748b",
    );
  }

  if (row.token_expires_at && new Date(row.token_expires_at) < new Date()) {
    return htmlPage(
      "Expired",
      "This link has expired.",
      "The rejection link expired.",
      "#92400e",
    );
  }

  const { error } = await admin
    .from("quote_submissions")
    .update({
      status: "rejected",
      approve_token: null,
      reject_token: null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) {
    console.error("[quotes/reject] update error:", error.message);
    return htmlPage(
      "Error",
      "Something went wrong.",
      "Unable to reject this quote. Please try again.",
      "#b91c1c",
    );
  }

  return htmlPage(
    "Rejected",
    "Quote rejected.",
    "The submitter will not be notified.",
    "#b91c1c",
  );
}
