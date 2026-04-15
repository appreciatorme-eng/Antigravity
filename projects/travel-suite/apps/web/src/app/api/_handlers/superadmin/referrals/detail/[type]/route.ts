// GET /api/superadmin/referrals/detail/:type -- paginated referral events by type (b2b|client).

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/observability/logger";
import { buildGodDataQuality } from "@/lib/platform/god-kpi";

/**
 * The live DB schema for referrals, client_referral_events, and client_referral_incentives
 * has columns and FK hints that differ from the generated Database types (e.g. referrer_org_id
 * vs referrer_profile_id, event_id vs referral_code). We use an untyped SupabaseClient to
 * allow querying the live schema without generated-type constraints.
 */
type UntypedClient = SupabaseClient;

type B2bReferralRow = {
    id: string;
    status: string;
    created_at: string;
    referrer_org_id: string;
    referred_org_id: string;
    referrer: { name?: string } | null;
    referred: { name?: string } | null;
};

type ClientEventRow = {
    id: string;
    status: string;
    created_at: string;
    referrer_id: string;
    referred_email: string;
    profiles: { full_name?: string; email?: string } | null;
};

type IncentiveRow = {
    event_id: string | null;
    amount: number | null;
    currency: string | null;
    tds_applicable: boolean;
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { type } = await params;
    if (type !== "b2b" && type !== "client") {
        return apiError("type must be 'b2b' or 'client'", 400);
    }

    const db = auth.adminClient as unknown as UntypedClient;
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(0, Number(searchParams.get("page") || 0));
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || 50)));

    try {
        if (type === "b2b") {
            const result = await db
                .from("referrals")
                .select(
                    "id, status, created_at, referrer_org_id, referred_org_id, " +
                    "referrer:organizations!referrals_referrer_org_id_fkey(name, subscription_tier), " +
                    "referred:organizations!referrals_referred_org_id_fkey(name, subscription_tier)",
                    { count: "exact" }
                )
                .order("created_at", { ascending: false })
                .range(page * limit, (page + 1) * limit - 1);

            const rows = ((result.data ?? []) as unknown as B2bReferralRow[]).map((r) => ({
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
        const result = await db
            .from("client_referral_events")
            .select(
                "id, status, created_at, referrer_id, referred_email, " +
                "profiles!client_referral_events_referrer_id_fkey(full_name, email)",
                { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        const eventIds = ((result.data ?? []) as unknown as ClientEventRow[])
            .map((event) => event.id)
            .filter(Boolean);
        const incentivesResult = eventIds.length > 0
            ? await db
                .from("client_referral_incentives")
                .select("event_id, amount, currency, tds_applicable")
                .in("event_id", eventIds)
            : { data: [] as IncentiveRow[] };

        const incentiveMap = new Map<string, { amount: number; tds: boolean }>();
        for (const i of ((incentivesResult.data ?? []) as unknown as IncentiveRow[])) {
            if (i.event_id) {
                incentiveMap.set(i.event_id, {
                    amount: Number(i.amount ?? 0),
                    tds: Boolean(i.tds_applicable),
                });
            }
        }

        const rows = ((result.data ?? []) as unknown as ClientEventRow[]).map((e) => {
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
            meta: {
                data_quality: buildGodDataQuality(["client_referral_events", "client_referral_incentives"]),
            },
        });
    } catch (err) {
        logError(`[superadmin/referrals/detail/${type}]`, err);
        return apiError("Failed to load referral details", 500);
    }
}
