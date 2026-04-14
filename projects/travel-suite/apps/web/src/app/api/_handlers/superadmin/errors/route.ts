// GET  /api/superadmin/errors        — paginated error event list with filters
// PATCH /api/superadmin/errors/:id   — update status + resolution notes

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ErrorStatus = "open" | "investigating" | "resolved" | "wont_fix";

interface ErrorEventRow {
    id: string;
    sentry_issue_id: string;
    sentry_issue_url: string | null;
    title: string;
    level: string;
    culprit: string | null;
    environment: string;
    event_count: number;
    user_count: number;
    first_seen_at: string;
    status: ErrorStatus;
    resolution_notes: string | null;
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
}

// ---------------------------------------------------------------------------
// GET /api/superadmin/errors
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events not yet in generated types
    const db = auth.adminClient as any;
    const params = request.nextUrl.searchParams;
    const status = params.get("status") ?? "all";
    const page = Math.max(0, Number(params.get("page") || 0));
    const limit = Math.min(100, Math.max(10, Number(params.get("limit") || 50)));

    // Level priority order for sorting (fatal first)
    const LEVEL_ORDER = ["fatal", "error", "warning", "info", "debug"];

    try {
        let query = db
            .from("error_events")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (status !== "all") {
            query = query.eq("status", status);
        }

        // Run main query + summary counts in parallel
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [result, openCount, fatalCount, resolvedThisWeek] = await Promise.all([
            query,
            db.from("error_events").select("id", { count: "exact", head: true }).eq("status", "open"),
            db.from("error_events").select("id", { count: "exact", head: true }).eq("level", "fatal").eq("status", "open"),
            db.from("error_events")
                .select("id", { count: "exact", head: true })
                .eq("status", "resolved")
                .gte("resolved_at", oneWeekAgo),
        ]);

        // Sort by level priority within the page
        const events = ((result.data ?? []) as ErrorEventRow[]).sort((a, b) => {
            const ai = LEVEL_ORDER.indexOf(a.level);
            const bi = LEVEL_ORDER.indexOf(b.level);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        return NextResponse.json({
            events,
            total: result.count ?? 0,
            open_count: openCount.count ?? 0,
            fatal_count: fatalCount.count ?? 0,
            resolved_this_week: resolvedThisWeek.count ?? 0,
            page,
            pages: Math.ceil((result.count ?? 0) / limit),
        });
    } catch (err) {
        logError("[superadmin/errors GET]", err);
        return apiError("Failed to load error events", 500);
    }
}

// ---------------------------------------------------------------------------
// PATCH /api/superadmin/errors/:id
// ---------------------------------------------------------------------------

interface PatchBody {
    status?: ErrorStatus;
    resolution_notes?: string;
}

export async function PATCH(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events not yet in generated types
    const db = auth.adminClient as any;

    // Extract :id from the URL path (last segment)
    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 1];

    if (!id || id === "errors") {
        return apiError("Missing error event id", 400);
    }

    let body: PatchBody;
    try {
        body = (await request.json()) as PatchBody;
    } catch {
        return apiError("Invalid JSON body", 400);
    }

    const { status, resolution_notes } = body;

    if (!status && resolution_notes === undefined) {
        return apiError("No fields to update", 400);
    }

    const VALID_STATUSES: ErrorStatus[] = ["open", "investigating", "resolved", "wont_fix"];
    if (status && !VALID_STATUSES.includes(status)) {
        return apiError(`Invalid status: ${status}`, 400);
    }

    try {
        const update: Record<string, unknown> = {};

        if (status) {
            update.status = status;
            if (status === "resolved") {
                update.resolved_at = new Date().toISOString();
                update.resolved_by = auth.userId;
            } else if (status === "open" || status === "investigating") {
                // Clear resolution fields when reopening/investigating
                update.resolved_at = null;
                update.resolved_by = null;
            }
        }

        if (resolution_notes !== undefined) {
            update.resolution_notes = resolution_notes || null;
        }

        const { error } = await db.from("error_events").update(update).eq("id", id);

        if (error) {
            logError("[superadmin/errors PATCH]", error);
            return apiError("Failed to update error event", 500);
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        logError("[superadmin/errors PATCH]", err);
        return apiError("Failed to update error event", 500);
    }
}
