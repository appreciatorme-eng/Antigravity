import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit, type RateLimitResult } from "@/lib/security/rate-limit";
import { resolveOrganizationPlan, type SubscriptionTier } from "@/lib/subscriptions/limits";
import { createClient } from "@/lib/supabase/server";

export type CostEndpointCategory = "amadeus" | "image_search" | "ai_image";

type TierRateLimits = {
    burstPerMinute: number;
    daily: number;
};

type CategoryRateLimits = Record<SubscriptionTier, TierRateLimits>;

const RATE_LIMITS: Record<CostEndpointCategory, CategoryRateLimits> = {
    amadeus: {
        free: { burstPerMinute: 6, daily: 120 },
        pro: { burstPerMinute: 18, daily: 1200 },
        enterprise: { burstPerMinute: 45, daily: 8000 },
    },
    image_search: {
        free: { burstPerMinute: 12, daily: 300 },
        pro: { burstPerMinute: 30, daily: 2400 },
        enterprise: { burstPerMinute: 80, daily: 12000 },
    },
    ai_image: {
        free: { burstPerMinute: 2, daily: 20 },
        pro: { burstPerMinute: 8, daily: 200 },
        enterprise: { burstPerMinute: 20, daily: 1200 },
    },
};

export interface CostEndpointGuardContext {
    userId: string;
    organizationId: string;
    tier: SubscriptionTier;
    category: CostEndpointCategory;
    burstLimit: RateLimitResult;
    dailyLimit: RateLimitResult;
}

type CostEndpointGuardSuccess = {
    ok: true;
    context: CostEndpointGuardContext;
};

type CostEndpointGuardFailure = {
    ok: false;
    response: NextResponse;
};

export type CostEndpointGuardResult = CostEndpointGuardSuccess | CostEndpointGuardFailure;

function withRateLimitHeaders(
    response: NextResponse,
    limits: { burst: RateLimitResult; daily: RateLimitResult }
): NextResponse {
    response.headers.set("x-ratelimit-limit", String(limits.daily.limit));
    response.headers.set("x-ratelimit-remaining", String(limits.daily.remaining));
    response.headers.set("x-ratelimit-reset", String(limits.daily.reset));

    response.headers.set("x-ratelimit-burst-limit", String(limits.burst.limit));
    response.headers.set("x-ratelimit-burst-remaining", String(limits.burst.remaining));
    response.headers.set("x-ratelimit-burst-reset", String(limits.burst.reset));

    return response;
}

async function persistMeteringEvent(params: {
    userId: string;
    category: CostEndpointCategory;
    tier: SubscriptionTier;
    status: "allowed" | "denied";
    reason: string;
    remainingDaily: number;
}) {
    try {
        const adminClient = createAdminClient();
        const nowIso = new Date().toISOString();
        await adminClient.from("notification_logs").insert({
            recipient_id: params.userId,
            recipient_type: "admin",
            notification_type: "cost_metering",
            title: `Cost guardrail ${params.status}`,
            body: `${params.category} | tier=${params.tier} | reason=${params.reason} | remaining_daily=${params.remainingDaily}`,
            status: params.status === "allowed" ? "sent" : "failed",
            sent_at: nowIso,
            updated_at: nowIso,
            error_message: params.status === "denied" ? params.reason : null,
        });
    } catch {
        // Metering/audit telemetry should not break request flow.
    }
}

function unauthorizedResponse(message: string, status = 401): NextResponse {
    return NextResponse.json({ error: message }, { status });
}

export async function guardCostEndpoint(
    request: NextRequest,
    category: CostEndpointCategory
): Promise<CostEndpointGuardResult> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { ok: false, response: unauthorizedResponse("Unauthorized", 401) };
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

    const organizationId = profile?.organization_id || null;
    if (profileError || !organizationId) {
        return {
            ok: false,
            response: unauthorizedResponse("Organization not found for authenticated user", 403),
        };
    }

    const { tier } = await resolveOrganizationPlan(supabase, organizationId);
    const configured = RATE_LIMITS[category][tier];

    const burstLimit = await enforceRateLimit({
        identifier: `${organizationId}:${user.id}`,
        limit: configured.burstPerMinute,
        windowMs: 60_000,
        prefix: `cost:${category}:burst`,
    });

    const dailyLimit = await enforceRateLimit({
        identifier: organizationId,
        limit: configured.daily,
        windowMs: 24 * 60 * 60_000,
        prefix: `cost:${category}:daily`,
    });

    if (!burstLimit.success || !dailyLimit.success) {
        const retryAfterSeconds = Math.max(
            1,
            Math.ceil((Math.min(burstLimit.reset, dailyLimit.reset) - Date.now()) / 1000)
        );
        const reason = !dailyLimit.success ? "daily quota exceeded" : "burst rate limit exceeded";

        await persistMeteringEvent({
            userId: user.id,
            category,
            tier,
            status: "denied",
            reason,
            remainingDaily: dailyLimit.remaining,
        });

        const response = NextResponse.json(
            {
                error: "Request limit exceeded for this plan",
                reason,
                tier,
                category,
                upgrade_plan: tier === "free" ? "pro_monthly" : tier === "pro" ? "enterprise" : null,
            },
            { status: 429 }
        );
        response.headers.set("retry-after", String(retryAfterSeconds));
        return {
            ok: false,
            response: withRateLimitHeaders(response, { burst: burstLimit, daily: dailyLimit }),
        };
    }

    await persistMeteringEvent({
        userId: user.id,
        category,
        tier,
        status: "allowed",
        reason: "within limits",
        remainingDaily: dailyLimit.remaining,
    });

    return {
        ok: true,
        context: {
            userId: user.id,
            organizationId,
            tier,
            category,
            burstLimit,
            dailyLimit,
        },
    };
}

export function withCostGuardHeaders(
    response: NextResponse,
    context: CostEndpointGuardContext
): NextResponse {
    return withRateLimitHeaders(response, {
        burst: context.burstLimit,
        daily: context.dailyLimit,
    });
}
