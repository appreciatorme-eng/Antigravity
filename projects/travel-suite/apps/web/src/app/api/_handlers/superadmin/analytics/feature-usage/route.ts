// GET /api/superadmin/analytics/feature-usage -- cross-org feature usage aggregate.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages";
import { buildGodDataQuality } from "@/lib/platform/god-kpi";

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString();
}

function rangeToMs(range: string): number {
    return range === "7d" ? 7 : range === "30d" ? 30 : 90;
}

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;
    const db = adminClient;
    const range = request.nextUrl.searchParams.get("range") || "30d";
    const days = rangeToMs(range);
    const since = daysAgo(days);
    const prevSince = daysAgo(days * 2);

    try {
        const [
            trips, tripsPrev,
            proposals, proposalsPrev,
            aiSessions, aiPrev,
            socialPosts, socialPrev,
            newOrgs, newOrgsPrev,
            payments, paymentsPrev,
            openErrors, autofixedErrors,
        ] = await Promise.all([
            db.from("trips").select("id", { count: "exact", head: true }).gte("created_at", since),
            db.from("trips").select("id", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
            db.from("proposals").select("id", { count: "exact", head: true }).gte("created_at", since),
            db.from("proposals").select("id", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
            db.from("assistant_sessions").select("id", { count: "exact", head: true }).gte("created_at", since),
            db.from("assistant_sessions").select("id", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
            db.from("social_posts").select("id", { count: "exact", head: true }).gte("created_at", since),
            db.from("social_posts").select("id", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
            // New orgs signed up
            db.from("organizations").select("id", { count: "exact", head: true }).gte("created_at", since),
            db.from("organizations").select("id", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
            // Revenue (captured payments in period)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- payments not in generated types
            (db as any).from("payments").select("amount").eq("status", "captured").gte("created_at", since),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- payments not in generated types
            (db as any).from("payments").select("amount").eq("status", "captured").gte("created_at", prevSince).lt("created_at", since),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events not in generated types
            (db as any).from("error_events").select("id", { count: "exact", head: true }).eq("status", "open"),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events not in generated types
            (db as any).from("error_events").select("id", { count: "exact", head: true }).in("autofix_status", ["issue_created", "pr_opened"]),
        ]);

        function pct(cur: number, prev: number): number {
            if (prev === 0) return cur > 0 ? 100 : 0;
            return Number((((cur - prev) / prev) * 100).toFixed(1));
        }

        const [tripsCount, tripsCountPrev] = [trips.count ?? 0, tripsPrev.count ?? 0];
        const [proposalsCount, proposalsCountPrev] = [proposals.count ?? 0, proposalsPrev.count ?? 0];
        const [aiCount, aiCountPrev] = [aiSessions.count ?? 0, aiPrev.count ?? 0];
        const [socialCount, socialCountPrev] = [socialPosts.count ?? 0, socialPrev.count ?? 0];
        const [newOrgsCount, newOrgsPrevCount] = [newOrgs.count ?? 0, newOrgsPrev.count ?? 0];

        // Revenue: sum payment amounts (stored in smallest currency unit — paise)
        const sumPaise = (rows: { amount: number }[] | null) =>
            (rows ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0);
        const revenuePaise = sumPaise(payments.data as { amount: number }[] | null);
        const revenuePrevPaise = sumPaise(paymentsPrev.data as { amount: number }[] | null);

        const openErrorCount = openErrors.count ?? 0;
        const autofixedCount = autofixedErrors.count ?? 0;
        const autofixPct = openErrorCount > 0 ? Math.round((autofixedCount / (openErrorCount + autofixedCount)) * 100) : 0;

        type OrgJoinRow = { organization_id: string | null; organizations: { name?: string; subscription_tier?: string | null } | null };
        const topOrgRows = await fetchAllPages<OrgJoinRow>(async (from, to) => {
            const result = await adminClient
                .from("trips")
                .select("organization_id, organizations(name, subscription_tier)")
                .gte("created_at", since)
                .order("created_at", { ascending: false })
                .range(from, to);
            return {
                data: (result.data ?? []) as OrgJoinRow[],
                error: result.error,
            };
        });

        const orgCounts: Record<string, { name: string; tier: string; trips: number }> = {};
        for (const row of topOrgRows) {
            const orgId = row.organization_id as string;
            if (!orgId) continue;
            const org = row.organizations;
            if (!orgCounts[orgId]) {
                orgCounts[orgId] = { name: org?.name ?? orgId, tier: org?.subscription_tier ?? "free", trips: 0 };
            }
            orgCounts[orgId].trips++;
        }

        const topOrgs = Object.entries(orgCounts)
            .sort(([, a], [, b]) => b.trips - a.trips)
            .slice(0, 10)
            .map(([org_id, v]) => ({ org_id, ...v }));

        return NextResponse.json({
            range,
            features: {
                trips: { total: tripsCount, change_pct: pct(tripsCount, tripsCountPrev) },
                proposals: { total: proposalsCount, change_pct: pct(proposalsCount, proposalsCountPrev) },
                ai_sessions: { total: aiCount, change_pct: pct(aiCount, aiCountPrev) },
                social_posts: { total: socialCount, change_pct: pct(socialCount, socialCountPrev) },
            },
            metrics: {
                new_orgs: { total: newOrgsCount, change_pct: pct(newOrgsCount, newOrgsPrevCount) },
                revenue: { total_paise: revenuePaise, change_pct: pct(revenuePaise, revenuePrevPaise) },
                open_errors: { count: openErrorCount, autofix_pct: autofixPct },
            },
            top_orgs: topOrgs,
            meta: {
                data_quality: buildGodDataQuality(["trips", "proposals", "assistant_sessions", "social_posts"]),
            },
        });
    } catch (err) {
        logError("[superadmin/analytics/feature-usage]", err);
        return apiError("Failed to load feature usage", 500);
    }
}
