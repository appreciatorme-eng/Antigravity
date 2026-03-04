import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import { getRequestContext, getRequestId, logError, logEvent } from "@/lib/observability/logger";
import { jsonWithRequestId as withRequestId } from "@/lib/api/response";

const WORKFLOW_EVENTS_RATE_LIMIT_MAX = 120;
const WORKFLOW_EVENTS_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
    const startedAt = Date.now();
    const requestId = getRequestId(req);
    const requestContext = getRequestContext(req, requestId);

    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return withRequestId({ error: "Unauthorized" }, requestId, { status: admin.response.status || 401 });
        }

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: WORKFLOW_EVENTS_RATE_LIMIT_MAX,
            windowMs: WORKFLOW_EVENTS_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:workflow:events",
        });
        if (!rateLimit.success) {
            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
            const response = withRequestId(
                { error: "Too many workflow event requests. Please retry later." },
                requestId,
                { status: 429 }
            );
            response.headers.set("retry-after", String(retryAfterSeconds));
            response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
            response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
            response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
            return response;
        }

        const { searchParams } = new URL(req.url);
        const requestedOrganizationId = (searchParams.get("organization_id") || "").trim();
        const scopedOrganizationId = admin.isSuperAdmin ? requestedOrganizationId : admin.organizationId;
        if (!scopedOrganizationId) {
            return withRequestId(
                { error: admin.isSuperAdmin ? "organization_id query param is required for super admin" : "Admin organization not configured" },
                requestId,
                { status: 400 }
            );
        }
        if (!admin.isSuperAdmin && requestedOrganizationId && requestedOrganizationId !== admin.organizationId) {
            return withRequestId({ error: "Cannot access another organization scope" }, requestId, { status: 403 });
        }

        const limitRaw = Number(searchParams.get("limit") || 30);
        const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 30;

        const { data, error } = await admin.adminClient
            .from("workflow_stage_events")
            .select("id,profile_id,from_stage,to_stage,changed_by,created_at,organization_id")
            .eq("organization_id", scopedOrganizationId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            logError("Workflow events query failed", error, requestContext);
            return withRequestId({ error: error.message }, requestId, { status: 500 });
        }

        const rows = data || [];
        const profileIds = Array.from(
            new Set(
                rows
                    .flatMap((row) => [row.profile_id, row.changed_by])
                    .filter((profileId): profileId is string => typeof profileId === "string" && profileId.length > 0)
            )
        );

        let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
        if (profileIds.length > 0) {
            const { data: profiles } = await admin.adminClient
                .from("profiles")
                .select("id,full_name,email")
                .in("id", profileIds);
            profileMap = new Map(
                (profiles || []).map((profile) => [profile.id, { full_name: profile.full_name, email: profile.email }])
            );
        }

        const events = rows.map((row) => ({
            id: row.id,
            profile_id: row.profile_id,
            from_stage: row.from_stage,
            to_stage: row.to_stage,
            created_at: row.created_at,
            profile: row.profile_id ? profileMap.get(row.profile_id) || null : null,
            changed_by_profile: row.changed_by ? profileMap.get(row.changed_by) || null : null,
        }));

        const durationMs = Date.now() - startedAt;
        logEvent("info", "Workflow events fetched", {
            ...requestContext,
            rows: events.length,
            durationMs,
        });
        void captureOperationalMetric("api.admin.workflow.events", {
            request_id: requestId,
            rows: events.length,
            duration_ms: durationMs,
        });

        return withRequestId({ events }, requestId);
    } catch (error) {
        Sentry.captureException(error);
        logError("Workflow events crashed", error, requestContext);
        return withRequestId(
            { error: error instanceof Error ? error.message : "Unknown error" },
            requestId,
            { status: 500 }
        );
    }
}
