import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizeText } from "@/lib/security/sanitize";
import { safeErrorMessage } from "@/lib/security/safe-error";

interface DismissBody {
    taskId: string;
    taskType: string;
    entityId: string;
}

function isValidDismissBody(body: unknown): body is DismissBody {
    if (!body || typeof body !== "object") return false;
    const obj = body as Record<string, unknown>;
    return (
        typeof obj.taskId === "string" &&
        typeof obj.taskType === "string" &&
        typeof obj.entityId === "string"
    );
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId, userId, adminClient } = auth;
        const orgId = organizationId!;

        const rawBody = await request.json().catch(() => null);
        if (!isValidDismissBody(rawBody)) {
            return apiError("Invalid request body. Required: taskId, taskType, entityId", 400);
        }

        const taskId = sanitizeText(rawBody.taskId, { maxLength: 200 });
        const taskType = sanitizeText(rawBody.taskType, { maxLength: 100 });
        const entityId = sanitizeText(rawBody.entityId, { maxLength: 100 });

        if (!taskId || !taskType || !entityId) {
            return apiError("taskId, taskType, and entityId must be non-empty strings", 400);
        }

        const { error } = await adminClient
            .from("dashboard_task_dismissals")
            .upsert(
                {
                    organization_id: orgId,
                    user_id: userId,
                    task_id: taskId,
                    task_type: taskType,
                    entity_id: entityId,
                    dismissed_at: new Date().toISOString(),
                },
                {
                    onConflict: "organization_id,user_id,task_id",
                }
            );

        if (error) {
            console.error("Failed to dismiss task:", error);
            return apiError("Failed to dismiss task", 500);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Task dismiss error:", error);
        return NextResponse.json(
            {
                error: safeErrorMessage(error, "Request failed"),
            },
            { status: 500 }
        );
    }
}
