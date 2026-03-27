/**
 * Email provider abstraction layer.
 *
 * Defines a common interface for email operations (read, send, mark-read,
 * attachments). Concrete implementations:
 *   - GmailApiProvider  (existing OAuth-based Gmail API)
 *   - ImapSmtpProvider   (universal IMAP/SMTP with app passwords)
 */
import "server-only";

// ---------------------------------------------------------------------------
// Shared types (provider-agnostic)
// ---------------------------------------------------------------------------

export interface EmailAttachmentMeta {
  readonly attachmentId: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly size: number;
}

export interface EmailMessage {
  readonly id: string;
  readonly threadId: string;
  readonly from: string;
  readonly fromEmail: string;
  readonly to: string;
  readonly subject: string;
  readonly snippet: string;
  readonly bodyHtml: string;
  readonly bodyText: string;
  readonly date: string;
  readonly messageIdHeader: string | null;
  readonly labelIds: readonly string[];
  readonly attachments: readonly EmailAttachmentMeta[];
}

export interface EmailThread {
  readonly id: string;
  readonly messages: readonly EmailMessage[];
  readonly snippet: string;
  readonly historyId: string;
}

export interface EmailThreadsResult {
  readonly threads: readonly EmailThread[];
  readonly nextPageToken: string | null;
  readonly resultSizeEstimate: number;
  readonly _imapDebug?: Record<string, unknown>;
}

export interface FetchThreadsOptions {
  readonly query?: string;
  readonly folder?: "inbox" | "sent" | "starred";
  readonly maxResults?: number;
  readonly pageToken?: string;
}

export interface SendEmailParams {
  readonly to: string;
  readonly cc?: string;
  readonly bcc?: string;
  readonly subject: string;
  readonly htmlBody: string;
  readonly attachments?: readonly {
    readonly filename: string;
    readonly content: string;
    readonly contentType: string;
  }[];
  readonly replyHeaders?: {
    readonly threadId?: string;
    readonly inReplyTo?: string;
    readonly references?: string;
  };
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface EmailProvider {
  /** Fetch email threads for the inbox/sent/starred folder. */
  fetchThreads(opts: FetchThreadsOptions): Promise<EmailThreadsResult | null>;

  /** Send an email. Returns a message ID on success, null on failure. */
  sendEmail(params: SendEmailParams): Promise<string | null>;

  /** Mark a thread/message as read. */
  markAsRead(threadId: string): Promise<boolean>;

  /** Download an attachment. Returns raw bytes or null. */
  getAttachment(messageId: string, attachmentId: string): Promise<Buffer | null>;

  /** The connected email address. */
  getEmail(): string;

  /** Test the connection. Used during setup. */
  testConnection(): Promise<{ ok: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// Provider config for IMAP/SMTP
// ---------------------------------------------------------------------------

export interface ImapSmtpConfig {
  readonly provider: "gmail" | "yahoo" | "outlook" | "other";
  readonly imapHost: string;
  readonly imapPort: number;
  readonly smtpHost: string;
  readonly smtpPort: number;
}

/** Auto-detect IMAP/SMTP settings from email provider. */
export function detectImapSmtpConfig(
  email: string,
  providerHint?: string,
): ImapSmtpConfig | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  if (providerHint === "gmail" || domain === "gmail.com" || domain === "googlemail.com") {
    return {
      provider: "gmail",
      imapHost: "imap.gmail.com",
      imapPort: 993,
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
    };
  }

  if (
    providerHint === "yahoo" ||
    domain === "yahoo.com" ||
    domain === "yahoo.co.in" ||
    domain === "yahoo.in" ||
    domain.startsWith("yahoo.")
  ) {
    return {
      provider: "yahoo",
      imapHost: "imap.mail.yahoo.com",
      imapPort: 993,
      smtpHost: "smtp.mail.yahoo.com",
      smtpPort: 465,
    };
  }

  if (
    providerHint === "outlook" ||
    domain === "outlook.com" ||
    domain === "hotmail.com" ||
    domain === "live.com" ||
    domain.endsWith(".outlook.com")
  ) {
    return {
      provider: "outlook",
      imapHost: "outlook.office365.com",
      imapPort: 993,
      smtpHost: "smtp.office365.com",
      smtpPort: 587,
    };
  }

  return null;
}
