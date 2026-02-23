import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendNotificationToUser, sendNotificationToTripUsers } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeEmail, sanitizeText } from "@/lib/security/sanitize";
import {
    getRequestContext,
    getRequestId,
    logError,
    logEvent,
} from "@/lib/observability/logger";

const supabaseAdmin = createAdminClient();
const NOTIFICATION_RATE_LIMIT_MAX = 40;
const NOTIFICATION_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

const NotificationSendSchema = z.object({
    type: z.unknown().optional(),
    tripId: z.unknown().optional(),
    userId: z.unknown().optional(),
    email: z.unknown().optional(),
    title: z.unknown(),
    body: z.unknown(),
    data: z.record(z.string(), z.unknown()).optional(),
});

function sanitizeIdentifier(value: unknown, maxLength = 80): string | null {
    const candidate = sanitizeText(value, { maxLength });
    if (!candidate) return null;
    return /^[a-zA-Z0-9_-]{6,}$/.test(candidate) ? candidate : null;
}

function sanitizeNotificationData(
    value: Record<string, unknown> | undefined
): Record<string, string | number | boolean> {
    if (!value || typeof value !== "object") return {};
    const output: Record<string, string | number | boolean> = {};
    const entries = Object.entries(value).slice(0, 20);

    for (const [key, raw] of entries) {
        const safeKey = sanitizeText(key, { maxLength: 40 }).toLowerCase();
        if (!safeKey) continue;

        if (typeof raw === "boolean") {
            output[safeKey] = raw;
            continue;
        }
        if (typeof raw === "number" && Number.isFinite(raw)) {
            output[safeKey] = raw;
            continue;
        }

        const safeText = sanitizeText(raw, { maxLength: 200 });
        if (!safeText) continue;
        output[safeKey] = safeText;
    }

    return output;
}

export async function POST(request: NextRequest) {
    const startedAt = Date.now();
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);

    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            logEvent("warn", "Notification send unauthorized: missing bearer token", requestContext);
            return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            logEvent("warn", "Notification send unauthorized: invalid token", {
                ...requestContext,
                auth_error: authError?.message,
            });
            return NextResponse.json({ error: "Invalid token", request_id: requestId }, { status: 401 });
        }

        const rateLimit = await enforceRateLimit({
            identifier: user.id,
            limit: NOTIFICATION_RATE_LIMIT_MAX,
            windowMs: NOTIFICATION_RATE_LIMIT_WINDOW_MS,
            prefix: "api:notifications:send",
        });
        if (!rateLimit.success) {
            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
            const response = NextResponse.json(
                { error: "Too many notification requests. Please retry later.", request_id: requestId },
                { status: 429 }
            );
            response.headers.set("retry-after", String(retryAfterSeconds));
            response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
            response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
            response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
            return response;
        }

        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            logEvent("warn", "Notification send forbidden for non-admin", {
                ...requestContext,
                user_id: user.id,
            });
            return NextResponse.json({ error: "Admin access required", request_id: requestId }, { status: 403 });
        }

        const rawBody = await request.json().catch(() => null);
        const parsed = NotificationSendSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: parsed.error.flatten(), request_id: requestId },
                { status: 400 }
            );
        }

        const type = sanitizeText(parsed.data.type, { maxLength: 40 }) || "manual";
        const tripId = sanitizeIdentifier(parsed.data.tripId) || undefined;
        const userId = sanitizeIdentifier(parsed.data.userId) || undefined;
        const email = sanitizeEmail(parsed.data.email);
        const title = sanitizeText(parsed.data.title, { maxLength: 160 });
        const messageBody = sanitizeText(parsed.data.body, { maxLength: 4000, preserveNewlines: true });
        const data = sanitizeNotificationData(parsed.data.data);

        if (!title || !messageBody) {
            return NextResponse.json(
                { error: "Title and body are required", request_id: requestId },
                { status: 400 }
            );
        }

        let result;

        if (tripId && !userId && !email) {
            result = await sendNotificationToTripUsers(tripId, title, messageBody, type);
        } else {
            let resolvedUserId = userId;
            if (!resolvedUserId && email) {
                const { data: targetProfile } = await supabaseAdmin
                    .from("profiles")
                    .select("id")
                    .eq("email", email)
                    .single();
                resolvedUserId = targetProfile?.id || undefined;
            }

            if (!resolvedUserId) {
                return NextResponse.json(
                    { error: "Unable to resolve user for notification", request_id: requestId },
                    { status: 400 }
                );
            }

            result = await sendNotificationToUser({
                userId: resolvedUserId,
                title,
                body: messageBody,
                data: {
                    type,
                    tripId,
                    ...data,
                },
            });
        }

        const durationMs = Date.now() - startedAt;
        void captureOperationalMetric("api.notifications.send", {
            request_id: requestId,
            success: result.success,
            type,
            trip_id: tripId || null,
            duration_ms: durationMs,
        });

        if (result.success) {
            logEvent("info", "Notification send completed", {
                ...requestContext,
                success: true,
                trip_id: tripId || null,
                durationMs,
            });
            const response = NextResponse.json({ ...result, request_id: requestId });
            response.headers.set("x-request-id", requestId);
            return response;
        }

        logEvent("warn", "Notification send failed", {
            ...requestContext,
            success: false,
            trip_id: tripId || null,
            error: result.error,
            durationMs,
        });
        return NextResponse.json({ error: result.error, request_id: requestId }, { status: 500 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logError("Send notification endpoint crashed", error, requestContext);
        void captureOperationalMetric("api.notifications.send.error", {
            request_id: requestId,
            error: message,
        });
        return NextResponse.json({ error: message, request_id: requestId }, { status: 500 });
    }
}
