"use server";

/**
 * Profit Corp Payment Page — Server Action (R8-5)
 *
 * submitPayment() → void
 *
 * Called when the user clicks either payment button (credit card or e-file).
 * Both buttons submit to /starbiz/filing/profit-corp/receipt via server-side
 * redirect. Verifies auth + session ownership, advances current_step to
 * 'receipt', then redirects.
 *
 * Note: No real payment processing occurs — simulated learning environment.
 * The cash register easter egg fires client-side before this action runs.
 *
 * Mirrors LLC submitPayment (R7b-5) with:
 *   • filing_type = 'corp' in fallback query
 *   • redirect target = /starbiz/filing/profit-corp/receipt
 *   • disclaimer fallback = /starbiz/filing/profit-corp/disclaimer
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitPayment(formData: FormData): Promise<void> {
  // 1. Auth check
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Resolve session via hidden track_number
  const trackNumber = formData.get("track_number")?.toString()?.trim() ?? "";

  const admin = createSupabaseAdminClient();
  let sessionId: string | null = null;

  if (trackNumber) {
    const { data: byTrack } = await admin
      .from("filing_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("tracking_number", trackNumber)
      .eq("status", "in_progress")
      .limit(1)
      .single();
    sessionId = byTrack?.id ?? null;
  }

  // Fallback: most recent in-progress corp session
  if (!sessionId) {
    const { data: fallback } = await admin
      .from("filing_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("filing_type", "corp")
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();
    sessionId = fallback?.id ?? null;
  }

  if (!sessionId) redirect("/starbiz/filing/profit-corp/disclaimer");

  // 3. Advance current_step to 'receipt'
  await admin
    .from("filing_sessions")
    .update({
      current_step: "receipt",
      last_saved_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  // 4. Redirect to receipt (R8-6 — will 404 until receipt capture exists)
  redirect("/starbiz/filing/profit-corp/receipt");
}
