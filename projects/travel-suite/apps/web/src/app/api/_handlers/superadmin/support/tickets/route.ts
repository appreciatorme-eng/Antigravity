/* eslint-disable @typescript-eslint/no-explicit-any */
// GET /api/superadmin/support/tickets — paginated support ticket list with filters.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;
    const params = request.nextUrl.searchParams;
    const status = params.get("status") ?? "all";
    const priority = params.get("priority") ?? "all";
    const search = params.get("search")?.trim() ?? "";
    const page = Math.max(0, Number(params.get("page") || 0));
    const limit = Math.min(100, Math.max(10, Number(params.get("limit") || 50)));

    try {
        const db = adminClient as any;
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
            db.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
            db.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
        ]);

        const tickets = (result.data ?? []).map((t: any) => {
            const profile = t.profiles as {
                full_name?: string; email?: string; organization_id?: string;
                organizations?: { name?: string } | null;
            } | null;
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
        return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
    }
}
