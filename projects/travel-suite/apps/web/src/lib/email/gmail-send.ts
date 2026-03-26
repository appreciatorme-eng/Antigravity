/**
 * Send emails via Gmail API using the operator's connected Google account.
 *
 * Uses OAuth tokens stored in social_connections (encrypted).
 * Auto-refreshes expired tokens before sending.
 * Falls back to null (caller should use Resend) if Gmail not connected.
 */
import "server-only";

import { getGmailConnection, getValidAccessToken } from "@/lib/email/gmail-auth";
import { logError, logEvent } from "@/lib/observability/logger";
import type { EmailAttachment } from "./send";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GmailReplyHeaders {
    readonly inReplyTo?: string;
    readonly references?: string;
    readonly threadId?: string;
}

// ---------------------------------------------------------------------------
// MIME message builder
// ---------------------------------------------------------------------------

function buildMimeMessage(
    from: string,
    to: string,
    subject: string,
    htmlBody: string,
    attachments?: readonly EmailAttachment[],
    replyHeaders?: GmailReplyHeaders,
): string {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const headers = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
        "MIME-Version: 1.0",
    ];

    if (replyHeaders?.inReplyTo) {
        headers.push(`In-Reply-To: ${replyHeaders.inReplyTo}`);
    }
    if (replyHeaders?.references) {
        headers.push(`References: ${replyHeaders.references}`);
    }

    if (!attachments || attachments.length === 0) {
        headers.push("Content-Type: text/html; charset=UTF-8");
        headers.push("Content-Transfer-Encoding: base64");
        return [
            ...headers,
            "",
            Buffer.from(htmlBody).toString("base64"),
        ].join("\r\n");
    }

    // Multipart with attachments
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

    const parts: string[] = [
        ...headers,
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        Buffer.from(htmlBody).toString("base64"),
    ];

    for (const att of attachments) {
        const content = typeof att.content === "string"
            ? att.content
            : Buffer.from(att.content).toString("base64");

        parts.push(
            `--${boundary}`,
            `Content-Type: ${att.contentType ?? "application/octet-stream"}`,
            "Content-Transfer-Encoding: base64",
            `Content-Disposition: attachment; filename="${att.filename}"`,
            "",
            content,
        );
    }

    parts.push(`--${boundary}--`);
    return parts.join("\r\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an email via the operator's connected Gmail account.
 * Returns the Gmail message ID if sent successfully, null if Gmail not connected or send failed.
 */
export async function sendViaGmail(
    orgId: string,
    to: string,
    subject: string,
    htmlBody: string,
    attachments?: readonly EmailAttachment[],
    replyHeaders?: GmailReplyHeaders,
): Promise<string | null> {
    try {
        const conn = await getGmailConnection(orgId);
        if (!conn) return null;

        const accessToken = await getValidAccessToken(conn);
        const mimeMessage = buildMimeMessage(conn.email, to, subject, htmlBody, attachments, replyHeaders);

        // Gmail API requires base64url-encoded MIME message
        const encodedMessage = Buffer.from(mimeMessage)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const body: Record<string, string> = { raw: encodedMessage };
        if (replyHeaders?.threadId) {
            body.threadId = replyHeaders.threadId;
        }

        const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errText = await res.text();
            logError(`[gmail-send] Gmail API error ${res.status}`, errText);
            return null;
        }

        const result = (await res.json()) as { id?: string };
        logEvent("info", `[gmail-send] Sent email from ${conn.email} to ${to}: ${subject}`);
        return result.id ?? null;
    } catch (err) {
        logError("[gmail-send] Failed to send via Gmail", err);
        return null;
    }
}

/**
 * Check if an org has Gmail connected.
 */
export async function isGmailConnected(orgId: string): Promise<boolean> {
    const conn = await getGmailConnection(orgId);
    return conn !== null;
}

/**
 * Get the connected Gmail email address for an org.
 */
export async function getGmailEmail(orgId: string): Promise<string | null> {
    const conn = await getGmailConnection(orgId);
    return conn?.email ?? null;
}
