/**
 * Send emails via Gmail API using the operator's connected Google account.
 *
 * Uses OAuth tokens stored in social_connections (encrypted).
 * Auto-refreshes expired tokens before sending.
 * Falls back to null (caller should use Resend) if Gmail not connected.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSocialToken, encryptSocialToken } from "@/lib/security/social-token-crypto";
import { refreshGoogleToken } from "@/lib/external/google.server";
import { logError, logEvent } from "@/lib/observability/logger";
import type { EmailAttachment } from "./send";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GmailConnection {
    readonly accessToken: string;
    readonly refreshToken: string | null;
    readonly email: string;
    readonly expiresAt: Date;
    readonly connectionId: string;
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

async function getGmailConnection(orgId: string): Promise<GmailConnection | null> {
    const admin = createAdminClient();
    const { data } = await admin
        .from("social_connections")
        .select("id, access_token_encrypted, refresh_token_encrypted, platform_page_id, token_expires_at")
        .eq("organization_id", orgId)
        .eq("platform", "google")
        .maybeSingle();

    if (!data?.access_token_encrypted) return null;

    const row = data as {
        id: string;
        access_token_encrypted: string;
        refresh_token_encrypted: string | null;
        platform_page_id: string;
        token_expires_at: string | null;
    };

    return {
        connectionId: row.id,
        accessToken: decryptSocialToken(row.access_token_encrypted),
        refreshToken: row.refresh_token_encrypted
            ? decryptSocialToken(row.refresh_token_encrypted)
            : null,
        email: row.platform_page_id,
        expiresAt: row.token_expires_at ? new Date(row.token_expires_at) : new Date(0),
    };
}

async function getValidAccessToken(conn: GmailConnection): Promise<string> {
    // Token still valid (with 5-min buffer)
    if (conn.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
        return conn.accessToken;
    }

    // Need refresh
    if (!conn.refreshToken) {
        throw new Error("Gmail token expired and no refresh token available");
    }

    const newAccessToken = await refreshGoogleToken(conn.refreshToken);

    // Update stored token
    const admin = createAdminClient();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 3600);

    await admin
        .from("social_connections")
        .update({
            access_token_encrypted: encryptSocialToken(newAccessToken),
            token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", conn.connectionId);

    return newAccessToken;
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
): string {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const headers = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
        "MIME-Version: 1.0",
    ];

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
 * Returns true if sent successfully, false if Gmail not connected or send failed.
 */
export async function sendViaGmail(
    orgId: string,
    to: string,
    subject: string,
    htmlBody: string,
    attachments?: readonly EmailAttachment[],
): Promise<boolean> {
    try {
        const conn = await getGmailConnection(orgId);
        if (!conn) return false;

        const accessToken = await getValidAccessToken(conn);
        const mimeMessage = buildMimeMessage(conn.email, to, subject, htmlBody, attachments);

        // Gmail API requires base64url-encoded MIME message
        const encodedMessage = Buffer.from(mimeMessage)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw: encodedMessage }),
        });

        if (!res.ok) {
            const errText = await res.text();
            logError(`[gmail-send] Gmail API error ${res.status}`, errText);
            return false;
        }

        logEvent("info", `[gmail-send] Sent email from ${conn.email} to ${to}: ${subject}`);
        return true;
    } catch (err) {
        logError("[gmail-send] Failed to send via Gmail", err);
        return false;
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
