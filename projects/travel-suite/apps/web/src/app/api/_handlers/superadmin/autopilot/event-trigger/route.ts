import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { runBusinessOsEventAutomation } from "@/lib/platform/business-os";
import { logError } from "@/lib/observability/logger";

const VALID_TRIGGERS = [
    "account_state_updated",
    "work_item_updated",
    "collections_updated",
    "comms_updated",
    "commitment_updated",
    "support_ticket_responded",
    "work_item_outcome_recorded",
] as const;

type ValidTrigger = typeof VALID_TRIGGERS[number];

function isValidTrigger(value: unknown): value is ValidTrigger {
    return typeof value === "string" && VALID_TRIGGERS.includes(value as ValidTrigger);
}

export async function POST(request: NextRequest) {
    const cronAuth = await authorizeCronRequest(request);
    let authorized = cronAuth.authorized;

    if (!authorized) {
        const admin = await requireSuperAdmin(request);
        authorized = admin.ok;
        if (!admin.ok) return admin.response;
    }

    if (!authorized) return apiError("Unauthorized", 401);

    try {
        const body = await request.json() as unknown;
        if (typeof body !== "object" || body === null) return apiError("Invalid body", 400);

        const { org_id, trigger } = body as Record<string, unknown>;
        if (typeof org_id !== "string" || !org_id.trim()) return apiError("org_id required", 400);
        if (!isValidTrigger(trigger)) return apiError("Invalid trigger", 400);

        const { createAdminClient } = await import("@/lib/supabase/admin");
        const db = createAdminClient();
        const result = await runBusinessOsEventAutomation(db as never, {
            orgId: org_id.trim(),
            currentUserId: null,
            trigger,
        });

        return NextResponse.json({ success: true, result }, { status: 200 });
    } catch (error) {
        logError("[autopilot/event-trigger POST]", error);
        return apiError("Event trigger failed", 500);
    }
}
