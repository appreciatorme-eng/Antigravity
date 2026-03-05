/* eslint-disable @typescript-eslint/no-explicit-any */
// GET /api/superadmin/referrals/detail/:type — paginated referral events by type (b2b|client).

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { type } = await params;
    if (type !== "b2b" && type !== "client") {
        return NextResponse.json({ error: "type must be 'b2b' or 'client'" }, { status: 400 });
    }

    const { adminClient } = auth;
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(0, Number(searchParams.get("page") || 0));
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || 50)));

    try {
        if (type === "b2b") {
            const result = await (adminClient as any)
                .from("referrals")
                .select(
                    "id, status, created_at, referrer_org_id, referred_org_id, " +
                    "referrer:organizations!referrals_referrer_org_id_fkey(name, subscription_tier), " +
                    "referred:organizations!referrals_referred_org_id_fkey(name, subscription_tier)",
                    { count: "exact" }
                )
                .order("created_at", { ascending: false })
                .range(page * limit, (page + 1) * limit - 1);

            const rows = (result.data ?? []).map((r: any) => ({
                id: r.id,
                status: r.status,
                created_at: r.created_at,
                referrer_org_id: r.referrer_org_id,
                referrer_name: (r.referrer as { name?: string } | null)?.name ?? null,
                referred_org_id: r.referred_org_id,
                referred_name: (r.referred as { name?: string } | null)?.name ?? null,
            }));

            return NextResponse.json({
                type,
                rows,
                total: result.count ?? 0,
                page,
                pages: Math.ceil((result.count ?? 0) / limit),
            });
        }

        // Client flywheel
        const result = await (adminClient as any)
            .from("client_referral_events")
            .select(
                "id, status, created_at, referrer_id, referred_email, " +
                "profiles!client_referral_events_referrer_id_fkey(full_name, email)",
                { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        const incentivesResult = await (adminClient as any)
            .from("client_referral_incentives")
            .select("event_id, amount, currency, tds_applicable")
            .limit(2000);

        const incentiveMap = new Map<string, { amount: number; tds: boolean }>();
        for (const i of (incentivesResult.data ?? [])) {
            if (i.event_id) {
                incentiveMap.set(i.event_id as string, {
                    amount: Number(i.amount ?? 0),
                    tds: Boolean(i.tds_applicable),
                });
            }
        }

        const rows = (result.data ?? []).map((e: any) => {
            const profile = e.profiles as { full_name?: string; email?: string } | null;
            const incentive = incentiveMap.get(e.id);
            return {
                id: e.id,
                status: e.status,
                created_at: e.created_at,
                referrer_name: profile?.full_name ?? null,
                referrer_email: profile?.email ?? null,
                referred_email: e.referred_email,
                reward_inr: incentive?.amount ?? 0,
                tds_applicable: incentive?.tds ?? false,
            };
        });

        return NextResponse.json({
            type,
            rows,
            total: result.count ?? 0,
            page,
            pages: Math.ceil((result.count ?? 0) / limit),
        });
    } catch (err) {
        console.error(`[superadmin/referrals/detail/${type}]`, err);
        return NextResponse.json({ error: "Failed to load referral details" }, { status: 500 });
    }
}
