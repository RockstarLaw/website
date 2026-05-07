import { Resend } from "resend";

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", to);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const from = process.env.EMAIL_FROM ?? "RockStar Law <onboarding@resend.dev>";
    const { error } = await resend.emails.send({ from, to, subject, text, html });
    if (error) {
      console.error("[email] Resend error:", error.message ?? error);
    }
  } catch (err) {
    // Best-effort only — email failure must never fail the triggering action.
    console.error("[email] Failed to send email to", to, ":", err);
  }
}
