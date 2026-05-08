"use server";

/**
 * LLC Review Page — Server Action (R7b-3)
 *
 * submitLLCReview(formData: FormData) → void
 *
 * Called when the user clicks "Continue" on the review page (coredisp.exe clone).
 * Verifies auth + session ownership, advances current_step to 'filing-info',
 * then redirects to /starbiz/filing/llc/filing-info.
 *
 * The full form_data payload is carried forward via hidden inputs in the review
 * page's HTML form — the filing-info page reads the session to display the
 * charge total and tracking number.
 */

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitLLCReview(formData: FormData): Promise<void> {
  // 1. Auth check
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Resolve the session being reviewed via hidden track_number
  //    (track_number was generated at review render time and is in the form)
  const trackNumber = formData.get("track_number")?.toString()?.trim() ?? "";

  const admin = createSupabaseAdminClient();

  // Locate the session by user + tracking number (most reliable lookup)
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

  // Fallback: most recent in-progress llc session for this user
  if (!sessionId) {
    const { data: fallback } = await admin
      .from("filing_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("filing_type", "llc")
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();
    sessionId = fallback?.id ?? null;
  }

  if (!sessionId) redirect("/starbiz/filing/llc/disclaimer");

  // 3. Advance current_step to 'filing-info'
  await admin
    .from("filing_sessions")
    .update({
      current_step: "filing-info",
      last_saved_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id); // ownership guard

  // 4. Redirect to filing-info
  redirect("/starbiz/filing/llc/filing-info");
}
