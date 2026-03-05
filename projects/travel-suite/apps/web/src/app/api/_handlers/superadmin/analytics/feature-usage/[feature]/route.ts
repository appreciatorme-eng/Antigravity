// GET /api/superadmin/analytics/feature-usage/:feature — per-org drill-down for a feature.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

type FeatureTable = { table: string; orgCol: string };
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
        return NextResponse.json({ error: `Unknown feature: ${feature}` }, { status: 400 });
    }

    const { adminClient } = auth;
    const range = request.nextUrl.searchParams.get("range") || "30d";
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const since = daysAgo(days);

    try {
        const result = await adminClient
            .from(featureCfg.table)
            .select(`${featureCfg.orgCol}, organizations(name, subscription_tier)`)
            .gte("created_at", since)
            .limit(5000);

        const orgCounts: Record<string, { name: string; tier: string; count: number; last_used: string }> = {};
        let total = 0;

        for (const row of (result.data ?? [])) {
            const orgId = (row as Record<string, unknown>)[featureCfg.orgCol] as string;
            const org = (row as Record<string, unknown>).organizations as { name?: string; subscription_tier?: string } | null;
            const created = ((row as Record<string, unknown>).created_at as string) ?? "";
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

        return NextResponse.json({ feature, range, total, rows });
    } catch (err) {
        console.error(`[superadmin/analytics/feature-usage/${feature}]`, err);
        return NextResponse.json({ error: "Failed to load feature drill-down" }, { status: 500 });
    }
}
