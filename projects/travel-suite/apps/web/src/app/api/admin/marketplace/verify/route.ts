import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import {
    getRequestContext,
    getRequestId,
    logError,
    logEvent,
} from "@/lib/observability/logger";

const supabaseAdmin = createAdminClient();

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
    orgId: string,
    status: "verified" | "rejected",
    recipientId: string | null,
    orgName: string | null,
    delivery: NotificationDeliveryStatus
) {
    const nowIso = new Date().toISOString();
    try {
        await supabaseAdmin.from("notification_logs").insert({
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

async function requireAdminUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role, organization_id")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    if (!profile.organization_id) {
        return {
            error: NextResponse.json(
                { error: "Admin organization not configured" },
                { status: 400 }
            ),
        };
    }

    return { user, profile };
}

function withRequestId(body: unknown, requestId: string, init?: ResponseInit) {
    const payload =
        body && typeof body === "object" && !Array.isArray(body)
            ? { ...(body as Record<string, unknown>), request_id: requestId }
            : body;
    const response = NextResponse.json(payload, init);
    response.headers.set("x-request-id", requestId);
    return response;
}

export async function GET(request: NextRequest) {
    const startedAt = Date.now();
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);
    try {
        const auth = await requireAdminUser();
        if ("error" in auth) {
            const errorResponse =
                auth.error ||
                NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            errorResponse.headers.set("x-request-id", requestId);
            return errorResponse;
        }

        const { data, error } = await supabaseAdmin
            .from("marketplace_profiles")
            .select(`
                *,
                organization:organizations(name, logo_url)
            `)
            .eq("verification_status", "pending");

        if (error) throw error;
        const pendingCount = Array.isArray(data) ? data.length : 0;
        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace pending verifications fetched", {
            ...requestContext,
            user_id: auth.user.id,
            pending_count: pendingCount,
            durationMs,
        });
        void captureOperationalMetric("api.admin.marketplace.verify.list", {
            request_id: requestId,
            user_id: auth.user.id,
            pending_count: pendingCount,
            duration_ms: durationMs,
        });
        return withRequestId(data || [], requestId);
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
        const auth = await requireAdminUser();
        if ("error" in auth) {
            const errorResponse =
                auth.error ||
                NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            errorResponse.headers.set("x-request-id", requestId);
            return errorResponse;
        }

        const { orgId, status } = await request.json();
        if (!orgId || (status !== "verified" && status !== "rejected")) {
            return withRequestId({ error: "Invalid request payload" }, requestId, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("marketplace_profiles")
            .update({
                verification_status: status,
                is_verified: status === "verified",
            })
            .eq("organization_id", orgId)
            .select()
            .single();

        if (error) throw error;

        const { data: orgInfo } = await supabaseAdmin
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
            orgId,
            status as "verified" | "rejected",
            receiverId,
            organization?.name || null,
            notification
        );

        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace verification status updated", {
            ...requestContext,
            user_id: auth.user.id,
            organization_id: orgId,
            verification_status: status,
            notification_attempted: notification.attempted,
            notification_sent: notification.sent,
            durationMs,
        });
        void captureOperationalMetric("api.admin.marketplace.verify.update", {
            request_id: requestId,
            user_id: auth.user.id,
            organization_id: orgId,
            verification_status: status,
            notification_attempted: notification.attempted,
            notification_sent: notification.sent,
            duration_ms: durationMs,
        });

        return withRequestId({
            ...data,
            notification,
        }, requestId);
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
