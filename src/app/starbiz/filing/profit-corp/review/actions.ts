"use server";

/**
 * Profit Corp Review Page — Server Action (R8-3)
 *
 * submitProfitCorpReview(formData: FormData) → void
 *
 * Called when the user clicks "Continue" on the review page (coredisp.exe clone).
 * Verifies auth + session ownership, advances current_step to 'filing-info',
 * then redirects to /starbiz/filing/profit-corp/filing-info.
 *
 * Mirrors submitLLCReview (LLC review/actions.ts, R7b-3) with:
 *   • filing_type = 'corp' in fallback query
 *   • redirect target = /starbiz/filing/profit-corp/filing-info
 *   • disclaimer fallback = /starbiz/filing/profit-corp/disclaimer
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitProfitCorpReview(formData: FormData): Promise<void> {
  // 1. Auth check
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Resolve the session being reviewed via hidden track_number
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

  // Fallback: most recent in-progress corp session for this user
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

  // 3. Advance current_step to 'filing-info'
  await admin
    .from("filing_sessions")
    .update({
      current_step: "filing-info",
      last_saved_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id); // ownership guard

  // 4. Redirect to filing-info (R8-4 — will 404 until that phase ships)
  redirect("/starbiz/filing/profit-corp/filing-info");
}
