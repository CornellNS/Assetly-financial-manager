import { Resend } from "resend";
import { RECOVERY_LINK_TTL_SECONDS } from "@/lib/assetly-download";

let resendClient: Resend | null = null;

export function isAssetlyEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendAssetlyRecoveryEmail({
  claimUrl,
  to,
}: {
  claimUrl: string;
  to: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  const from = process.env.ASSETLY_EMAIL_FROM || "Assetly <onboarding@resend.dev>";
  const supportEmail = process.env.ASSETLY_SUPPORT_EMAIL || "support@assetlymanager.online";
  const ttlMinutes = RECOVERY_LINK_TTL_SECONDS / 60;

  const { error } = await resendClient.emails.send({
    from,
    replyTo: supportEmail,
    to,
    subject: "Your Assetly download link",
    text: [
      "Here is your Assetly Financial Manager download access link:",
      "",
      claimUrl,
      "",
      `This link expires in ${ttlMinutes} minutes. If you did not request this, you can ignore this email.`,
      "",
      `Need help? Reply to this email or contact ${supportEmail}.`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #24211d; line-height: 1.5;">
        <h1 style="font-size: 22px; margin: 0 0 12px;">Your Assetly download link</h1>
        <p>Use this private link to restore access to your Assetly Financial Manager download page.</p>
        <p>
          <a href="${escapeHtml(claimUrl)}" style="display: inline-block; background: #2b2721; color: #ffffff; padding: 12px 16px; border-radius: 8px; text-decoration: none; font-weight: 700;">
            Open Assetly download
          </a>
        </p>
        <p style="color: #716a60; font-size: 14px;">This link expires in ${ttlMinutes} minutes. If you did not request this, you can ignore this email.</p>
        <p style="color: #716a60; font-size: 14px;">Need help? Reply to this email or contact ${escapeHtml(supportEmail)}.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
