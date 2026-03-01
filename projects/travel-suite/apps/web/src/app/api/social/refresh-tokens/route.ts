import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeSocialTokenWithMigration, encryptSocialToken } from "@/lib/security/social-token-crypto";

function parseMsEnv(value: string | undefined, fallbackMs: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
}

export async function POST(req: Request) {
    try {
        const cronAuth = await authorizeCronRequest(req, {
            secretHeaderName: "x-social-cron-secret",
            idempotencyHeaderName: "x-cron-idempotency-key",
            replayWindowMs: parseMsEnv(process.env.SOCIAL_CRON_REPLAY_WINDOW_MS, 10 * 60_000),
            maxClockSkewMs: parseMsEnv(process.env.SOCIAL_CRON_MAX_CLOCK_SKEW_MS, 5 * 60_000),
        });

        if (!cronAuth.authorized) {
            return NextResponse.json({ error: cronAuth.reason }, { status: cronAuth.status });
        }

        const metaAppId = process.env.META_APP_ID?.trim();
        const metaAppSecret = process.env.META_APP_SECRET?.trim();
        if (!metaAppId || !metaAppSecret) {
            return NextResponse.json({ error: "Meta OAuth credentials are not configured" }, { status: 500 });
        }

        const supabaseAdmin = createAdminClient();

        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { data: expiringConnections, error } = await supabaseAdmin
            .from("social_connections")
            .select("id,platform,access_token_encrypted,token_expires_at")
            .lt("token_expires_at", sevenDaysFromNow.toISOString());

        if (error) throw error;

        if (!expiringConnections || expiringConnections.length === 0) {
            return NextResponse.json({ message: "No tokens need refreshing" });
        }

        const results: Array<{ id: string; status: string; platform: string; error?: string }> = [];

        for (const conn of expiringConnections) {
            try {
                if (conn.platform !== "facebook" && conn.platform !== "instagram") {
                    results.push({ id: conn.id, status: "skipped", platform: conn.platform });
                    continue;
                }

                const { token: currentToken, needsMigration } = decodeSocialTokenWithMigration(
                    conn.access_token_encrypted
                );

                const res = await fetch(
                    `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${encodeURIComponent(
                        currentToken
                    )}`
                );

                if (!res.ok) {
                    throw new Error(`Meta API error: ${await res.text()}`);
                }

                const data = (await res.json()) as { access_token?: string };
                const refreshedToken = data.access_token || currentToken;
                const encryptedToken = encryptSocialToken(refreshedToken);

                const newExpiresAt = new Date();
                newExpiresAt.setDate(newExpiresAt.getDate() + 60);

                if (needsMigration || refreshedToken !== currentToken) {
                    await supabaseAdmin
                        .from("social_connections")
                        .update({
                            access_token_encrypted: encryptedToken,
                            token_expires_at: newExpiresAt.toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", conn.id);
                } else {
                    await supabaseAdmin
                        .from("social_connections")
                        .update({
                            token_expires_at: newExpiresAt.toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", conn.id);
                }

                results.push({ id: conn.id, status: "success", platform: conn.platform });
            } catch (err: unknown) {
                console.error(`Error refreshing token for connection ${conn.id}:`, err);
                results.push({
                    id: conn.id,
                    status: "failed",
                    platform: conn.platform,
                    error: err instanceof Error ? err.message : "Unknown token refresh error",
                });
            }
        }

        return NextResponse.json({ success: true, processed: results.length, results });
    } catch (error: unknown) {
        console.error("Error refreshing social tokens:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to refresh tokens" },
            { status: 500 }
        );
    }
}
