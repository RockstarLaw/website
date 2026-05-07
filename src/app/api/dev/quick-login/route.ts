/**
 * Dev-only quick-login endpoint. THREE gates — ALL must pass or returns 404.
 *
 * Gate 1: process.env.NODE_ENV !== 'production'
 * Gate 2: process.env.ALLOW_DEV_QUICK_LOGIN === 'true'
 * Gate 3: request hostname is not a known production domain
 *
 * Usage: POST /api/dev/quick-login  body: { as: "student" | "professor" | "admin" }
 * On success: returns { redirectTo: "/dashboard/..." } with session cookies set.
 */

import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const PROD_HOSTNAMES = ["rockstarlaw.com", "vercel.app"];

const EMAIL_MAP: Record<string, string> = {
  student:   "test-student@rockstarlaw.dev",
  professor: "test-professor@rockstarlaw.dev",
  admin:     "test-admin@rockstarlaw.dev",
};

const REDIRECT_MAP: Record<string, string> = {
  student:   "/dashboard/student",
  professor: "/dashboard/professor",
  admin:     "/dashboard/admin",
};

function is404(): NextResponse {
  // Deliberately sparse — give nothing to an attacker probing the endpoint.
  return new NextResponse(null, { status: 404 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Gate 1: not production NODE_ENV ──────────────────────────────────────
  if (process.env.NODE_ENV === "production") return is404();

  // ── Gate 2: explicit opt-in env var ──────────────────────────────────────
  if (process.env.ALLOW_DEV_QUICK_LOGIN !== "true") return is404();

  // ── Gate 3: hostname not a production domain ──────────────────────────────
  const host = request.headers.get("host") ?? "";
  const isProdHost = PROD_HOSTNAMES.some(
    (d) => host === d || host.endsWith("." + d),
  );
  if (isProdHost) return is404();

  // ── Parse body ────────────────────────────────────────────────────────────
  let role: string;
  try {
    const body = await request.json();
    role = String(body.as ?? "").toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!EMAIL_MAP[role]) {
    return NextResponse.json(
      { error: `Unknown role '${role}'. Use: student, professor, or admin.` },
      { status: 400 },
    );
  }

  const email    = EMAIL_MAP[role];
  const password = process.env.QUICK_LOGIN_DEV_PASSWORD ?? "Rockstar2026!Dev#Test";

  // ── Log every invocation (security visibility) ────────────────────────────
  console.warn(
    `[DEV QUICK-LOGIN] role=${role} ts=${new Date().toISOString()} host=${host}`,
  );

  // ── Sign in via server-side Supabase client ───────────────────────────────
  // createSupabaseServerClient writes session cookies via cookieStore.set(),
  // which Next.js includes in the response headers automatically.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("invalid login")) {
      return NextResponse.json(
        {
          error:
            "Test user not found or password mismatch. Run npm run seed:dev-users first.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return redirect target — client does window.location.href so that the
  // freshly-set session cookies are included in the next navigation.
  return NextResponse.json({ redirectTo: REDIRECT_MAP[role] });
}
