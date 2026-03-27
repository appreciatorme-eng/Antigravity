import "server-only";

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

import { logError } from "@/lib/observability/logger";
import type {
  EmailThread,
  EmailMessage,
  EmailThreadsResult,
  EmailAttachmentMeta,
  FetchThreadsOptions,
} from "./provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImapConfig {
  readonly imapHost: string;
  readonly imapPort: number;
}

interface ImapCredentials {
  readonly email: string;
  readonly password: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_MAX_RESULTS = 20;
const DAYS_LOOKBACK = 30;

/** Strip common reply/forward prefixes for thread grouping. */
function normalizeSubject(subject: string): string {
  return subject.replace(/^(?:re|fwd?|aw|sv|vs):\s*/gi, "").trim();
}

/** Encode a string to URL-safe base64. */
function toBase64Id(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64url");
}

/** Resolve the correct mailbox name for a folder, with Gmail fallbacks. */
async function resolveMailbox(
  client: ImapFlow,
  folder: FetchThreadsOptions["folder"],
): Promise<string> {
  if (!folder || folder === "inbox") return "INBOX";

  const tryOpen = async (name: string): Promise<boolean> => {
    try {
      await client.mailboxOpen(name, { readOnly: true });
      await client.mailboxClose();
      return true;
    } catch {
      return false;
    }
  };

  if (folder === "sent") {
    if (await tryOpen("[Gmail]/Sent Mail")) return "[Gmail]/Sent Mail";
    return "Sent";
  }

  // starred
  if (await tryOpen("[Gmail]/Starred")) return "[Gmail]/Starred";
  return "Flagged";
}

function createImapClient(config: ImapConfig, credentials: ImapCredentials): ImapFlow {
  return new ImapFlow({
    host: config.imapHost,
    port: config.imapPort,
    secure: true,
    auth: { user: credentials.email, pass: credentials.password },
    logger: false,
  });
}

/** Build a Date object for N days ago. */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ---------------------------------------------------------------------------
// Parse a single IMAP message into an EmailMessage
// ---------------------------------------------------------------------------

function buildAttachmentMeta(
  messageUid: number,
  parsed: Awaited<ReturnType<typeof simpleParser>>,
): readonly EmailAttachmentMeta[] {
  if (!parsed.attachments?.length) return [];
  return parsed.attachments.map((att, idx) => ({
    attachmentId: `${messageUid}_${idx}`,
    filename: att.filename ?? `attachment_${idx}`,
    mimeType: att.contentType ?? "application/octet-stream",
    size: att.size ?? 0,
  }));
}

function toEmailMessage(
  uid: number,
  threadId: string,
  parsed: Awaited<ReturnType<typeof simpleParser>>,
): EmailMessage {
  const fromAddr = parsed.from?.value?.[0];
  const toAddr = parsed.to
    ? Array.isArray(parsed.to)
      ? parsed.to.map((a) => a.text).join(", ")
      : parsed.to.text
    : "";

  const bodyText = parsed.text ?? "";
  const snippet = bodyText.slice(0, 200).replace(/\s+/g, " ").trim();

  return {
    id: String(uid),
    threadId,
    from: fromAddr?.name ?? fromAddr?.address ?? "",
    fromEmail: fromAddr?.address ?? "",
    to: toAddr,
    subject: parsed.subject ?? "(no subject)",
    snippet,
    bodyHtml: parsed.html || "",
    bodyText,
    date: (parsed.date ?? new Date()).toISOString(),
    messageIdHeader: parsed.messageId ?? null,
    labelIds: [],
    attachments: buildAttachmentMeta(uid, parsed),
  };
}

// ---------------------------------------------------------------------------
// Group messages into pseudo-threads by normalized subject
// ---------------------------------------------------------------------------

function groupIntoThreads(messages: readonly EmailMessage[]): readonly EmailThread[] {
  const groups = new Map<string, EmailMessage[]>();
  const order: string[] = [];

  for (const msg of messages) {
    const key = normalizeSubject(msg.subject).toLowerCase() || msg.id;
    const existing = groups.get(key);
    if (existing) {
      existing.push(msg);
    } else {
      groups.set(key, [msg]);
      order.push(key);
    }
  }

  return order.map((key) => {
    const msgs = groups.get(key)!;
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const threadId = toBase64Id(sorted[0].id);
    const threadMessages = sorted.map((m) => ({ ...m, threadId }));
    const lastMsg = threadMessages[threadMessages.length - 1];

    return {
      id: threadId,
      messages: threadMessages,
      snippet: lastMsg.snippet,
      historyId: lastMsg.id,
    };
  });
}

// ---------------------------------------------------------------------------
// Public: fetchImapThreads
// ---------------------------------------------------------------------------

export async function fetchImapThreads(
  config: ImapConfig,
  credentials: ImapCredentials,
  options: FetchThreadsOptions = {},
): Promise<EmailThreadsResult | null> {
  const client = createImapClient(config, credentials);

  try {
    logError("[imap-read] step=connect", { host: config.imapHost });
    await client.connect();

    const mailbox = await resolveMailbox(client, options.folder);
    logError("[imap-read] step=open-mailbox", { mailbox });
    await client.mailboxOpen(mailbox, { readOnly: true });

    const since = daysAgo(DAYS_LOOKBACK);
    logError("[imap-read] step=search", { since: since.toISOString() });
    const searchResult = await client.search({ since }, { uid: true }) as number[];

    logError("[imap-read] step=search-result", { count: searchResult?.length ?? 0 });

    if (!searchResult || !Array.isArray(searchResult) || searchResult.length === 0) {
      return { threads: [], nextPageToken: null, resultSizeEstimate: 0 };
    }

    // Sort UIDs descending (newest first)
    const sortedUids = [...searchResult].sort((a, b) => b - a);

    const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    const offset = options.pageToken ? parseInt(options.pageToken, 10) : 0;
    const pageUids = sortedUids.slice(offset, offset + maxResults);

    if (!pageUids.length) {
      return { threads: [], nextPageToken: null, resultSizeEstimate: sortedUids.length };
    }

    logError("[imap-read] step=fetch", { uidCount: pageUids.length });

    const messages: EmailMessage[] = [];
    const uidSet = pageUids.join(",");

    // Fetch envelope only (minimal — no source, no bodyStructure, no headers)
    // simpleParser and headers both fail on Vercel serverless
    let fetchError: string | null = null;
    let firstMsgKeys: string[] = [];
    let firstMsgSample: Record<string, unknown> = {};
    try {
      const fetchIterator = client.fetch(uidSet, {
        uid: true,
        envelope: true,
      });
      for await (const msg of fetchIterator) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = msg as any;
          if (firstMsgKeys.length === 0) {
            firstMsgKeys = Object.keys(raw);
            // Capture a safe sample of the first message for debugging
            for (const k of firstMsgKeys) {
              const v = raw[k];
              if (v === null || v === undefined) firstMsgSample[k] = v;
              else if (typeof v === 'object') firstMsgSample[k] = `[${typeof v}] keys=${Object.keys(v).join(',')}`;
              else firstMsgSample[k] = String(v).slice(0, 100);
            }
          }
          const env = raw.envelope;
          if (!env) continue;

          const fromList = env.from ?? [];
          const toList = env.to ?? [];
          const fromAddr = fromList[0] ?? {};
          const toAddrs = toList.map((a: Record<string, string>) => a.address || "").join(", ");
          const subject = typeof env.subject === "string" ? env.subject : "(no subject)";
          const dateStr = env.date ? new Date(env.date).toISOString() : new Date().toISOString();
          const messageId = typeof env.messageId === "string" ? env.messageId : null;

          messages.push({
            id: String(msg.uid),
            threadId: "",
            from: fromAddr.name ?? fromAddr.address ?? "",
            fromEmail: fromAddr.address ?? "",
            to: toAddrs,
            subject,
            snippet: subject.slice(0, 200),
            bodyHtml: "",
            bodyText: "",
            date: dateStr,
            messageIdHeader: messageId,
            labelIds: [],
            attachments: [],
          });
        } catch (parseErr) {
          // Skip individual message failures
        }
      }
    } catch (fetchErr) {
      fetchError = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    }

    logError("[imap-read] step=done", { messagesCount: messages.length });

    // Sort messages newest-first for thread grouping
    const sorted = [...messages].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const threads = groupIntoThreads(sorted);
    const nextOffset = offset + maxResults;
    const hasMore = nextOffset < sortedUids.length;

    return {
      threads,
      nextPageToken: hasMore ? String(nextOffset) : null,
      resultSizeEstimate: sortedUids.length,
      _imapDebug: { searchHits: sortedUids.length, pageUids: pageUids.length, messagesParsed: messages.length, threadsGrouped: threads.length, fetchError, firstMsgKeys, firstMsgSample },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logError("[imap-read] fetchImapThreads CRASHED", { error: msg, stack: err instanceof Error ? err.stack : undefined });
    return null;
  } finally {
    await client.logout().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Public: fetchImapAttachment
// ---------------------------------------------------------------------------

export async function fetchImapAttachment(
  config: ImapConfig,
  credentials: ImapCredentials,
  messageUid: number,
  attachmentPartId: string,
): Promise<Buffer | null> {
  const client = createImapClient(config, credentials);

  try {
    await client.connect();
    await client.mailboxOpen("INBOX", { readOnly: true });

    const partIndex = parseInt(attachmentPartId.split("_").pop() ?? "0", 10);

    const fetchIterator = client.fetch(String(messageUid), {
      uid: true,
      source: true,
    });

    for await (const msg of fetchIterator) {
      if (!msg.source) continue;
      const parsed = await simpleParser(msg.source);
      const attachment = parsed.attachments?.[partIndex];
      if (attachment) {
        return Buffer.from(attachment.content);
      }
    }

    return null;
  } catch (err) {
    logError("imap-read: fetchImapAttachment failed", err);
    return null;
  } finally {
    await client.logout().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Public: markImapAsRead
// ---------------------------------------------------------------------------

export async function testImapConnection(
  config: ImapConfig,
  credentials: ImapCredentials,
): Promise<{ ok: boolean; error?: string }> {
  const client = createImapClient(config, credentials);
  try {
    await client.connect();
    await client.mailboxOpen("INBOX", { readOnly: true });
    await client.mailboxClose();
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  } finally {
    await client.logout().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Public: markImapAsRead
// ---------------------------------------------------------------------------

export async function markImapAsRead(
  config: ImapConfig,
  credentials: ImapCredentials,
  messageUid: number,
): Promise<boolean> {
  const client = createImapClient(config, credentials);

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");

    await client.messageFlagsAdd(String(messageUid), ["\\Seen"], { uid: true });
    return true;
  } catch (err) {
    logError("imap-read: markImapAsRead failed", err);
    return false;
  } finally {
    await client.logout().catch(() => {});
  }
}
