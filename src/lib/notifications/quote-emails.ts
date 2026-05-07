type EmailContent = { subject: string; text: string; html: string };

export function quoteSubmissionEmail({
  submitterName,
  submitterEmail,
  quote,
  attribution,
  approveUrl,
  rejectUrl,
  expiryDate,
}: {
  submitterName: string;
  submitterEmail: string;
  quote: string;
  attribution: string;
  approveUrl: string;
  rejectUrl: string;
  expiryDate: string;
}): EmailContent {
  const subject = `New quote submission from ${submitterName}`;

  const text = `A new quote has been submitted for the RockStar Law dashboard widget.

Quote:
"${quote}"

Attribution: ${attribution}
Submitted by: ${submitterName} (${submitterEmail})

APPROVE: ${approveUrl}
REJECT: ${rejectUrl}

Both links expire on ${expiryDate}.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>New Quote Submission</title>
</head>
<body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#111;background:#fff;">
  <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">New Quote Submission</h2>
  <p style="color:#555;font-size:14px;margin-bottom:24px;">
    A new quote has been submitted for the RockStar Law dashboard widget.
  </p>

  <div style="border-left:4px solid #c8102e;padding:12px 16px;background:#fafafa;margin-bottom:24px;font-size:16px;line-height:1.6;">
    &ldquo;${quote}&rdquo;
  </div>

  <p style="font-size:14px;color:#333;margin-bottom:4px;">
    <strong>Attribution:</strong> ${attribution}
  </p>
  <p style="font-size:14px;color:#333;margin-bottom:24px;">
    <strong>Submitted by:</strong> ${submitterName} (${submitterEmail})
  </p>

  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
    <tr>
      <td style="padding-right:8px;width:50%;">
        <a href="${approveUrl}"
           style="display:block;background:#15803d;color:#fff;text-align:center;padding:14px 20px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;">
          ✓ Approve
        </a>
      </td>
      <td style="padding-left:8px;width:50%;">
        <a href="${rejectUrl}"
           style="display:block;background:#b91c1c;color:#fff;text-align:center;padding:14px 20px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;">
          ✗ Reject
        </a>
      </td>
    </tr>
  </table>

  <p style="font-size:12px;color:#999;margin-top:16px;">
    Both links expire on ${expiryDate}.
  </p>
</body>
</html>`;

  return { subject, text, html };
}
