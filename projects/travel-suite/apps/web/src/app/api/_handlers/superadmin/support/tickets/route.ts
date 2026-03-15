// GET /api/superadmin/support/tickets -- paginated support ticket list with filters.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The live DB has a support_tickets_user_id_fkey relationship that is not present
 * in the generated Database types. We use an untyped SupabaseClient for the join query.
 */
type UntypedClient = SupabaseClient;

type TicketWithProfile = {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    admin_response: string | null;
    responded_at: string | null;
    profiles: {
        full_name?: string;
        email?: string;
        organization_id?: string;
        organizations?: { name?: string } | null;
    } | null;
};

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const db = auth.adminClient as unknown as UntypedClient;
    const params = request.nextUrl.searchParams;
    const status = params.get("status") ?? "all";
    const priority = params.get("priority") ?? "all";
    const search = params.get("search")?.trim() ?? "";
    const page = Math.max(0, Number(params.get("page") || 0));
    const limit = Math.min(100, Math.max(10, Number(params.get("limit") || 50)));

    try {
        let query = db
            .from("support_tickets")
            .select(
                "id, title, description, category, priority, status, created_at, updated_at, " +
                "user_id, admin_response, responded_at, " +
                "profiles!support_tickets_user_id_fkey(full_name, email, organization_id, " +
                "organizations(name))",
                { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (status !== "all") query = query.eq("status", status);
        if (priority !== "all") query = query.eq("priority", priority);
        if (search) query = query.ilike("title", `%${search}%`);

        const [result, openCount, inProgressCount] = await Promise.all([
            query,
            db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
            db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
        ]);

        const tickets = ((result.data ?? []) as unknown as TicketWithProfile[]).map((t) => {
            const profile = t.profiles;
            return {
                id: t.id,
                title: t.title,
                description: t.description,
                category: t.category,
                priority: t.priority,
                status: t.status,
                created_at: t.created_at,
                updated_at: t.updated_at,
                user_id: t.user_id,
                user_name: profile?.full_name ?? null,
                user_email: profile?.email ?? null,
                org_id: profile?.organization_id ?? null,
                org_name: profile?.organizations?.name ?? null,
                has_response: Boolean(t.admin_response),
                responded_at: t.responded_at,
            };
        });

        return NextResponse.json({
            tickets,
            total: result.count ?? 0,
            open_count: openCount.count ?? 0,
            in_progress_count: inProgressCount.count ?? 0,
            page,
            pages: Math.ceil((result.count ?? 0) / limit),
        });
    } catch (err) {
        console.error("[superadmin/support/tickets]", err);
        return apiError("Failed to load tickets", 500);
    }
}
