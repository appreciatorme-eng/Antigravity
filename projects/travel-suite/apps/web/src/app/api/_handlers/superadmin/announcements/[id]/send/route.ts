// POST /api/superadmin/announcements/:id/send — send a draft announcement to target users.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logPlatformAction } from "@/lib/platform/audit";
import { sendNotificationToUser } from "@/lib/notifications";
import type { Database } from "@/lib/database.types";

const PLATFORM_ANNOUNCEMENT_SELECT = [
    "announcement_type",
    "body",
    "created_at",
    "delivery_channels",
    "id",
    "recipient_count",
    "scheduled_at",
    "sent_at",
    "sent_by",
    "status",
    "target_org_ids",
    "target_segment",
    "title",
    "updated_at",
].join(", ");
type PlatformAnnouncementRow = Pick<
    Database["public"]["Tables"]["platform_announcements"]["Row"],
    "announcement_type" | "body" | "created_at" | "delivery_channels" | "id" | "recipient_count" | "scheduled_at" | "sent_at" | "sent_by" | "status" | "target_org_ids" | "target_segment" | "title" | "updated_at"
>;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const { adminClient, userId } = auth;

    try {
        const announcementResult = await adminClient
            .from("platform_announcements")
            .select(PLATFORM_ANNOUNCEMENT_SELECT)
            .eq("id", id)
            .single();
        const ann = announcementResult.data as unknown as PlatformAnnouncementRow | null;

        if (!ann) {
            return apiError("Announcement not found", 404);
        }
        if (ann.status === "sent") {
            return apiError("Already sent", 409);
        }

        // Build recipient query based on target_segment
        let profilesQuery = adminClient
            .from("profiles")
            .select("id, organization_id")
            .eq("role", "admin");

        if (ann.target_segment === "specific_orgs" && Array.isArray(ann.target_org_ids) && ann.target_org_ids.length > 0) {
            profilesQuery = profilesQuery.in("organization_id", ann.target_org_ids as string[]);
        } else if (ann.target_segment !== "all") {
            // Filter by tier via join — get org ids matching tier first
            const orgsResult = await adminClient
                .from("organizations")
                .select("id")
                .eq("subscription_tier", ann.target_segment);

            const orgIds = (orgsResult.data ?? []).map((o: { id: string }) => o.id);
            if (orgIds.length === 0) {
                return NextResponse.json({ sent: 0, message: "No organizations match target segment" });
            }
            profilesQuery = profilesQuery.in("organization_id", orgIds);
        }

        const profilesResult = await profilesQuery.limit(5000);
        const recipients = profilesResult.data ?? [];

        // Send notifications (fire-and-forget, don't await all)
        const results = await Promise.allSettled(
            recipients.map((profile: { id: string }) =>
                sendNotificationToUser({
                    userId: profile.id,
                    title: ann.title as string,
                    body: ann.body as string,
                    data: { type: "platform_announcement", announcement_id: id, announcement_type: ann.announcement_type as string },
                })
            )
        );

        const sentCount = results.filter((r) => r.status === "fulfilled").length;

        // Mark as sent
        await adminClient
            .from("platform_announcements")
            .update({
                status: "sent",
                sent_at: new Date().toISOString(),
                recipient_count: sentCount,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        await logPlatformAction(userId, "announcement_sent", "announcement", {
            announcement_id: id,
            title: ann.title,
            recipient_count: sentCount,
            target_segment: ann.target_segment,
        });

        return NextResponse.json({ sent: sentCount, total_recipients: recipients.length });
    } catch (err) {
        console.error(`[superadmin/announcements/${id}/send]`, err);
        return apiError("Failed to send announcement", 500);
    }
}
