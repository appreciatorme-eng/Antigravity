// GET /api/superadmin/cost/aggregate — cross-org API cost summary with per-org breakdown.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getRedisClient } from "@/lib/cost/spend-guardrails";

const CATEGORIES = ["amadeus", "image_search", "ai_image", "ai_poster", "ai_text"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_CAPS_USD: Record<Category, number> = {
    amadeus: 75,
    image_search: 35,
    ai_image: 55,
    ai_poster: 40,
    ai_text: 20,
};

function monthStartISO(): string {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

async function readRedisSpendToday(): Promise<{ byCategory: Record<Category, number>; total: number }> {
    const redis = getRedisClient();
    const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
    if (!redis) return { byCategory, total: 0 };

    const today = todayISO();
    try {
        const keys = CATEGORIES.map((c) => `cost:daily:${c}:${today}`);
        const vals = await redis.mget<string[]>(...keys);
        let total = 0;
        for (let i = 0; i < CATEGORIES.length; i++) {
            const v = Number(vals[i] ?? 0);
            byCategory[CATEGORIES[i]] = Number.isFinite(v) ? v : 0;
            total += byCategory[CATEGORIES[i]];
        }
        return { byCategory, total };
    } catch {
        return { byCategory, total: 0 };
    }
}

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;

    try {
        const [aiUsageResult, orgsResult, todaySpend] = await Promise.all([
            adminClient
                .from("organization_ai_usage")
                .select("organization_id, ai_requests, estimated_cost_usd, month_start")
                .eq("month_start", monthStartISO()),
            adminClient
                .from("organizations")
                .select("id, name, subscription_tier"),
            readRedisSpendToday(),
        ]);

        const orgMap = new Map(
            (orgsResult.data ?? []).map((o) => [o.id, { name: o.name, tier: o.subscription_tier ?? "free" }])
        );

        // Per-org MTD aggregation
        const orgMtd: Record<string, { name: string; tier: string; mtd_usd: number; requests: number }> = {};
        let totalMtdUsd = 0;

        for (const row of (aiUsageResult.data ?? [])) {
            const orgId = row.organization_id;
            const cost = Number(row.estimated_cost_usd ?? 0);
            const reqs = Number(row.ai_requests ?? 0);
            const orgInfo = orgMap.get(orgId);

            if (!orgMtd[orgId]) {
                orgMtd[orgId] = {
                    name: orgInfo?.name ?? orgId,
                    tier: orgInfo?.tier ?? "free",
                    mtd_usd: 0,
                    requests: 0,
                };
            }
            orgMtd[orgId].mtd_usd += cost;
            orgMtd[orgId].requests += reqs;
            totalMtdUsd += cost;
        }

        const byOrg = Object.entries(orgMtd)
            .map(([org_id, v]) => ({ org_id, ...v }))
            .sort((a, b) => b.mtd_usd - a.mtd_usd)
            .slice(0, 50);

        // Category breakdown from Redis (today) — MTD category split from ai_usage (approximate, total only)
        const byCategory = CATEGORIES.map((cat) => {
            const todayUsd = todaySpend.byCategory[cat];
            const cap = CATEGORY_CAPS_USD[cat];
            return {
                category: cat,
                today_usd: Number(todayUsd.toFixed(4)),
                mtd_usd: 0,
                cap_usd: cap,
                utilization_pct: cap > 0 ? Number(((todayUsd / cap) * 100).toFixed(1)) : 0,
            };
        });

        return NextResponse.json({
            today: {
                ...todaySpend.byCategory,
                total_usd: Number(todaySpend.total.toFixed(4)),
            },
            month_to_date: {
                total_usd: Number(totalMtdUsd.toFixed(4)),
            },
            by_category: byCategory,
            by_org: byOrg,
        });
    } catch (err) {
        console.error("[superadmin/cost/aggregate]", err);
        return NextResponse.json({ error: "Failed to load cost aggregate" }, { status: 500 });
    }
}
