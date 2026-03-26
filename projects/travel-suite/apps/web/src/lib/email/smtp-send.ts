import "server-only";

import { createTransport, type Transporter } from "nodemailer";

import { logError } from "@/lib/observability/logger";
import type { SendEmailParams } from "./provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmtpConfig {
  readonly smtpHost: string;
  readonly smtpPort: number;
}

interface SmtpCredentials {
  readonly email: string;
  readonly password: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSmtpTransporter(config: SmtpConfig, credentials: SmtpCredentials): Transporter {
  const isSecure = config.smtpPort === 465;

  return createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: isSecure,
    auth: {
      user: credentials.email,
      pass: credentials.password,
    },
  });
}

function buildAttachments(
  attachments?: SendEmailParams["attachments"],
): readonly { filename: string; content: Buffer; contentType: string }[] {
  if (!attachments?.length) return [];

  return attachments.map((att) => ({
    filename: att.filename,
    content: Buffer.from(att.content, "base64"),
    contentType: att.contentType,
  }));
}

// ---------------------------------------------------------------------------
// Public: sendViaSmtp
// ---------------------------------------------------------------------------

export async function sendViaSmtp(
  config: SmtpConfig,
  credentials: SmtpCredentials,
  params: SendEmailParams,
): Promise<string | null> {
  const transporter = createSmtpTransporter(config, credentials);

  try {
    const mailOptions: Record<string, unknown> = {
      from: credentials.email,
      to: params.to,
      subject: params.subject,
      html: params.htmlBody,
      attachments: buildAttachments(params.attachments),
    };

    if (params.cc) {
      mailOptions.cc = params.cc;
    }
    if (params.bcc) {
      mailOptions.bcc = params.bcc;
    }

    if (params.replyHeaders?.inReplyTo) {
      mailOptions.inReplyTo = params.replyHeaders.inReplyTo;
    }
    if (params.replyHeaders?.references) {
      mailOptions.references = params.replyHeaders.references;
    }

    const result = await transporter.sendMail(mailOptions);
    return result.messageId ?? null;
  } catch (err) {
    logError("smtp-send: sendViaSmtp failed", err);
    return null;
  } finally {
    transporter.close();
  }
}

// ---------------------------------------------------------------------------
// Public: testSmtpConnection
// ---------------------------------------------------------------------------

export async function testSmtpConnection(
  config: SmtpConfig,
  credentials: SmtpCredentials,
): Promise<{ readonly ok: boolean; readonly error?: string }> {
  const transporter = createSmtpTransporter(config, credentials);

  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("smtp-send: testSmtpConnection failed", err);
    return { ok: false, error: message };
  } finally {
    transporter.close();
  }
}
