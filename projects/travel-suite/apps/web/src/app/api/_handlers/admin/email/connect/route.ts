/* ------------------------------------------------------------------
 * POST /api/admin/email/connect
 * Connect an email account via IMAP/SMTP (app password).
 * Tests both IMAP and SMTP before saving.
 * Requires admin role with organization.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSocialToken } from "@/lib/security/social-token-crypto";
import { detectImapSmtpConfig, type ImapSmtpConfig } from "@/lib/email/provider";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logError, logEvent } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConnectBody {
    email: string;
    password: string;
    provider?: "gmail" | "yahoo" | "outlook" | "other";
    imapHost?: string;
    imapPort?: number;
    smtpHost?: string;
    smtpPort?: number;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const orgId = auth.organizationId!;
        const raw = (await request.json()) as Partial<ConnectBody>;

        // Validate input
        if (!raw.email || !isValidEmail(raw.email)) {
            return apiError("Valid email address is required", 400);
        }
        if (!raw.password || raw.password.length < 4) {
            return apiError("App password is required", 400);
        }

        // Resolve IMAP/SMTP config
        let config: ImapSmtpConfig | null;

        if (raw.provider === "other" && raw.imapHost && raw.smtpHost) {
            config = {
                provider: "other",
                imapHost: raw.imapHost,
                imapPort: raw.imapPort ?? 993,
                smtpHost: raw.smtpHost,
                smtpPort: raw.smtpPort ?? 465,
            };
        } else {
            config = detectImapSmtpConfig(raw.email, raw.provider);
        }

        if (!config) {
            return apiError(
                "Could not detect email settings. Please select 'Other' and provide IMAP/SMTP server details.",
                400,
            );
        }

        // Test IMAP connection
        try {
            const { testImapConnection } = await import("@/lib/email/imap-read");
            const imapResult = await testImapConnection(
                { imapHost: config.imapHost, imapPort: config.imapPort },
                { email: raw.email, password: raw.password },
            );
            if (!imapResult.ok) {
                return apiError(
                    `IMAP connection failed: ${imapResult.error ?? "Could not connect to email server. Check your email and app password."}`,
                    422,
                );
            }
        } catch (err) {
            logError("[email/connect] IMAP test error", err);
            return apiError("Could not connect to email server. Check your email and app password.", 422);
        }

        // Test SMTP connection
        try {
            const { testSmtpConnection } = await import("@/lib/email/smtp-send");
            const smtpResult = await testSmtpConnection(
                { smtpHost: config.smtpHost, smtpPort: config.smtpPort },
                { email: raw.email, password: raw.password },
            );
            if (!smtpResult.ok) {
                return apiError(
                    `SMTP connection failed: ${smtpResult.error ?? "Could not verify sending. Check your app password."}`,
                    422,
                );
            }
        } catch (err) {
            logError("[email/connect] SMTP test error", err);
            return apiError("Could not verify email sending. Check your app password.", 422);
        }

        // Store encrypted credentials
        const admin = createAdminClient();
        const encryptedPassword = encryptSocialToken(raw.password);
        const encryptedConfig = encryptSocialToken(JSON.stringify(config));

        // Remove any existing email connection for this org first
        await admin
            .from("social_connections")
            .delete()
            .eq("organization_id", orgId)
            .in("platform", ["google", "imap"]);

        const { error } = await admin.from("social_connections").insert({
            organization_id: orgId,
            platform: "imap",
            platform_page_id: raw.email,
            access_token_encrypted: encryptedPassword,
            refresh_token_encrypted: encryptedConfig,
            token_expires_at: null,
            updated_at: new Date().toISOString(),
        });

        if (error) {
            logError("[email/connect] Insert failed", error);
            return apiError("Failed to save email connection", 500);
        }

        logEvent("info", `[email/connect] IMAP/SMTP connected for org ${orgId}: ${raw.email} (${config.provider})`);

        return apiSuccess({
            connected: true,
            email: raw.email,
            provider: config.provider,
        });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logError("[email/connect] Failed", { error: errorMsg, stack: err instanceof Error ? err.stack : undefined });
        return apiError(`Failed to connect email: ${errorMsg}`, 500);
    }
}
