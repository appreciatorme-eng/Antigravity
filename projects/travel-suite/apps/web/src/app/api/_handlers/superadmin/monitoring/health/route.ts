// GET /api/superadmin/monitoring/health — platform health checks with queue depths.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import {
    checkDatabaseRuntime,
    checkFirebaseFcmRuntime,
    checkPosthogRuntime,
    checkRedisRuntime,
    checkSentryRuntime,
    checkWhatsappRuntime,
} from "@/lib/platform/runtime-probes";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;

    try {
        const [dbCheck, redisCheck, queueResult, deadLetterResult, socialQueueResult] = await Promise.all([
            checkDatabaseRuntime(adminClient),
            checkRedisRuntime(),
            adminClient
                .from("notification_queue")
                .select("status", { count: "exact" })
                .in("status", ["pending", "failed"])
                .limit(1000),
            adminClient
                .from("notification_dead_letters")
                .select("id", { count: "exact", head: true }),
            adminClient
                .from("social_post_queue")
                .select("id", { count: "exact", head: true })
                .eq("status", "pending"),
        ]);
        const [fcmCheck, whatsappCheck, sentryCheck, posthogCheck] = await Promise.all([
            checkFirebaseFcmRuntime(),
            checkWhatsappRuntime(),
            checkSentryRuntime(),
            checkPosthogRuntime(),
        ]);

        const pendingNotifs = (queueResult.data ?? []).filter((r: { status: string | null }) => r.status === "pending").length;
        const failedNotifs = (queueResult.data ?? []).filter((r: { status: string | null }) => r.status === "failed").length;

        return NextResponse.json({
            services: {
                database: dbCheck,
                redis: redisCheck,
                fcm: {
                    status: fcmCheck.status,
                    configured: fcmCheck.configured,
                    latency_ms: fcmCheck.latency_ms,
                    detail: fcmCheck.detail,
                },
                whatsapp: {
                    status: whatsappCheck.status,
                    configured: whatsappCheck.configured,
                    latency_ms: whatsappCheck.latency_ms,
                    detail: whatsappCheck.detail,
                },
                sentry: {
                    status: sentryCheck.status,
                    configured: sentryCheck.configured,
                    latency_ms: sentryCheck.latency_ms,
                    detail: sentryCheck.detail,
                },
                posthog: {
                    status: posthogCheck.status,
                    configured: posthogCheck.configured,
                    latency_ms: posthogCheck.latency_ms,
                    detail: posthogCheck.detail,
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
        logError("[superadmin/monitoring/health]", err);
        return apiError("Failed to run health checks", 500);
    }
}
