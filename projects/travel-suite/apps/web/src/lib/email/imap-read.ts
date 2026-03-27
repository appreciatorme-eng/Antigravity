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

/** Decode a URL-safe base64 string back to the original value. */
export function fromBase64Id(value: string): string {
  return Buffer.from(value, "base64url").toString("utf-8");
}

/** Resolve the correct mailbox name for a folder using IMAP LIST + special-use flags. */
async function resolveMailbox(
  client: ImapFlow,
  folder: FetchThreadsOptions["folder"],
): Promise<string> {
  if (!folder || folder === "inbox") return "INBOX";

  // Use IMAP LIST to discover actual folder names via RFC 6154 special-use flags
  const mailboxes = await client.list();

  if (folder === "sent") {
    const sentBox = mailboxes.find(
      (m) =>
        m.specialUse === "\\Sent" ||
        /^(\[gmail\]\/sent mail|sent|sent items|sent messages)$/i.test(m.path),
    );
    return sentBox?.path ?? "Sent";
  }

  if (folder === "starred") {
    const starredBox = mailboxes.find(
      (m) =>
        m.specialUse === "\\Flagged" ||
        /^(\[gmail\]\/starred|flagged|starred)$/i.test(m.path),
    );
    return starredBox?.path ?? "Flagged";
  }

  return "INBOX";
}

/** Discover the Trash/Bin folder path via IMAP LIST. */
async function resolveTrashFolder(client: ImapFlow): Promise<string> {
  const mailboxes = await client.list();
  const trash = mailboxes.find(
    (m) =>
      m.specialUse === "\\Trash" ||
      /^(\[gmail\]\/trash|trash|deleted items|deleted messages|bin)$/i.test(m.path),
  );
  return trash?.path ?? "Trash";
}

/** Discover the Archive/All Mail folder path via IMAP LIST. */
async function resolveArchiveFolder(client: ImapFlow): Promise<string> {
  const mailboxes = await client.list();
  const archive = mailboxes.find(
    (m) =>
      m.specialUse === "\\All" ||
      m.specialUse === "\\Archive" ||
      /^(\[gmail\]\/all mail|archive|archives)$/i.test(m.path),
  );
  return archive?.path ?? "Archive";
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
    await client.connect();

    const mailbox = await resolveMailbox(client, options.folder);
    await client.mailboxOpen(mailbox, { readOnly: true });

    const since = daysAgo(DAYS_LOOKBACK);
    const searchCriteria = options.query
      ? { since, text: options.query }
      : { since };
    const searchResult = await client.search(searchCriteria, { uid: true }) as number[];

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

    // imapflow fetch() expects a SequenceRange string like "uid1,uid2,uid3"
    // OR {uid: true} option makes it treat the range as UIDs not sequence numbers
    const uidRange = pageUids.join(",");

    // Fetch envelope only (minimal — no source, no bodyStructure, no headers)
    // simpleParser and headers both fail on Vercel serverless
    let fetchError: string | null = null;
    // imapflow's fetch() async iterator doesn't yield on Vercel serverless.
    // Use fetchOne() which returns a single message object directly.
    for (const uid of pageUids) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // fetchOne(seq, query, options) — uid:true MUST be in options (3rd arg), not query
        const msg = await (client as any).fetchOne(String(uid), { envelope: true, source: true }, { uid: true });
        if (!msg) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const env = (msg as any).envelope;
        if (!env) continue;

        const fromList = env.from ?? [];
        const toList = env.to ?? [];
        const fromAddr = fromList[0] ?? {};
        const toAddrs = toList.map((a: Record<string, string>) => a.address || "").join(", ");
        const subject = typeof env.subject === "string" ? env.subject : "(no subject)";
        const dateStr = env.date ? new Date(env.date).toISOString() : new Date().toISOString();
        const messageId = typeof env.messageId === "string" ? env.messageId : null;

        // Try to parse body from source if available
        let bodyHtml = "";
        let bodyText = "";
        let snippet = subject.slice(0, 200);
        const attachmentMeta: EmailAttachmentMeta[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const source = (msg as any).source;
        if (source) {
          try {
            const parsed = await simpleParser(source);
            bodyHtml = parsed.html || "";
            bodyText = parsed.text || "";
            snippet = (bodyText || subject).slice(0, 200).replace(/\s+/g, " ").trim();
            if (parsed.attachments?.length) {
              for (let i = 0; i < parsed.attachments.length; i++) {
                const att = parsed.attachments[i];
                attachmentMeta.push({
                  attachmentId: `${uid}_${i}`,
                  filename: att.filename ?? `attachment_${i}`,
                  mimeType: att.contentType ?? "application/octet-stream",
                  size: att.size ?? 0,
                });
              }
            }
          } catch {
            // simpleParser failed — fall back to envelope-only data
          }
        }

        messages.push({
          id: String(msg.uid ?? uid),
          threadId: "",
          from: fromAddr.name ?? fromAddr.address ?? "",
          fromEmail: fromAddr.address ?? "",
          to: toAddrs,
          subject,
          snippet,
          bodyHtml,
          bodyText,
          date: dateStr,
          messageIdHeader: messageId,
          labelIds: [],
          attachments: attachmentMeta,
        });
      } catch (uidErr) {
        if (!fetchError) fetchError = uidErr instanceof Error ? uidErr.message : String(uidErr);
      }
    }

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

    // Use fetchOne() — for await iterator silently stalls on Vercel serverless
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = await (client as any).fetchOne(String(messageUid), { source: true }, { uid: true });
    if (!msg?.source) return null;

    const parsed = await simpleParser(msg.source);
    const attachment = parsed.attachments?.[partIndex];
    return attachment ? Buffer.from(attachment.content) : null;
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

// ---------------------------------------------------------------------------
// Public: deleteImapMessage
// ---------------------------------------------------------------------------

export async function deleteImapMessage(
  config: ImapConfig,
  credentials: ImapCredentials,
  messageUid: number,
): Promise<boolean> {
  const client = createImapClient(config, credentials);

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");

    const trashFolder = await resolveTrashFolder(client);
    await client.messageMove(String(messageUid), trashFolder, { uid: true });
    return true;
  } catch (err) {
    logError("imap-read: deleteImapMessage failed", err);
    return false;
  } finally {
    await client.logout().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Public: archiveImapMessage
// ---------------------------------------------------------------------------

export async function archiveImapMessage(
  config: ImapConfig,
  credentials: ImapCredentials,
  messageUid: number,
): Promise<boolean> {
  const client = createImapClient(config, credentials);

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");

    const archiveFolder = await resolveArchiveFolder(client);
    await client.messageMove(String(messageUid), archiveFolder, { uid: true });
    return true;
  } catch (err) {
    logError("imap-read: archiveImapMessage failed", err);
    return false;
  } finally {
    await client.logout().catch(() => {});
  }
}
