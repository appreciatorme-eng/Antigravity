// GET /api/superadmin/audit-log — paginated platform audit log entries.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;
    const params = request.nextUrl.searchParams;
    const category = params.get("category") ?? "all";
    const page = Math.max(0, Number(params.get("page") || 0));
    const limit = Math.min(100, Math.max(10, Number(params.get("limit") || 50)));

    try {
        let query = adminClient
            .from("platform_audit_log")
            .select("*, profiles!platform_audit_log_actor_id_fkey(full_name, email)", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (category !== "all") query = query.eq("category", category);

        const result = await query;

        const entries = (result.data ?? []).map((row) => {
            const actor = row.profiles as { full_name?: string; email?: string } | null;
            return {
                id: row.id,
                action: row.action,
                category: row.category,
                target_type: row.target_type,
                target_id: row.target_id,
                details: row.details,
                ip_address: row.ip_address,
                created_at: row.created_at,
                actor_id: row.actor_id,
                actor_name: actor?.full_name ?? actor?.email ?? "Unknown",
            };
        });

        return NextResponse.json({
            entries,
            total: result.count ?? 0,
            page,
            pages: Math.ceil((result.count ?? 0) / limit),
        });
    } catch (err) {
        logError("[superadmin/audit-log]", err);
        return apiError("Failed to load audit log", 500);
    }
}
