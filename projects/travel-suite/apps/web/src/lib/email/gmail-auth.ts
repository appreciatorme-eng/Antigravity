/**
 * Email connection & token management.
 *
 * Supports two connection types:
 *   - "google" (Gmail OAuth) — existing, used by gmail-send.ts / gmail-read.ts
 *   - "imap"   (IMAP/SMTP)  — new universal, used by imap-read.ts / smtp-send.ts
 *
 * Tokens/passwords are stored encrypted in social_connections table.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSocialToken, encryptSocialToken } from "@/lib/security/social-token-crypto";
import { refreshGoogleToken } from "@/lib/external/google.server";
import type { EmailProvider, ImapSmtpConfig } from "@/lib/email/provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GmailConnection {
    readonly accessToken: string;
    readonly refreshToken: string | null;
    readonly email: string;
    readonly expiresAt: Date;
    readonly connectionId: string;
}

// ---------------------------------------------------------------------------
// Connection lookup
// ---------------------------------------------------------------------------

export async function getGmailConnection(orgId: string): Promise<GmailConnection | null> {
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

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

export class GmailAuthExpiredError extends Error {
    constructor() {
        super("Gmail access has been revoked or expired. Please reconnect in Settings.");
        this.name = "GmailAuthExpiredError";
    }
}

export async function getValidAccessToken(conn: GmailConnection): Promise<string> {
    // Token still valid (with 5-min buffer)
    if (conn.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
        return conn.accessToken;
    }

    if (!conn.refreshToken) {
        // No refresh token — auto-disconnect stale connection
        await disconnectStaleConnection(conn.connectionId);
        throw new GmailAuthExpiredError();
    }

    try {
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
    } catch {
        // Refresh failed (token revoked, invalid_grant, etc.) — auto-disconnect
        await disconnectStaleConnection(conn.connectionId);
        throw new GmailAuthExpiredError();
    }
}

async function disconnectStaleConnection(connectionId: string): Promise<void> {
    const admin = createAdminClient();
    await admin
        .from("social_connections")
        .delete()
        .eq("id", connectionId);
}

// ---------------------------------------------------------------------------
// Universal email connection (supports both Google OAuth and IMAP/SMTP)
// ---------------------------------------------------------------------------

export interface ImapConnection {
    readonly platform: "imap";
    readonly connectionId: string;
    readonly email: string;
    readonly password: string;
    readonly config: ImapSmtpConfig;
}

export type EmailConnection =
    | (GmailConnection & { readonly platform: "google" })
    | ImapConnection;

/**
 * Get the email connection for an org — checks both Google OAuth and IMAP/SMTP.
 * Returns null if no email is connected.
 */
export async function getEmailConnection(orgId: string): Promise<EmailConnection | null> {
    const admin = createAdminClient();
    const { data } = await admin
        .from("social_connections")
        .select("id, platform, access_token_encrypted, refresh_token_encrypted, platform_page_id, token_expires_at")
        .eq("organization_id", orgId)
        .in("platform", ["google", "imap"])
        .maybeSingle();

    if (!data?.access_token_encrypted) return null;

    const row = data as {
        id: string;
        platform: string;
        access_token_encrypted: string;
        refresh_token_encrypted: string | null;
        platform_page_id: string;
        token_expires_at: string | null;
    };

    if (row.platform === "imap") {
        const config: ImapSmtpConfig = row.refresh_token_encrypted
            ? JSON.parse(decryptSocialToken(row.refresh_token_encrypted))
            : { provider: "other", imapHost: "", imapPort: 993, smtpHost: "", smtpPort: 465 };

        return {
            platform: "imap",
            connectionId: row.id,
            email: row.platform_page_id,
            password: decryptSocialToken(row.access_token_encrypted),
            config,
        };
    }

    // Google OAuth connection
    return {
        platform: "google",
        connectionId: row.id,
        accessToken: decryptSocialToken(row.access_token_encrypted),
        refreshToken: row.refresh_token_encrypted
            ? decryptSocialToken(row.refresh_token_encrypted)
            : null,
        email: row.platform_page_id,
        expiresAt: row.token_expires_at ? new Date(row.token_expires_at) : new Date(0),
    };
}

/**
 * Build the appropriate EmailProvider for the org's connection.
 * Returns null if no email is connected.
 */
export async function getEmailProvider(orgId: string): Promise<EmailProvider | null> {
    const conn = await getEmailConnection(orgId);
    if (!conn) return null;

    if (conn.platform === "imap") {
        const { ImapSmtpProvider } = await import("@/lib/email/providers/imap-smtp");
        return new ImapSmtpProvider(
            conn.email,
            conn.password,
            conn.config.imapHost,
            conn.config.imapPort,
            conn.config.smtpHost,
            conn.config.smtpPort,
        );
    }

    const { GmailApiProvider } = await import("@/lib/email/providers/gmail-api");
    return new GmailApiProvider(
        orgId,
        conn.connectionId,
        conn.email,
        conn.accessToken,
        conn.refreshToken,
        conn.expiresAt,
    );
}
