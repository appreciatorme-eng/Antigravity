// GET /api/superadmin/monitoring/health — platform health checks with queue depths.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { Redis } from "@upstash/redis";

let _redis: Redis | null | undefined;
function getRedisClient(): Redis | null {
    if (_redis !== undefined) return _redis;
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) { _redis = null; return null; }
    _redis = new Redis({ url, token });
    return _redis;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkDatabase(client: any): Promise<{ status: "healthy" | "degraded" | "down"; latency_ms: number }> {
    const start = Date.now();
    try {
        if (!client) return { status: "down", latency_ms: -1 };
        await client.from("profiles").select("id").limit(1);
        return { status: "healthy", latency_ms: Date.now() - start };
    } catch {
        return { status: "down", latency_ms: Date.now() - start };
    }
}

async function checkRedis(): Promise<{ status: "healthy" | "degraded" | "down"; latency_ms: number }> {
    const redis = getRedisClient();
    if (!redis) return { status: "degraded", latency_ms: -1 };
    const start = Date.now();
    try {
        await redis.ping();
        return { status: "healthy", latency_ms: Date.now() - start };
    } catch {
        return { status: "down", latency_ms: Date.now() - start };
    }
}

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;

    try {
        const [dbCheck, redisCheck, queueResult, deadLetterResult, socialQueueResult] = await Promise.all([
            checkDatabase(adminClient),
            checkRedis(),
            adminClient
                .from("notification_queue")
                .select("status", { count: "exact" })
                .in("status", ["pending", "failed"])
                .limit(1000),
            adminClient
                .from("notification_dead_letters")
                .select("*", { count: "exact", head: true }),
            adminClient
                .from("social_post_queue")
                .select("*", { count: "exact", head: true })
                .eq("status", "pending"),
        ]);

        const pendingNotifs = (queueResult.data ?? []).filter((r: { status: string | null }) => r.status === "pending").length;
        const failedNotifs = (queueResult.data ?? []).filter((r: { status: string | null }) => r.status === "failed").length;

        // Check FCM configured
        const fcmConfigured = Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY);
        // Check WhatsApp configured
        const waConfigured = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_API_TOKEN);
        // Check Sentry configured
        const sentryConfigured = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
        // Check PostHog configured
        const posthogConfigured = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

        return NextResponse.json({
            services: {
                database: dbCheck,
                redis: redisCheck,
                fcm: {
                    status: fcmConfigured ? "healthy" : "degraded",
                    configured: fcmConfigured,
                },
                whatsapp: {
                    status: waConfigured ? "healthy" : "degraded",
                    configured: waConfigured,
                },
                sentry: {
                    status: sentryConfigured ? "healthy" : "degraded",
                    configured: sentryConfigured,
                },
                posthog: {
                    status: posthogConfigured ? "healthy" : "degraded",
                    configured: posthogConfigured,
                },
            },
            queues: {
                notifications: {
                    pending: pendingNotifs,
                    failed: failedNotifs,
                    dead_letters: deadLetterResult.count ?? 0,
                },
                social_posts: {
                    pending: socialQueueResult.count ?? 0,
                },
            },
            checked_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error("[superadmin/monitoring/health]", err);
        return NextResponse.json({ error: "Failed to run health checks" }, { status: 500 });
    }
}
