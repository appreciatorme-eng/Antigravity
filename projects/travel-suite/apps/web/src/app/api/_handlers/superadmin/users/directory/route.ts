// GET /api/superadmin/users/directory — searchable paginated directory of all users.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";

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
        let query = adminClient
            .from("profiles")
            .select(
                "id, full_name, email, phone, role, avatar_url, organization_id, created_at, organizations(name, slug, subscription_tier)",
                { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (search) {
            query = query.or(
                `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
            );
        }

        if (role !== "all") query = query.eq("role", role);

        const result = await query;

        const rows = (result.data ?? []).map((p) => {
            const org = p.organizations as { name?: string; slug?: string; subscription_tier?: string } | null;
            const orgTier = org?.subscription_tier ?? null;
            if (tier !== "all" && orgTier !== tier) return null;

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
                org_tier: orgTier,
                created_at: p.created_at,
            };
        }).filter(Boolean);

        return NextResponse.json({
            users: rows,
            total: result.count ?? 0,
            page,
            pages: Math.ceil((result.count ?? 0) / limit),
        });
    } catch (err) {
        logError("[superadmin/users/directory]", err);
        return apiError("Failed to load directory", 500);
    }
}
