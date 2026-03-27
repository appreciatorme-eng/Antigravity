import "server-only";

/**
 * IMAP/SMTP provider — wraps generic IMAP read and SMTP send functions
 * behind the EmailProvider interface for the unified inbox.
 */

import { logError } from "@/lib/observability/logger";
import type {
  EmailProvider,
  EmailThreadsResult,
  FetchThreadsOptions,
  SendEmailParams,
} from "../provider";
import { fetchImapThreads, fetchImapAttachment, markImapAsRead, fromBase64Id } from "../imap-read";
import { sendViaSmtp } from "../smtp-send";
import { testSmtpConnection } from "../smtp-send";

// ---------------------------------------------------------------------------
// Internal config types (match imap-read / smtp-send expectations)
// ---------------------------------------------------------------------------

interface ImapConfig {
  readonly imapHost: string;
  readonly imapPort: number;
}

interface Credentials {
  readonly email: string;
  readonly password: string;
}

interface SmtpConfig {
  readonly smtpHost: string;
  readonly smtpPort: number;
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export class ImapSmtpProvider implements EmailProvider {
  constructor(
    private readonly email: string,
    private readonly password: string,
    private readonly imapHost: string,
    private readonly imapPort: number,
    private readonly smtpHost: string,
    private readonly smtpPort: number,
  ) {}

  // ---- helpers ----------------------------------------------------------

  private get imapConfig(): ImapConfig {
    return { imapHost: this.imapHost, imapPort: this.imapPort };
  }

  private get smtpConfig(): SmtpConfig {
    return { smtpHost: this.smtpHost, smtpPort: this.smtpPort };
  }

  private get credentials(): Credentials {
    return { email: this.email, password: this.password };
  }

  // ---- EmailProvider methods --------------------------------------------

  async fetchThreads(opts: FetchThreadsOptions): Promise<EmailThreadsResult | null> {
    return fetchImapThreads(this.imapConfig, this.credentials, opts);
  }

  async sendEmail(params: SendEmailParams): Promise<string | null> {
    return sendViaSmtp(this.smtpConfig, this.credentials, params);
  }

  async markAsRead(threadId: string): Promise<boolean> {
    // threadId is base64url-encoded UID — decode before parsing
    const decoded = fromBase64Id(threadId);
    const uid = Number(decoded);
    if (Number.isNaN(uid)) {
      logError(`[imap-smtp] markAsRead: invalid UID after decode: ${threadId} → ${decoded}`, null);
      return false;
    }
    return markImapAsRead(this.imapConfig, this.credentials, uid);
  }

  async getAttachment(messageId: string, attachmentId: string): Promise<Buffer | null> {
    const uid = Number(messageId);
    if (Number.isNaN(uid)) {
      logError(`[imap-smtp] getAttachment: invalid message UID: ${messageId}`, null);
      return null;
    }
    return fetchImapAttachment(this.imapConfig, this.credentials, uid, attachmentId);
  }

  getEmail(): string {
    return this.email;
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    const errors: string[] = [];

    // Test IMAP
    try {
      const imapResult = await fetchImapThreads(
        this.imapConfig,
        this.credentials,
        { maxResults: 1 },
      );
      if (imapResult === null) {
        errors.push("IMAP connection failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`IMAP: ${message}`);
    }

    // Test SMTP
    try {
      const smtpResult = await testSmtpConnection(this.smtpConfig, this.credentials);
      if (!smtpResult.ok) {
        errors.push(`SMTP: ${smtpResult.error ?? "connection failed"}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`SMTP: ${message}`);
    }

    if (errors.length > 0) {
      return { ok: false, error: errors.join("; ") };
    }

    return { ok: true };
  }
}
