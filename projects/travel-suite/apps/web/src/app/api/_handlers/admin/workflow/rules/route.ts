import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";

const WORKFLOW_RULES_READ_RATE_LIMIT_MAX = 120;
const WORKFLOW_RULES_READ_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const WORKFLOW_RULES_WRITE_RATE_LIMIT_MAX = 60;
const WORKFLOW_RULES_WRITE_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

const lifecycleStages = [
    "lead",
    "prospect",
    "proposal",
    "payment_pending",
    "payment_confirmed",
    "active",
    "review",
    "past",
] as const;

function attachRateLimitHeaders(
    response: NextResponse,
    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
): NextResponse {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
    response.headers.set("retry-after", String(retryAfterSeconds));
    response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
    response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
    response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
    return response;
}

function resolveScopedOrgForRead(
    admin: Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>,
    req: NextRequest
): { organizationId: string } | { error: NextResponse } {
    const { searchParams } = new URL(req.url);
    const requestedOrganizationId = sanitizeText(searchParams.get("organization_id"), { maxLength: 80 });

    if (admin.isSuperAdmin) {
        if (!requestedOrganizationId) {
            return {
                error: NextResponse.json(
                    { error: "organization_id query param is required for super admin" },
                    { status: 400 }
                ),
            };
        }
        return { organizationId: requestedOrganizationId };
    }

    if (!admin.organizationId) {
        return { error: NextResponse.json({ error: "Admin organization not configured" }, { status: 400 }) };
    }
    if (requestedOrganizationId && requestedOrganizationId !== admin.organizationId) {
        return { error: NextResponse.json({ error: "Cannot access another organization scope" }, { status: 403 }) };
    }

    return { organizationId: admin.organizationId };
}

function resolveScopedOrgForWrite(
    admin: Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>,
    requestedOrganizationId: string | null
): { organizationId: string } | { error: NextResponse } {
    if (admin.isSuperAdmin) {
        if (!requestedOrganizationId) {
            return {
                error: NextResponse.json(
                    { error: "organization_id is required for super admin updates" },
                    { status: 400 }
                ),
            };
        }
        return { organizationId: requestedOrganizationId };
    }

    if (!admin.organizationId) {
        return { error: NextResponse.json({ error: "Admin organization not configured" }, { status: 400 }) };
    }
    if (requestedOrganizationId && requestedOrganizationId !== admin.organizationId) {
        return { error: NextResponse.json({ error: "Cannot update another organization scope" }, { status: 403 }) };
    }

    return { organizationId: admin.organizationId };
}

export async function GET(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

        const scopedOrg = resolveScopedOrgForRead(admin, req);
        if ("error" in scopedOrg) {
            return scopedOrg.error;
        }

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: WORKFLOW_RULES_READ_RATE_LIMIT_MAX,
            windowMs: WORKFLOW_RULES_READ_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:workflow:rules:read",
        });
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: "Too many workflow rule requests. Please retry later." },
                { status: 429 }
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const { data, error } = await admin.adminClient
            .from("workflow_notification_rules")
            .select("lifecycle_stage,notify_client")
            .eq("organization_id", scopedOrg.organizationId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const dbMap = new Map((data || []).map((row) => [row.lifecycle_stage, row.notify_client]));
        const rules = lifecycleStages.map((stage) => ({
            lifecycle_stage: stage,
            notify_client: dbMap.has(stage) ? Boolean(dbMap.get(stage)) : true,
        }));

        return NextResponse.json({ rules });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: WORKFLOW_RULES_WRITE_RATE_LIMIT_MAX,
            windowMs: WORKFLOW_RULES_WRITE_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:workflow:rules:write",
        });
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: "Too many workflow rule update requests. Please retry later." },
                { status: 429 }
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const body = await req.json();
        const lifecycleStage = String(body.lifecycle_stage || "").trim();
        const notifyClient = Boolean(body.notify_client);
        const requestedOrganizationId = sanitizeText((body as { organization_id?: unknown }).organization_id, {
            maxLength: 80,
        });
        const scopedOrg = resolveScopedOrgForWrite(admin, requestedOrganizationId);
        if ("error" in scopedOrg) {
            return scopedOrg.error;
        }

        if (!lifecycleStages.includes(lifecycleStage as (typeof lifecycleStages)[number])) {
            return NextResponse.json({ error: "Invalid lifecycle_stage" }, { status: 400 });
        }

        const { error } = await admin.adminClient
            .from("workflow_notification_rules")
            .upsert(
                {
                    organization_id: scopedOrg.organizationId,
                    lifecycle_stage: lifecycleStage,
                    notify_client: notifyClient,
                    updated_by: admin.userId,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "organization_id,lifecycle_stage" }
            );

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ ok: true, lifecycle_stage: lifecycleStage, notify_client: notifyClient });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
