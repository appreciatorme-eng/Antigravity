import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { sanitizeText } from "@/lib/security/sanitize";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import {
    getRequestContext,
    getRequestId,
    logError,
    logEvent,
} from "@/lib/observability/logger";

const InquiryCreateSchema = z.object({
    subject: z.string().max(160).optional(),
    message: z.string().min(1).max(5000),
});
const supabaseAdmin = createAdminClient();

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] || null : value;
}

type ReceiverOrgWithOwner = {
    name: string;
    profiles: { id: string | null; email: string | null } | { id: string | null; email: string | null }[] | null;
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

async function trackInquiryNotification(
    inquiryId: string,
    senderOrgId: string,
    receiverOrgId: string,
    senderOrgName: string | null,
    receiverOwnerId: string | null,
    status: NotificationDeliveryStatus
) {
    const nowIso = new Date().toISOString();

    try {
        await supabaseAdmin.from("notification_logs").insert({
            recipient_id: receiverOwnerId,
            recipient_type: "organization_owner",
            notification_type: "marketplace_inquiry_email",
            title: `Marketplace inquiry from ${senderOrgName || "Travel Operator"}`,
            body: `Inquiry ${inquiryId} delivery status: ${toNotificationStatusLabel(status)}`,
            status: toNotificationStatusLabel(status),
            error_message: status.reason,
            sent_at: nowIso,
            updated_at: nowIso,
        });
    } catch {
        // Logging must not break inquiry creation.
    }

    void captureOperationalMetric("api.marketplace.inquiry.notification", {
        inquiry_id: inquiryId,
        sender_org_id: senderOrgId,
        receiver_org_id: receiverOrgId,
        attempted: status.attempted,
        sent: status.sent,
        reason: status.reason,
    });
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

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const startedAt = Date.now();
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);
    const supabase = await createClient();
    const { id: targetOrgId } = await context.params;

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user || authError) {
            logEvent("warn", "Marketplace inquiry create unauthorized", requestContext);
            return withRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id, role")
            .eq("id", user.id)
            .single();

        if (!profile || !profile.organization_id) {
            return withRequestId({ error: "User has no organization" }, requestId, { status: 403 });
        }

        const senderOrgId = profile.organization_id;

        if (senderOrgId === targetOrgId) {
            return withRequestId({ error: "Cannot send inquiry to your own organization" }, requestId, { status: 400 });
        }

        const { data: targetProfile } = await supabase
            .from("marketplace_profiles")
            .select("organization_id")
            .eq("organization_id", targetOrgId)
            .eq("is_verified", true)
            .eq("verification_status", "verified")
            .maybeSingle();

        if (!targetProfile) {
            return withRequestId({ error: "Operator not available in marketplace" }, requestId, { status: 404 });
        }

        const payloadRaw = await request.json().catch(() => null);
        const parsed = InquiryCreateSchema.safeParse(payloadRaw);
        if (!parsed.success) {
            return withRequestId({ error: "Invalid inquiry payload", details: parsed.error.flatten() }, requestId, { status: 400 });
        }

        const subject = sanitizeText(parsed.data.subject, { maxLength: 160 }) || "Partnership Inquiry";
        const message = sanitizeText(parsed.data.message, {
            maxLength: 5000,
            preserveNewlines: true,
        });
        if (!message) {
            return withRequestId({ error: "Message is required" }, requestId, { status: 400 });
        }

        const { data, error } = await supabase
            .from("marketplace_inquiries")
            .insert({
                sender_org_id: senderOrgId,
                receiver_org_id: targetOrgId,
                subject,
                message,
                status: "pending"
            })
            .select()
            .single();

        if (error) throw error;

        const [senderOrgResult, receiverInfoResult] = await Promise.all([
            supabaseAdmin
                .from("organizations")
                .select("name")
                .eq("id", senderOrgId)
                .maybeSingle(),
            supabaseAdmin
                .from("organizations")
                .select("name, profiles!owner_id(id, email)")
                .eq("id", targetOrgId)
                .maybeSingle(),
        ]);

        const senderOrgName = senderOrgResult.data?.name || null;
        const receiverInfo = (receiverInfoResult.data as ReceiverOrgWithOwner | null) || null;
        const receiverOwner = normalizeRelation(receiverInfo?.profiles || null);
        const receiverEmail = receiverOwner?.email || null;
        const receiverOwnerId = receiverOwner?.id || null;

        let notification: NotificationDeliveryStatus = {
            attempted: false,
            sent: false,
            reason: "missing_recipient_email",
        };

        if (!senderOrgName) {
            notification.reason = "missing_sender_org";
        } else if (receiverEmail) {
            const { sendInquiryNotification } = await import("@/lib/marketplace-emails");
            const delivery = await sendInquiryNotification({
                receiverEmail,
                senderOrgName,
                subject,
                message,
                inquiryUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://itinerary-ai.vercel.app"}/admin/marketplace/inquiries`,
            });

            notification = {
                attempted: true,
                sent: delivery.success,
                reason: delivery.success ? null : delivery.reason || "email_send_failed",
            };
        }

        const inquiryId = typeof data?.id === "string" ? data.id : "";
        if (inquiryId) {
            await trackInquiryNotification(
                inquiryId,
                senderOrgId,
                targetOrgId,
                senderOrgName,
                receiverOwnerId,
                notification
            );
        }

        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace inquiry created", {
            ...requestContext,
            user_id: user.id,
            sender_org_id: senderOrgId,
            receiver_org_id: targetOrgId,
            inquiry_id: inquiryId || null,
            notification_attempted: notification.attempted,
            notification_sent: notification.sent,
            durationMs,
        });
        void captureOperationalMetric("api.marketplace.inquiry.create", {
            request_id: requestId,
            user_id: user.id,
            sender_org_id: senderOrgId,
            receiver_org_id: targetOrgId,
            inquiry_id: inquiryId || null,
            notification_attempted: notification.attempted,
            notification_sent: notification.sent,
            duration_ms: durationMs,
        });

        return withRequestId({
            ...data,
            notification,
        }, requestId);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create inquiry";
        logError("Marketplace inquiry create failed", error, requestContext);
        void captureOperationalMetric("api.marketplace.inquiry.create.error", {
            request_id: requestId,
            error: message,
        });
        return withRequestId({ error: message }, requestId, { status: 500 });
    }
}
