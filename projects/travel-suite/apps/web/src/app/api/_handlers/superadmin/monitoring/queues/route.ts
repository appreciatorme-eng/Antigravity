// GET /api/superadmin/monitoring/queues — queue depths and oldest pending item age.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;

    try {
        const [notifResult, notifFailedResult, deadLetterResult, socialResult, pdfResult] = await Promise.all([
            adminClient
                .from("notification_queue")
                .select("created_at")
                .eq("status", "pending")
                .order("created_at", { ascending: true })
                .limit(1000),
            adminClient
                .from("notification_queue")
                .select("id", { count: "exact", head: true })
                .eq("status", "failed"),
            adminClient
                .from("notification_dead_letters")
                .select("id", { count: "exact", head: true }),
            adminClient
                .from("social_post_queue")
                .select("id", { count: "exact", head: true })
                .eq("status", "pending"),
            adminClient
                .from("pdf_extraction_queue")
                .select("id", { count: "exact", head: true })
                .eq("status", "pending"),
        ]);

        const pendingNotifs = notifResult.data ?? [];
        let oldestPendingMinutes = 0;
        if (pendingNotifs.length > 0) {
            const oldest = new Date(pendingNotifs[0].created_at as string);
            oldestPendingMinutes = Math.floor((Date.now() - oldest.getTime()) / 60_000);
        }

        return NextResponse.json({
            notification_queue: {
                pending: pendingNotifs.length,
                failed: notifFailedResult.count ?? 0,
                dead_letters: deadLetterResult.count ?? 0,
                oldest_pending_minutes: oldestPendingMinutes,
            },
            social_post_queue: {
                pending: socialResult.count ?? 0,
            },
            pdf_queue: {
                pending: pdfResult.count ?? 0,
            },
            checked_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error("[superadmin/monitoring/queues]", err);
        return NextResponse.json({ error: "Failed to load queue depths" }, { status: 500 });
    }
}
