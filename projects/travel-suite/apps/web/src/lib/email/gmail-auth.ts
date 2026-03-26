/**
 * Shared Gmail OAuth connection & token management.
 *
 * Used by gmail-send.ts (outbound) and gmail-read.ts (inbox fetch).
 * Tokens are stored encrypted in social_connections table.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSocialToken, encryptSocialToken } from "@/lib/security/social-token-crypto";
import { refreshGoogleToken } from "@/lib/external/google.server";

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

export async function getValidAccessToken(conn: GmailConnection): Promise<string> {
    // Token still valid (with 5-min buffer)
    if (conn.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
        return conn.accessToken;
    }

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
