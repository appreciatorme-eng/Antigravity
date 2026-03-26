import * as Sentry from "@sentry/nextjs";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { logError, logEvent } from "@/lib/observability/logger";
import { FROM_ADDRESS, FROM_NAME, resend } from "@/lib/email/resend";
import { sendViaGmail } from "@/lib/email/gmail-send";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

/**
 * Send an email via Resend (system emails, no org context).
 * Use `sendEmailForOrg` when sending on behalf of an operator.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  react: ReactElement;
  attachments?: EmailAttachment[];
}): Promise<boolean> {
  if (!resend) {
    logError("[email] RESEND_API_KEY is not configured", null);
    return false;
  }

  try {
    const html = await render(params.react);
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: [params.to],
      subject: params.subject,
      html,
      attachments: params.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });
    return true;
  } catch (error) {
    logError("[email] Failed to send", error);
    Sentry.captureException(error, {
      extra: { to: params.to, subject: params.subject },
    });
    return false;
  }
}

/**
 * Send an email on behalf of an operator's organization.
 * Tries Gmail first (if connected), falls back to Resend.
 *
 * This ensures emails come from the operator's own address when possible,
 * not from noreply@tripbuilt.com.
 */
export async function sendEmailForOrg(params: {
  orgId: string;
  to: string;
  subject: string;
  react: ReactElement;
  attachments?: EmailAttachment[];
}): Promise<boolean> {
  try {
    const html = await render(params.react);

    // Try Gmail first
    const gmailSent = await sendViaGmail(
      params.orgId,
      params.to,
      params.subject,
      html,
      params.attachments,
    );

    if (gmailSent) {
      logEvent("info", `[email] Sent via Gmail for org ${params.orgId} to ${params.to}`);
      return true;
    }

    // Fall back to Resend
    logEvent("info", `[email] Gmail not available for org ${params.orgId}, falling back to Resend`);
    return sendEmail({
      to: params.to,
      subject: params.subject,
      react: params.react,
      attachments: params.attachments,
    });
  } catch (error) {
    logError("[email] sendEmailForOrg failed", error);
    Sentry.captureException(error, {
      extra: { orgId: params.orgId, to: params.to, subject: params.subject },
    });
    return false;
  }
}
