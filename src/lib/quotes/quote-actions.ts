"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/email";
import { quoteSubmissionEmail } from "@/lib/notifications/quote-emails";
import type { QuoteSubmissionState } from "./quote-types";

// Hardcoded review inbox — not a secret, unlikely to change frequently.
const QUOTE_INBOX = "Quote@rockstar.law";
const MAX_PENDING = 5;
const TOKEN_TTL_DAYS = 30;

export async function submitQuote(
  _prev: QuoteSubmissionState,
  formData: FormData,
): Promise<QuoteSubmissionState> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be signed in to submit a quote.", success: "" };

    const quote       = String(formData.get("quote")       ?? "").trim();
    const attribution = String(formData.get("attribution") ?? "").trim();

    if (!quote)         return { error: "Quote text is required.",       success: "" };
    if (!attribution)   return { error: "Attribution is required.",      success: "" };
    if (quote.length       > 500) return { error: "Quote must be 500 characters or fewer.",       success: "" };
    if (attribution.length > 200) return { error: "Attribution must be 200 characters or fewer.", success: "" };

    const admin = createSupabaseAdminClient();

    // Rate limit: max 5 pending per user
    const { count: pendingCount } = await admin
      .from("quote_submissions")
      .select("id", { count: "exact", head: true })
      .eq("submitted_by_user_id", user.id)
      .eq("status", "pending");

    if ((pendingCount ?? 0) >= MAX_PENDING) {
      return {
        error: "You have 5 pending submissions. Wait for review before submitting more.",
        success: "",
      };
    }

    // Generate magic-link tokens
    const approveToken = randomBytes(32).toString("hex");
    const rejectToken  = randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(
      Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: newRow, error: insertError } = await admin
      .from("quote_submissions")
      .insert({
        quote,
        attribution,
        submitted_by_user_id: user.id,
        status: "pending",
        approve_token: approveToken,
        reject_token: rejectToken,
        token_expires_at: tokenExpiresAt,
      })
      .select("id")
      .single();

    if (insertError || !newRow) {
      console.error("[submitQuote] insert error:", insertError?.message);
      return { error: "Unable to submit quote. Please try again.", success: "" };
    }

    // Look up submitter's display name (professor first, then student)
    let submitterName = user.email ?? "Unknown";
    const { data: profProfile } = await admin
      .from("professor_profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profProfile) {
      submitterName = `${profProfile.first_name} ${profProfile.last_name}`.trim();
    } else {
      const { data: stuProfile } = await admin
        .from("student_profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (stuProfile) {
        submitterName = `${stuProfile.first_name} ${stuProfile.last_name}`.trim();
      }
    }

    const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "https://rockstarlaw.com";
    const approveUrl  = `${appUrl}/api/quotes/approve?token=${approveToken}`;
    const rejectUrl   = `${appUrl}/api/quotes/reject?token=${rejectToken}`;
    const expiryDate  = new Date(tokenExpiresAt).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });

    const tmpl = quoteSubmissionEmail({
      submitterName,
      submitterEmail: user.email ?? "",
      quote,
      attribution,
      approveUrl,
      rejectUrl,
      expiryDate,
    });

    await sendEmail({ to: QUOTE_INBOX, ...tmpl });

    revalidatePath("/dashboard/professor", "page");
    return { error: "", success: "Quote submitted for review. The reviewer has been notified." };
  } catch (err) {
    console.error("[submitQuote] unexpected error:", err);
    return { error: "An unexpected error occurred. Please try again.", success: "" };
  }
}
