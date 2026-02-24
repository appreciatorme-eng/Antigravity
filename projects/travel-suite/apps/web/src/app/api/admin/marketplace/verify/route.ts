import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureOperationalMetric } from "@/lib/observability/metrics";

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

export async function GET() {
    try {
        const auth = await requireAdminUser();
        if ("error" in auth) return auth.error;

        const { data, error } = await supabaseAdmin
            .from("marketplace_profiles")
            .select(`
                *,
                organization:organizations(name, logo_url)
            `)
            .eq("verification_status", "pending");

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await requireAdminUser();
        if ("error" in auth) return auth.error;

        const { orgId, status } = await request.json();
        if (!orgId || (status !== "verified" && status !== "rejected")) {
            return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
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

        return NextResponse.json({
            ...data,
            notification,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
