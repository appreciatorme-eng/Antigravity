/**
 * Fetch emails from Gmail API for the operator's connected Google account.
 *
 * Uses shared auth from gmail-auth.ts.
 * Returns threads with parsed messages ready for the unified inbox.
 */
import "server-only";

import { getGmailConnection, getValidAccessToken } from "@/lib/email/gmail-auth";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GmailMessageParsed {
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
}

export interface GmailThread {
    readonly id: string;
    readonly messages: readonly GmailMessageParsed[];
    readonly snippet: string;
    readonly historyId: string;
}

export interface GmailThreadsResult {
    readonly threads: readonly GmailThread[];
    readonly nextPageToken: string | null;
    readonly resultSizeEstimate: number;
}

// ---------------------------------------------------------------------------
// Gmail API types (raw)
// ---------------------------------------------------------------------------

interface GmailApiThread {
    id: string;
    snippet: string;
    historyId: string;
    messages?: GmailApiMessage[];
}

interface GmailApiMessage {
    id: string;
    threadId: string;
    labelIds?: string[];
    snippet: string;
    payload: GmailApiPayload;
    internalDate: string;
}

interface GmailApiPayload {
    headers: GmailApiHeader[];
    mimeType: string;
    body?: { data?: string; size?: number };
    parts?: GmailApiPart[];
}

interface GmailApiHeader {
    name: string;
    value: string;
}

interface GmailApiPart {
    mimeType: string;
    body?: { data?: string; size?: number };
    parts?: GmailApiPart[];
}

// ---------------------------------------------------------------------------
// MIME parsing helpers
// ---------------------------------------------------------------------------

function getHeader(headers: readonly GmailApiHeader[], name: string): string {
    return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseEmailAddress(raw: string): { name: string; email: string } {
    const match = raw.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
        return { name: match[1].replace(/"/g, "").trim(), email: match[2].trim() };
    }
    return { name: raw.trim(), email: raw.trim() };
}

function decodeBase64Url(data: string): string {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
}

function extractBody(payload: GmailApiPayload, mimeType: string): string {
    // Direct body
    if (payload.mimeType === mimeType && payload.body?.data) {
        return decodeBase64Url(payload.body.data);
    }

    // Search parts recursively
    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === mimeType && part.body?.data) {
                return decodeBase64Url(part.body.data);
            }
            if (part.parts) {
                const nested = extractBody(
                    { headers: [], mimeType: part.mimeType, body: part.body, parts: part.parts },
                    mimeType,
                );
                if (nested) return nested;
            }
        }
    }

    return "";
}

function parseMessage(msg: GmailApiMessage): GmailMessageParsed {
    const headers = msg.payload.headers;
    const from = getHeader(headers, "From");
    const parsed = parseEmailAddress(from);

    return {
        id: msg.id,
        threadId: msg.threadId,
        from: parsed.name || parsed.email,
        fromEmail: parsed.email,
        to: getHeader(headers, "To"),
        subject: getHeader(headers, "Subject"),
        snippet: msg.snippet,
        bodyHtml: extractBody(msg.payload, "text/html"),
        bodyText: extractBody(msg.payload, "text/plain"),
        date: new Date(Number(msg.internalDate)).toISOString(),
        messageIdHeader: getHeader(headers, "Message-ID") || null,
        labelIds: msg.labelIds ?? [],
    };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface FetchGmailThreadsOptions {
    readonly query?: string;
    readonly maxResults?: number;
    readonly pageToken?: string;
}

/**
 * Fetch Gmail threads for an organization.
 * Returns null if Gmail is not connected.
 */
export async function fetchGmailThreads(
    orgId: string,
    options: FetchGmailThreadsOptions = {},
): Promise<GmailThreadsResult | null> {
    try {
        const conn = await getGmailConnection(orgId);
        if (!conn) return null;

        const accessToken = await getValidAccessToken(conn);
        const { query = "in:inbox newer_than:30d", maxResults = 20, pageToken } = options;

        // Step 1: List thread IDs
        const listParams = new URLSearchParams({
            q: query,
            maxResults: String(maxResults),
        });
        if (pageToken) listParams.set("pageToken", pageToken);

        const listRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads?${listParams}`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        if (!listRes.ok) {
            const errText = await listRes.text();
            logError(`[gmail-read] threads.list failed ${listRes.status}`, errText);
            return null;
        }

        const listData = (await listRes.json()) as {
            threads?: { id: string }[];
            nextPageToken?: string;
            resultSizeEstimate?: number;
        };

        if (!listData.threads || listData.threads.length === 0) {
            return { threads: [], nextPageToken: null, resultSizeEstimate: 0 };
        }

        // Step 2: Fetch each thread's full messages (batched concurrently, max 10)
        const threadIds = listData.threads.map((t) => t.id);
        const batchSize = 10;
        const allThreads: GmailThread[] = [];

        for (let i = 0; i < threadIds.length; i += batchSize) {
            const batch = threadIds.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async (threadId) => {
                    const res = await fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
                        { headers: { Authorization: `Bearer ${accessToken}` } },
                    );
                    if (!res.ok) return null;
                    return res.json() as Promise<GmailApiThread>;
                }),
            );

            for (const thread of results) {
                if (!thread?.messages) continue;
                allThreads.push({
                    id: thread.id,
                    snippet: thread.snippet,
                    historyId: thread.historyId,
                    messages: thread.messages.map(parseMessage),
                });
            }
        }

        return {
            threads: allThreads,
            nextPageToken: listData.nextPageToken ?? null,
            resultSizeEstimate: listData.resultSizeEstimate ?? 0,
        };
    } catch (err) {
        logError("[gmail-read] fetchGmailThreads failed", err);
        return null;
    }
}
