import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { resolveSlackWebhookConfig, sendOpsAlert } from "@/lib/god-slack";
import { buildAutopilotAuditDetails, buildAutopilotSnapshot, generateDailyOpsBrief, runBusinessDailyAutopilot } from "@/lib/platform/business-os";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";
import { logError } from "@/lib/observability/logger";

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        const requestedRunKey = request.headers.get("x-idempotency-key")?.trim() ?? "";
        const fallbackRunKey = `manual:${auth.userId}:${new Date().toISOString().slice(0, 16)}`;
        const runKey = requestedRunKey || fallbackRunKey;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON path filter over audit details
        const rawDb = auth.adminClient as any;
        const existingRun = await rawDb
            .from("platform_audit_log")
            .select("id")
            .eq("action", "Autopilot: Manual Business OS run")
            .filter("details->>run_key", "eq", runKey)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (existingRun.data?.id) {
            const snapshot = await buildAutopilotSnapshot(auth.adminClient as never, auth.userId);
            return NextResponse.json({
                generated_at: new Date().toISOString(),
                skipped: true,
                reason: "already_ran_for_run_key",
                run_key: runKey,
                snapshot,
            }, { status: 200 });
        }

        const [autopilot, brief] = await Promise.all([
            runBusinessDailyAutopilot(auth.adminClient as never, {
                trigger: "manual",
                runKey,
                idempotencyKey: runKey,
                enforceIdempotency: false,
            }),
            generateDailyOpsBrief(auth.adminClient as never, auth.userId),
        ]);

        await logPlatformAction(
            auth.userId,
            "Autopilot: Manual Business OS run",
            "automation",
            buildAutopilotAuditDetails(autopilot, brief, "manual"),
            getClientIpFromRequest(request),
        );

        const snapshot = await buildAutopilotSnapshot(auth.adminClient as never, auth.userId);
        const slack = resolveSlackWebhookConfig();
        const slackPosted = await sendOpsAlert([
            "Manual Business OS run completed",
            `Triggered by: ${auth.userId}`,
            snapshot.founder_digest.slack_text,
        ].join("\n\n"));
        return NextResponse.json({
            generated_at: new Date().toISOString(),
            run_key: runKey,
            result: autopilot,
            brief,
            snapshot,
            slack: {
                configured: slack.configured,
                source: slack.source,
                posted: slackPosted,
            },
        }, { status: 201 });
    } catch (error) {
        logError("[superadmin/autopilot/run POST]", error);
        return apiError("Failed to run Autopilot", 500);
    }
}
