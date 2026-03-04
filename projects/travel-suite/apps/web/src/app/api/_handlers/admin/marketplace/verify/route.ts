import { NextRequest } from "next/server";
import { requireAdmin, type RequireAdminResult } from "@/lib/auth/admin";
import { getCachedJson, setCachedJson } from "@/lib/cache/upstash";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import { jsonWithRequestId as withRequestId } from "@/lib/api/response";
import {
    MARKETPLACE_VERIFY_CACHE_TTL_SECONDS,
    buildMarketplacePendingCacheKey,
    invalidateMarketplaceVerifyCache,
} from "@/lib/marketplace-verify-cache";
import {
    getRequestContext,
    getRequestId,
    logError,
    logEvent,
} from "@/lib/observability/logger";

const MARKETPLACE_VERIFY_LIST_RATE_LIMIT_MAX = 120;
const MARKETPLACE_VERIFY_LIST_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MARKETPLACE_VERIFY_MUTATION_RATE_LIMIT_MAX = 40;
const MARKETPLACE_VERIFY_MUTATION_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

type AdminContext = Extract<RequireAdminResult, { ok: true }>;
type AdminClient = AdminContext["adminClient"];

type OrganizationOwnerJoin = {
    name: string | null;
    profiles: { id: string | null; email: string | null } | Array<{ id: string | null; email: string | null }> | null;
};

type NotificationDeliveryStatus = {
    attempted: boolean;
    sent: boolean;
    reason: string | null;
};

function toNotificationStatusLabel(status: NotificationDeliveryStatus): "sent" | "failed" | "skipped" {
    if (!status.attempted) return "skipped";
    return status.sent ? "sent" : "failed";
}

async function trackVerificationNotification(
    adminClient: AdminClient,
    orgId: string,
    status: "verified" | "rejected",
    recipientId: string | null,
    orgName: string | null,
    delivery: NotificationDeliveryStatus
) {
    const nowIso = new Date().toISOString();
    try {
        await adminClient.from("notification_logs").insert({
            recipient_id: recipientId,
            recipient_type: "organization_owner",
            notification_type: "marketplace_verification_email",
            title: `Marketplace verification ${status}`,
            body: `Verification update for ${orgName || orgId}: ${toNotificationStatusLabel(delivery)}`,
            status: toNotificationStatusLabel(delivery),
            error_message: delivery.reason,
            sent_at: nowIso,
            updated_at: nowIso,
        });
    } catch {
        // Notification logging must not fail admin action.
    }

    void captureOperationalMetric("api.admin.marketplace.verify.notification", {
        organization_id: orgId,
        verification_status: status,
        attempted: delivery.attempted,
        sent: delivery.sent,
        reason: delivery.reason,
    });
}

function authErrorMessageForStatus(status: number): string {
    if (status === 403) return "Forbidden";
    if (status === 400) return "Admin organization not configured";
    return "Unauthorized";
}

function attachRateLimitHeaders(
    response: Response,
    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>,
): Response {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
    response.headers.set("retry-after", String(retryAfterSeconds));
    response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
    response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
    response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
    return response;
}

export async function GET(request: NextRequest) {
    const startedAt = Date.now();
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);
    try {
        const admin = await requireAdmin(request, { requireOrganization: false });
        if (!admin.ok) {
            return withRequestId(
                { error: authErrorMessageForStatus(admin.response.status || 401) },
                requestId,
                { status: admin.response.status || 401 },
            );
        }

        if (!admin.isSuperAdmin && !admin.organizationId) {
            return withRequestId(
                { error: "Admin organization not configured" },
                requestId,
                { status: 400 },
            );
        }

        const rateLimit = await enforceRateLimit({
            identifier: `list:${admin.userId}`,
            limit: MARKETPLACE_VERIFY_LIST_RATE_LIMIT_MAX,
            windowMs: MARKETPLACE_VERIFY_LIST_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:marketplace:verify",
        });
        if (!rateLimit.success) {
            const response = withRequestId(
                { error: "Too many marketplace verification requests. Please retry later." },
                requestId,
                { status: 429 },
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const scopedOrganizationId = admin.isSuperAdmin ? null : admin.organizationId;
        const cacheKey = buildMarketplacePendingCacheKey(scopedOrganizationId);
        const cachedPending = await getCachedJson<Record<string, unknown>[]>(cacheKey);
        if (Array.isArray(cachedPending)) {
            const response = withRequestId(cachedPending, requestId);
            response.headers.set("x-cache-status", "hit");
            return response;
        }

        let query = admin.adminClient
            .from("marketplace_profiles")
            .select(`
                *,
                organization:organizations(name, logo_url)
            `)
            .eq("verification_status", "pending");
        if (scopedOrganizationId) {
            query = query.eq("organization_id", scopedOrganizationId);
        }

        const { data, error } = await query;

        if (error) throw error;
        const pendingCount = Array.isArray(data) ? data.length : 0;
        if (Array.isArray(data)) {
            await setCachedJson(cacheKey, data, MARKETPLACE_VERIFY_CACHE_TTL_SECONDS);
        }
        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace pending verifications fetched", {
            ...requestContext,
            user_id: admin.userId,
            role: admin.role,
            scoped_organization_id: scopedOrganizationId,
            pending_count: pendingCount,
            durationMs,
        });
        void captureOperationalMetric("api.admin.marketplace.verify.list", {
            request_id: requestId,
            user_id: admin.userId,
            role: admin.role,
            scoped_organization_id: scopedOrganizationId,
            pending_count: pendingCount,
            duration_ms: durationMs,
        });
        const response = withRequestId(data || [], requestId);
        response.headers.set("x-cache-status", "miss");
        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logError("Marketplace pending verifications fetch failed", error, requestContext);
        void captureOperationalMetric("api.admin.marketplace.verify.list.error", {
            request_id: requestId,
            error: message,
        });
        return withRequestId({ error: message }, requestId, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const startedAt = Date.now();
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);
    try {
        const admin = await requireAdmin(request, { requireOrganization: false });
        if (!admin.ok) {
            return withRequestId(
                { error: authErrorMessageForStatus(admin.response.status || 401) },
                requestId,
                { status: admin.response.status || 401 },
            );
        }

        if (!admin.isSuperAdmin && !admin.organizationId) {
            return withRequestId(
                { error: "Admin organization not configured" },
                requestId,
                { status: 400 },
            );
        }

        const rateLimit = await enforceRateLimit({
            identifier: `mutate:${admin.userId}`,
            limit: MARKETPLACE_VERIFY_MUTATION_RATE_LIMIT_MAX,
            windowMs: MARKETPLACE_VERIFY_MUTATION_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:marketplace:verify",
        });
        if (!rateLimit.success) {
            const response = withRequestId(
                { error: "Too many marketplace verification mutations. Please retry later." },
                requestId,
                { status: 429 },
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const body = await request.json().catch(() => ({}));
        const orgId = sanitizeText((body as { orgId?: unknown }).orgId, { maxLength: 120 });
        const status = sanitizeText((body as { status?: unknown }).status, { maxLength: 24 });
        const notes = sanitizeText((body as { notes?: unknown }).notes, {
            maxLength: 1000,
            preserveNewlines: true,
        });
        const levelRaw = sanitizeText((body as { level?: unknown }).level, { maxLength: 24 }).toLowerCase();
        const verificationLevel = levelRaw === "gold" || levelRaw === "platinum" ? levelRaw : "standard";

        if (!orgId || (status !== "verified" && status !== "rejected")) {
            return withRequestId({ error: "Invalid request payload" }, requestId, { status: 400 });
        }

        if (!admin.isSuperAdmin && admin.organizationId !== orgId) {
            return withRequestId(
                { error: "Cannot verify organization outside your scope" },
                requestId,
                { status: 403 },
            );
        }

        const verificationPayload = {
            verification_status: status,
            is_verified: status === "verified",
            verified_at: status === "verified" ? new Date().toISOString() : null,
            verification_notes: notes || null,
            verification_level: status === "verified" ? verificationLevel : "standard",
        };

        let data: Record<string, unknown> | null = null;
        let error: { message: string } | null = null;

        const primaryUpdate = await admin.adminClient
            .from("marketplace_profiles")
            .update(verificationPayload as never)
            .eq("organization_id", orgId)
            .select()
            .single();
        data = (primaryUpdate.data as Record<string, unknown> | null) || null;
        error = primaryUpdate.error ? { message: primaryUpdate.error.message } : null;

        if (error?.message?.includes("column")) {
            const legacyUpdate = await admin.adminClient
                .from("marketplace_profiles")
                .update({
                    verification_status: status,
                    is_verified: status === "verified",
                })
                .eq("organization_id", orgId)
                .select()
                .single();

            data = (legacyUpdate.data as Record<string, unknown> | null) || null;
            error = legacyUpdate.error ? { message: legacyUpdate.error.message } : null;
        }

        if (error) throw error;

        const { data: orgInfo } = await admin.adminClient
            .from("organizations")
            .select("name, profiles!owner_id(id, email)")
            .eq("id", orgId)
            .maybeSingle();
        const organization = orgInfo as OrganizationOwnerJoin | null;
        const ownerProfile = Array.isArray(organization?.profiles)
            ? organization?.profiles[0]
            : organization?.profiles;
        const receiverEmail = ownerProfile?.email || null;
        const receiverId = ownerProfile?.id || null;
        const orgName = organization?.name || "Your Organization";

        let notification: NotificationDeliveryStatus = {
            attempted: false,
            sent: false,
            reason: "missing_recipient_email",
        };

        if (receiverEmail) {
            const { sendVerificationNotification } = await import("@/lib/marketplace-emails");
            const delivery = await sendVerificationNotification({
                receiverEmail,
                orgName,
                status: status as "verified" | "rejected",
                settingsUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://itinerary-ai.vercel.app"}/admin/settings/marketplace`,
            });
            notification = {
                attempted: true,
                sent: delivery.success,
                reason: delivery.success ? null : delivery.reason || "email_send_failed",
            };
        }

        await trackVerificationNotification(
            admin.adminClient,
            orgId,
            status as "verified" | "rejected",
            receiverId,
            organization?.name || null,
            notification
        );

        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace verification status updated", {
            ...requestContext,
            user_id: admin.userId,
            role: admin.role,
            organization_id: orgId,
            verification_status: status,
            verification_level: verificationLevel,
            has_notes: Boolean(notes),
            notification_attempted: notification.attempted,
            notification_sent: notification.sent,
            durationMs,
        });
        void captureOperationalMetric("api.admin.marketplace.verify.update", {
            request_id: requestId,
            user_id: admin.userId,
            role: admin.role,
            organization_id: orgId,
            verification_status: status,
            verification_level: verificationLevel,
            has_notes: Boolean(notes),
            notification_attempted: notification.attempted,
            notification_sent: notification.sent,
            duration_ms: durationMs,
        });

        const invalidated = await invalidateMarketplaceVerifyCache().catch(() => 0);
        const response = withRequestId({
            ...data,
            notification,
        }, requestId);
        response.headers.set("x-cache-invalidated", String(invalidated));
        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logError("Marketplace verification update failed", error, requestContext);
        void captureOperationalMetric("api.admin.marketplace.verify.update.error", {
            request_id: requestId,
            error: message,
        });
        return withRequestId({ error: message }, requestId, { status: 500 });
    }
}
