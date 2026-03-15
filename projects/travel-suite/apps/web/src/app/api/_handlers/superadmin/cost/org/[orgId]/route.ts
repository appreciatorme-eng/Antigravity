// GET /api/superadmin/cost/org/:orgId — detailed cost breakdown for a single organization.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

function monthStartISO(): string {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString();
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { orgId } = await params;
    const { adminClient } = auth;
    const range = request.nextUrl.searchParams.get("range") || "30d";
    const days = range === "30d" ? 30 : range === "60d" ? 60 : 90;
    const since = daysAgo(days);

    try {
        const [orgResult, aiUsageResult, logsResult] = await Promise.all([
            adminClient
                .from("organizations")
                .select("id, name, subscription_tier, created_at")
                .eq("id", orgId)
                .single(),
            adminClient
                .from("organization_ai_usage")
                .select("ai_requests, estimated_cost_usd, month_start")
                .eq("organization_id", orgId)
                .order("month_start", { ascending: false })
                .limit(6),
            adminClient
                .from("notification_logs")
                .select("created_at, body, status")
                .eq("notification_type", "cost_metering")
                .gte("created_at", since)
                .limit(5000),
        ]);

        if (!orgResult.data) {
            return apiError("Organization not found", 404);
        }

        const org = orgResult.data;

        // Filter logs to this org's users
        const profilesResult = await adminClient
            .from("profiles")
            .select("id")
            .eq("organization_id", orgId)
            .limit(1000);

        const orgUserIds = new Set((profilesResult.data ?? []).map((p) => p.id));

        const byCategoryToday: Record<string, number> = {};
        const byCategoryRange: Record<string, number> = {};
        const byDay: Record<string, number> = {};

        for (const log of (logsResult.data ?? [])) {
            if (!log.created_at) continue;
            // Filter by org users via body org_id field
            const bodyOrgMatch = (log.body as string | null)?.match(/organization_id=([a-f0-9-]+)/);
            const bodyUserId = (log.body as string | null)?.match(/user_id=([a-f0-9-]+)/)?.[1];
            const bodyOrgId = bodyOrgMatch?.[1];

            const belongsToOrg =
                bodyOrgId === orgId ||
                (bodyUserId && orgUserIds.has(bodyUserId));
            if (!belongsToOrg) continue;

            const day = (log.created_at as string).slice(0, 10);
            const catMatch = (log.body as string | null)?.match(/^([a-z_]+)\|/);
            const category = catMatch?.[1] ?? "unknown";
            const costMatch = (log.body as string | null)?.match(/estimated_cost_usd=([0-9.]+)/);
            const cost = costMatch ? Number(costMatch[1]) : 0;

            if (log.status === "sent") {
                byCategoryRange[category] = (byCategoryRange[category] ?? 0) + cost;
                byDay[day] = (byDay[day] ?? 0) + cost;

                const todayStr = new Date().toISOString().slice(0, 10);
                if (day === todayStr) {
                    byCategoryToday[category] = (byCategoryToday[category] ?? 0) + cost;
                }
            }
        }

        const mtdEntry = (aiUsageResult.data ?? []).find((r) => r.month_start === monthStartISO());
        const mtd = {
            ai_requests: Number(mtdEntry?.ai_requests ?? 0),
            estimated_cost_usd: Number(mtdEntry?.estimated_cost_usd ?? 0),
        };

        const trend = Array.from({ length: days }, (_, i) => {
            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
            const key = d.toISOString().slice(0, 10);
            return { date: key, estimated_usd: Number((byDay[key] ?? 0).toFixed(4)) };
        });

        return NextResponse.json({
            org: {
                id: org.id,
                name: org.name,
                tier: org.subscription_tier ?? "free",
                created_at: org.created_at,
            },
            range,
            today: byCategoryToday,
            range_total: Object.values(byCategoryRange).reduce((s, v) => s + v, 0),
            by_category: byCategoryRange,
            mtd,
            trend,
        });
    } catch (err) {
        console.error(`[superadmin/cost/org/${orgId}]`, err);
        return apiError("Failed to load org cost detail", 500);
    }
}
