"use server";

/**
 * Profit Corp Filing-Info Page — Server Action (R8-4)
 *
 * submitFilingInfo() → void
 *
 * Called when user clicks "Continue" on the filing-info interstitial.
 * Verifies auth + session ownership, advances current_step to 'payment',
 * then redirects to /starbiz/filing/profit-corp/payment.
 *
 * Mirrors LLC submitFilingInfo (R7b-4) with:
 *   • filing_type = 'corp' in fallback query
 *   • redirect target = /starbiz/filing/profit-corp/payment
 *   • disclaimer fallback = /starbiz/filing/profit-corp/disclaimer
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitFilingInfo(formData: FormData): Promise<void> {
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

  // 3. Advance current_step to 'payment'
  await admin
    .from("filing_sessions")
    .update({
      current_step: "payment",
      last_saved_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  // 4. Redirect to payment (R8-5 — will 404 until that phase ships)
  redirect("/starbiz/filing/profit-corp/payment");
}
