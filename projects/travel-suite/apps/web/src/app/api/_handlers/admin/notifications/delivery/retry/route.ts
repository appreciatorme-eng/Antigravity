import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";

const DELIVERY_RETRY_RATE_LIMIT_MAX = 40;
const DELIVERY_RETRY_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

async function resolveQueueOrg(
    adminClient: Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>["adminClient"],
    queueId: string
): Promise<string | null> {
    const { data: queueRow } = await adminClient
        .from("notification_queue")
        .select("trip_id,user_id")
        .eq("id", queueId)
        .maybeSingle();

    if (!queueRow) return null;

    if (queueRow.trip_id) {
        const { data: trip } = await adminClient
            .from("trips")
            .select("organization_id")
            .eq("id", queueRow.trip_id)
            .maybeSingle();
        if (trip?.organization_id) return trip.organization_id;
    }

    if (queueRow.user_id) {
        const { data: profile } = await adminClient
            .from("profiles")
            .select("organization_id")
            .eq("id", queueRow.user_id)
            .maybeSingle();
        if (profile?.organization_id) return profile.organization_id;
    }

    return null;
}

export async function POST(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

        if (!admin.isSuperAdmin && !admin.organizationId) {
            return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
        }

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: DELIVERY_RETRY_RATE_LIMIT_MAX,
            windowMs: DELIVERY_RETRY_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:notifications:delivery:retry",
        });
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: "Too many retry requests. Please retry later." },
                { status: 429 }
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const body = await req.json();
        const queueId = sanitizeText((body as { queue_id?: unknown }).queue_id, { maxLength: 64 });
        if (!queueId) {
            return NextResponse.json({ error: "queue_id is required" }, { status: 400 });
        }
        if (!UUID_PATTERN.test(queueId)) {
            return NextResponse.json({ error: "queue_id must be a UUID" }, { status: 400 });
        }

        const queueOrg = await resolveQueueOrg(admin.adminClient, queueId);
        if (!queueOrg) {
            return NextResponse.json({ error: "Queue item not found in your organization" }, { status: 404 });
        }
        if (!admin.isSuperAdmin && queueOrg !== admin.organizationId) {
            return NextResponse.json({ error: "Queue item not found in your organization" }, { status: 404 });
        }

        const { data: updatedRows, error } = await admin.adminClient
            .from("notification_queue")
            .update({
                status: "pending",
                scheduled_for: new Date().toISOString(),
                error_message: null,
                last_attempt_at: null,
                processed_at: null,
            })
            .eq("id", queueId)
            .in("status", ["failed", "retrying"])
            .select("id");

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!updatedRows || updatedRows.length === 0) {
            return NextResponse.json({ error: "Queue item is not retryable" }, { status: 400 });
        }

        return NextResponse.json({ ok: true, queue_id: queueId });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
