// GET /api/superadmin/analytics/feature-usage/:feature — per-org drill-down for a feature.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages";
import { buildGodDataQuality } from "@/lib/platform/god-kpi";

type FeatureTableName =
    | "trips"
    | "proposals"
    | "assistant_sessions"
    | "social_posts";

type FeatureTable = {
    table: FeatureTableName;
    orgCol: "organization_id";
};

type FeatureUsageRow = {
    organization_id: string;
    created_at: string;
    organizations?: { name?: string | null; subscription_tier?: string | null } | null;
};

type UntypedBuilder = {
    select: (columns: string) => UntypedBuilder;
    gte: (column: string, value: string) => UntypedBuilder;
    order: (column: string, options?: { ascending?: boolean }) => UntypedBuilder;
    range: (from: number, to: number) => Promise<{ data: FeatureUsageRow[] | null; error?: unknown }>;
};

type UntypedAdminClient = {
    from: (relation: string) => UntypedBuilder;
};

const FEATURE_MAP: Record<string, FeatureTable> = {
    trips: { table: "trips", orgCol: "organization_id" },
    proposals: { table: "proposals", orgCol: "organization_id" },
    ai_sessions: { table: "assistant_sessions", orgCol: "organization_id" },
    social_posts: { table: "social_posts", orgCol: "organization_id" },
};

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString();
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ feature: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { feature } = await params;
    const featureCfg = FEATURE_MAP[feature];
    if (!featureCfg) {
        return apiError(`Unknown feature: ${feature}`, 400);
    }

    const { adminClient } = auth;
    const range = request.nextUrl.searchParams.get("range") || "30d";
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const since = daysAgo(days);

    try {
        const rawAdminClient = adminClient as unknown as UntypedAdminClient;
        const fetchedRows = await fetchAllPages<FeatureUsageRow>((from, to) => (
            rawAdminClient
                .from(featureCfg.table)
                .select(`${featureCfg.orgCol}, organizations(name, subscription_tier), created_at`)
                .gte("created_at", since)
                .order("created_at", { ascending: false })
                .range(from, to)
        ));

        const orgCounts: Record<string, { name: string; tier: string; count: number; last_used: string }> = {};
        let total = 0;

        for (const row of fetchedRows) {
            const orgId = row[featureCfg.orgCol] as string;
            if (!orgId) continue;
            const org = row.organizations ?? null;
            const created = row.created_at ?? "";
            if (!orgCounts[orgId]) {
                orgCounts[orgId] = { name: org?.name ?? orgId, tier: org?.subscription_tier ?? "free", count: 0, last_used: created };
            }
            orgCounts[orgId].count++;
            if (created > orgCounts[orgId].last_used) orgCounts[orgId].last_used = created;
            total++;
        }

        const rows = Object.entries(orgCounts)
            .sort(([, a], [, b]) => b.count - a.count)
            .map(([org_id, v]) => ({
                org_id,
                org_name: v.name,
                tier: v.tier,
                count: v.count,
                pct_of_total: total > 0 ? Number(((v.count / total) * 100).toFixed(1)) : 0,
                last_used: v.last_used,
            }));

        return NextResponse.json({
            feature,
            range,
            total,
            rows,
            meta: {
                data_quality: buildGodDataQuality([featureCfg.table]),
            },
        });
    } catch (err) {
        logError(`[superadmin/analytics/feature-usage/${feature}]`, err);
        return apiError("Failed to load feature drill-down", 500);
    }
}
