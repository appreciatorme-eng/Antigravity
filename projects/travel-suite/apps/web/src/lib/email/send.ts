import * as Sentry from "@sentry/nextjs";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { FROM_ADDRESS, FROM_NAME, resend } from "@/lib/email/resend";

export async function sendEmail(params: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<void> {
  if (!resend) {
    console.error("[email] RESEND_API_KEY is not configured");
    return;
  }

  try {
    const html = await render(params.react);
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: [params.to],
      subject: params.subject,
      html,
    });
  } catch (error) {
    console.error("[email] Failed to send:", error);
    Sentry.captureException(error, {
      extra: { to: params.to, subject: params.subject },
    });
  }
}
