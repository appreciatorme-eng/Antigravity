// GET /api/superadmin/users/directory — searchable paginated directory of all users across orgs.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError, logEvent } from "@/lib/observability/logger";
import { buildGodDataQuality } from "@/lib/platform/god-kpi";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;
    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim() ?? "";
    const role = params.get("role") ?? "all";
    const tier = params.get("tier") ?? "all";
    const page = Math.max(0, Number(params.get("page") || 0));
    const limit = Math.min(100, Math.max(10, Number(params.get("limit") || 50)));

    try {
        // Step 1: query profiles with filters
        let profileQuery = adminClient
            .from("profiles")
            .select("id, full_name, email, phone, role, avatar_url, organization_id, created_at", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (search) {
            profileQuery = profileQuery.or(
                `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
            );
        }
        if (role !== "all") profileQuery = profileQuery.eq("role", role);

        const profileResult = await profileQuery;

        if (profileResult.error) {
            logError("[superadmin/users/directory] profiles query failed", profileResult.error);
            return apiError("Failed to load directory", 500);
        }

        const profiles = profileResult.data ?? [];
        const total = profileResult.count ?? 0;

        // Step 2: fetch org details for the returned profiles
        const orgIds = [...new Set(profiles.map((p) => p.organization_id).filter(Boolean))] as string[];

        let orgMap: Record<string, { name: string; slug: string; subscription_tier: string | null }> = {};

        if (orgIds.length > 0) {
            let orgQuery = adminClient
                .from("organizations")
                .select("id, name, slug, subscription_tier")
                .in("id", orgIds);

            if (tier !== "all") orgQuery = orgQuery.eq("subscription_tier", tier);

            const orgResult = await orgQuery;
            if (orgResult.error) {
                logEvent("warn", "[superadmin/users/directory] orgs query failed", { error: orgResult.error });
                // Continue — org data is non-critical
            } else {
                for (const org of orgResult.data ?? []) {
                    orgMap[org.id] = { name: org.name, slug: org.slug ?? "", subscription_tier: org.subscription_tier ?? null };
                }
            }
        }

        // Step 3: filter profiles by tier (post-join, since tier lives on orgs)
        const filteredProfiles = tier === "all"
            ? profiles
            : profiles.filter((p) => p.organization_id && orgMap[p.organization_id]);

        const rows = filteredProfiles.map((p) => {
            const org = p.organization_id ? orgMap[p.organization_id] ?? null : null;
            return {
                id: p.id,
                full_name: p.full_name,
                email: p.email,
                phone: p.phone,
                role: p.role,
                avatar_url: p.avatar_url,
                org_id: p.organization_id,
                org_name: org?.name ?? null,
                org_slug: org?.slug ?? null,
                org_tier: org?.subscription_tier ?? null,
                created_at: p.created_at,
            };
        });

        return NextResponse.json({
            users: rows,
            total: tier === "all" ? total : rows.length,
            page,
            pages: Math.ceil((tier === "all" ? total : rows.length) / limit),
            meta: {
                data_quality: buildGodDataQuality(["profiles", "organizations"]),
            },
        });
    } catch (err) {
        logError("[superadmin/users/directory]", err);
        return apiError("Failed to load directory", 500);
    }
}
