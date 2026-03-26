import "server-only";

/**
 * Gmail API provider — wraps existing Gmail OAuth functions behind the
 * EmailProvider interface for the unified inbox.
 */

import { logError } from "@/lib/observability/logger";
import type {
  EmailProvider,
  EmailThread,
  EmailThreadsResult,
  FetchThreadsOptions,
  SendEmailParams,
} from "../provider";
import { fetchGmailThreads } from "../gmail-read";
import type { GmailThread } from "../gmail-read";
import { sendViaGmail, type GmailRecipients } from "../gmail-send";
import { getValidAccessToken, type GmailConnection } from "../gmail-auth";

// ---------------------------------------------------------------------------
// Folder -> Gmail query mapping
// ---------------------------------------------------------------------------

const FOLDER_QUERIES: Record<NonNullable<FetchThreadsOptions["folder"]>, string> = {
  inbox: "in:inbox newer_than:30d",
  sent: "in:sent newer_than:30d",
  starred: "is:starred newer_than:30d",
} as const;

// ---------------------------------------------------------------------------
// GmailThread -> EmailThread mapping
// ---------------------------------------------------------------------------

function toEmailThread(gmailThread: GmailThread): EmailThread {
  return {
    id: gmailThread.id,
    snippet: gmailThread.snippet,
    historyId: gmailThread.historyId,
    messages: gmailThread.messages.map((msg) => ({
      id: msg.id,
      threadId: msg.threadId,
      from: msg.from,
      fromEmail: msg.fromEmail,
      to: msg.to,
      subject: msg.subject,
      snippet: msg.snippet,
      bodyHtml: msg.bodyHtml,
      bodyText: msg.bodyText,
      date: msg.date,
      messageIdHeader: msg.messageIdHeader,
      labelIds: msg.labelIds,
      attachments: msg.attachments.map((att) => ({
        attachmentId: att.attachmentId,
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export class GmailApiProvider implements EmailProvider {
  constructor(
    private readonly orgId: string,
    private readonly connectionId: string,
    private readonly email: string,
    private readonly accessToken: string,
    private readonly refreshToken: string | null,
    private readonly expiresAt: Date,
  ) {}

  // ---- helpers ----------------------------------------------------------

  private async getAccessToken(): Promise<string> {
    const conn: GmailConnection = {
      connectionId: this.connectionId,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      email: this.email,
      expiresAt: this.expiresAt,
    };
    return getValidAccessToken(conn);
  }

  // ---- EmailProvider methods --------------------------------------------

  async fetchThreads(opts: FetchThreadsOptions): Promise<EmailThreadsResult | null> {
    const folder = opts.folder ?? "inbox";
    const query = opts.query ?? FOLDER_QUERIES[folder];

    const result = await fetchGmailThreads(this.orgId, {
      query,
      maxResults: opts.maxResults,
      pageToken: opts.pageToken,
    });

    if (!result) return null;

    return {
      threads: result.threads.map(toEmailThread),
      nextPageToken: result.nextPageToken,
      resultSizeEstimate: result.resultSizeEstimate,
    };
  }

  async sendEmail(params: SendEmailParams): Promise<string | null> {
    const recipients: GmailRecipients = {
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
    };

    return sendViaGmail(
      this.orgId,
      recipients,
      params.subject,
      params.htmlBody,
      params.attachments,
      params.replyHeaders,
    );
  }

  async markAsRead(threadId: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        logError("[gmail-api] markAsRead failed", errText);
        return false;
      }

      return true;
    } catch (err) {
      logError("[gmail-api] markAsRead error", err);
      return false;
    }
  }

  async getAttachment(messageId: string, attachmentId: string): Promise<Buffer | null> {
    try {
      const token = await this.getAccessToken();

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        logError("[gmail-api] getAttachment failed", errText);
        return null;
      }

      const data = (await res.json()) as { data?: string };
      if (!data.data) return null;

      // Gmail returns base64url-encoded data
      const base64 = data.data.replace(/-/g, "+").replace(/_/g, "/");
      return Buffer.from(base64, "base64");
    } catch (err) {
      logError("[gmail-api] getAttachment error", err);
      return null;
    }
  }

  getEmail(): string {
    return this.email;
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      const result = await fetchGmailThreads(this.orgId, { maxResults: 1 });
      if (result === null) {
        return { ok: false, error: "Gmail connection not available" };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message };
    }
  }
}
