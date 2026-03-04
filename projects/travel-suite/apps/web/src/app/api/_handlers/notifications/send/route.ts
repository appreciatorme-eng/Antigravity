import { NextRequest } from "next/server";
import { z } from "zod";
import { sendNotificationToUser, sendNotificationToTripUsers } from "@/lib/notifications";
import { requireAdmin, type RequireAdminResult } from "@/lib/auth/admin";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeEmail, sanitizeText } from "@/lib/security/sanitize";
import { jsonWithRequestId as withRequestId } from "@/lib/api/response";
import {
    getRequestContext,
    getRequestId,
    logError,
    logEvent,
} from "@/lib/observability/logger";

const NOTIFICATION_RATE_LIMIT_MAX = 40;
const NOTIFICATION_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
type AdminContext = Extract<RequireAdminResult, { ok: true }>;

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

async function resolveScopedTrip(
    admin: AdminContext,
    tripId: string
): Promise<{ id: string; organization_id: string | null } | null> {
    let query = admin.adminClient
        .from("trips")
        .select("id, organization_id")
        .eq("id", tripId)
        .limit(1);

    if (!admin.isSuperAdmin) {
        if (!admin.organizationId) return null;
        query = query.eq("organization_id", admin.organizationId);
    }

    const { data } = await query.maybeSingle();
    return data || null;
}

async function resolveScopedRecipientUserId(
    admin: AdminContext,
    userId?: string,
    email?: string | null
): Promise<string | null> {
    if (userId) {
        let query = admin.adminClient
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .limit(1);

        if (!admin.isSuperAdmin) {
            if (!admin.organizationId) return null;
            query = query.eq("organization_id", admin.organizationId);
        }

        const { data } = await query.maybeSingle();
        return data?.id || null;
    }

    if (!email) return null;

    let query = admin.adminClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);

    if (!admin.isSuperAdmin) {
        if (!admin.organizationId) return null;
        query = query.eq("organization_id", admin.organizationId);
    }

    const { data } = await query.maybeSingle();
    return data?.id || null;
}

export async function POST(request: NextRequest) {
    const startedAt = Date.now();
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);

    try {
        const admin = await requireAdmin(request, { requireOrganization: false });
        if (!admin.ok) {
            const status = admin.response.status || 401;
            const fallbackMessage =
                status === 403
                    ? "Forbidden"
                    : status === 400
                        ? "Admin organization not configured"
                        : "Unauthorized";

            return withRequestId({ error: fallbackMessage }, requestId, { status });
        }

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: NOTIFICATION_RATE_LIMIT_MAX,
            windowMs: NOTIFICATION_RATE_LIMIT_WINDOW_MS,
            prefix: "api:notifications:send",
        });
        if (!rateLimit.success) {
            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
            const response = withRequestId(
                { error: "Too many notification requests. Please retry later." },
                requestId,
                { status: 429 }
            );
            response.headers.set("retry-after", String(retryAfterSeconds));
            response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
            response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
            response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
            return response;
        }

        const rawBody = await request.json().catch(() => null);
        const parsed = NotificationSendSchema.safeParse(rawBody);
        if (!parsed.success) {
            return withRequestId(
                { error: "Invalid request body", details: parsed.error.flatten() },
                requestId,
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
            return withRequestId({ error: "Title and body are required" }, requestId, { status: 400 });
        }

        let result;

        if (tripId && !userId && !email) {
            const scopedTrip = await resolveScopedTrip(admin, tripId);
            if (!scopedTrip) {
                return withRequestId(
                    { error: "Trip not found in your organization scope" },
                    requestId,
                    { status: 404 }
                );
            }

            result = await sendNotificationToTripUsers(tripId, title, messageBody, type, {
                organizationId: scopedTrip.organization_id,
            });
        } else {
            const resolvedUserId = await resolveScopedRecipientUserId(admin, userId, email);

            if (!resolvedUserId) {
                return withRequestId(
                    { error: "Unable to resolve user in your organization scope" },
                    requestId,
                    { status: 404 }
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
            return withRequestId(result, requestId);
        }

        logEvent("warn", "Notification send failed", {
            ...requestContext,
            success: false,
            trip_id: tripId || null,
            error: result.error,
            durationMs,
        });
        return withRequestId({ error: result.error }, requestId, { status: 500 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logError("Send notification endpoint crashed", error, requestContext);
        void captureOperationalMetric("api.notifications.send.error", {
            request_id: requestId,
            error: message,
        });
        return withRequestId({ error: message }, requestId, { status: 500 });
    }
}
