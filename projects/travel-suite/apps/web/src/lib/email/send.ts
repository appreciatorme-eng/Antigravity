import * as Sentry from "@sentry/nextjs";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { logError } from "@/lib/observability/logger";
import { FROM_ADDRESS, FROM_NAME, resend } from "@/lib/email/resend";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

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
