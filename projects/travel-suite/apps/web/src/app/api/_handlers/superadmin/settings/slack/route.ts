import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { sendOpsAlert, resolveSlackWebhookConfig } from "@/lib/god-slack";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const slack = resolveSlackWebhookConfig();
    return NextResponse.json({
        configured: slack.configured,
        source: slack.source,
    });
}

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        const slack = resolveSlackWebhookConfig();
        if (!slack.configured) {
            return NextResponse.json(
                {
                    error: "Slack webhook is not configured. Set SLACK_OPS_WEBHOOK_URL or SLACK_WEBHOOK_URL.",
                    configured: false,
                    source: null,
                },
                { status: 409 },
            );
        }

        let customMessage: string | null = null;
        try {
            const body = await request.json() as { message?: unknown };
            if (typeof body.message === "string" && body.message.trim().length > 0) {
                customMessage = body.message.trim();
            }
        } catch {
            // Body is optional for this endpoint.
        }

        const text = customMessage ?? [
            "Slack integration test from God Mode",
            `Time: ${new Date().toISOString()}`,
            `Requested by: ${auth.userId}`,
        ].join("\n");

        const posted = await sendOpsAlert(text);
        if (!posted) {
            return apiError("Slack webhook call failed", 502);
        }

        await logPlatformAction(
            auth.userId,
            "Slack: Test alert sent",
            "settings",
            { source: slack.source },
            getClientIpFromRequest(request),
        );

        return NextResponse.json({
            ok: true,
            configured: true,
            source: slack.source,
            posted: true,
        });
    } catch (error) {
        logError("[superadmin/settings/slack POST]", error);
        return apiError("Failed to send Slack test alert", 500);
    }
}
