// POST /api/superadmin/monitoring/queues/:queue/:action — retry, flush, or purge queues.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { logPlatformAction, getClientIpFromRequest } from "@/lib/platform/audit";

const VALID_QUEUES = ["notifications", "social", "dead-letters", "pdf"];
const VALID_ACTIONS = ["retry", "flush", "purge"];

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    // Pattern: /api/superadmin/monitoring/queues/:queue/:action
    const action = segments[segments.length - 1];
    const queue = segments[segments.length - 2];

    if (!VALID_QUEUES.includes(queue)) {
        return apiError(`Invalid queue: ${queue}. Must be one of: ${VALID_QUEUES.join(", ")}`, 400);
    }
    if (!VALID_ACTIONS.includes(action)) {
        return apiError(`Invalid action: ${action}. Must be one of: ${VALID_ACTIONS.join(", ")}`, 400);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;

    try {
        let affected = 0;
        const tableMap: Record<string, string> = {
            notifications: "notification_queue",
            social: "social_post_queue",
            "dead-letters": "notification_queue",
            pdf: "pdf_extraction_queue",
        };

        const table = tableMap[queue];
        if (!table) {
            return apiError(`Queue "${queue}" does not have a backing table`, 400);
        }

        if (action === "retry") {
            // Move failed items back to pending
            if (queue === "dead-letters") {
                const { data } = await db
                    .from(table)
                    .update({ status: "pending", retries: 0 })
                    .eq("status", "dead_letter")
                    .select("id");
                affected = data?.length ?? 0;
            } else {
                const { data } = await db
                    .from(table)
                    .update({ status: "pending", retries: 0 })
                    .eq("status", "failed")
                    .select("id");
                affected = data?.length ?? 0;
            }
        } else if (action === "flush") {
            // Clear completed and failed items
            const { data } = await db
                .from(table)
                .delete()
                .in("status", ["completed", "failed", "dead_letter"])
                .select("id");
            affected = data?.length ?? 0;
        } else if (action === "purge") {
            // Clear ALL items from the queue — dangerous
            const { data } = await db
                .from(table)
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000") // delete all
                .select("id");
            affected = data?.length ?? 0;
        }

        await logPlatformAction(
            auth.userId,
            `Queue ${action}: ${queue} (${affected} items affected)`,
            "settings",
            { queue, action, affected_count: affected },
            getClientIpFromRequest(request),
        );

        return NextResponse.json({
            ok: true,
            queue,
            action,
            affected_count: affected,
        });
    } catch (err) {
        logError("[superadmin/monitoring/queue-actions]", err);
        return apiError("Failed to perform queue action", 500);
    }
}
