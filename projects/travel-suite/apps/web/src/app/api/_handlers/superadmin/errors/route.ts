// GET  /api/superadmin/errors        — paginated error event list with filters
// PATCH /api/superadmin/errors/:id   — update status + resolution notes

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";
import { loadWorkItemMetaForIds, saveWorkItemMeta } from "@/lib/platform/god-mode";

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

type OwnerProfileRow = {
    id: string;
    full_name: string | null;
    email: string | null;
};

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
        const eventRows = ((result.data ?? []) as ErrorEventRow[]).sort((a, b) => {
            const ai = LEVEL_ORDER.indexOf(a.level);
            const bi = LEVEL_ORDER.indexOf(b.level);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        const metaByEventId = await loadWorkItemMetaForIds(db, "error_event", eventRows.map((event) => event.id));
        const ownerIds = Array.from(new Set(
            Array.from(metaByEventId.values())
                .map((meta) => meta.owner_id)
                .filter((ownerId): ownerId is string => Boolean(ownerId)),
        ));
        const ownerLookup = new Map<string, { name: string; email: string | null }>();
        if (ownerIds.length > 0) {
            const ownerRows = await db
                .from("profiles")
                .select("id, full_name, email")
                .in("id", ownerIds);
            for (const owner of (ownerRows.data ?? []) as OwnerProfileRow[]) {
                ownerLookup.set(owner.id, {
                    name: owner.full_name?.trim() || owner.email?.trim() || "Unknown",
                    email: owner.email,
                });
            }
        }
        const nowMs = Date.now();
        const events = eventRows.map((event) => {
            const meta = metaByEventId.get(event.id);
            const owner = meta?.owner_id ? ownerLookup.get(meta.owner_id) : null;
            const slaDueAt = meta?.sla_due_at ?? null;
            const isSlaBreached = Boolean(
                slaDueAt
                && ["open", "investigating"].includes(event.status)
                && new Date(slaDueAt).getTime() < nowMs,
            );
            return {
                ...event,
                owner_id: meta?.owner_id ?? null,
                owner_name: owner?.name ?? null,
                escalation_level: meta?.escalation_level ?? "normal",
                sla_due_at: slaDueAt,
                ops_note: meta?.ops_note ?? null,
                is_sla_breached: isSlaBreached,
            };
        });
        const claimed_count = events.filter((event) => Boolean(event.owner_id)).length;
        const elevated_count = events.filter((event) => event.escalation_level !== "normal").length;
        const sla_breach_count = events.filter((event) => event.is_sla_breached).length;

        return NextResponse.json({
            events,
            total: result.count ?? 0,
            open_count: openCount.count ?? 0,
            fatal_count: fatalCount.count ?? 0,
            resolved_this_week: resolvedThisWeek.count ?? 0,
            claimed_count,
            elevated_count,
            sla_breach_count,
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
    claim?: boolean;
    release?: boolean;
    owner_id?: string | null;
    escalation_level?: "normal" | "elevated" | "critical";
    sla_due_at?: string | null;
    ops_note?: string | null;
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
    const hasEventPatch = Boolean(status) || resolution_notes !== undefined;
    const hasManagementPatch = [
        body.claim,
        body.release,
        body.owner_id,
        body.escalation_level,
        body.sla_due_at,
        body.ops_note,
    ].some((value) => value !== undefined);

    if (!hasEventPatch && !hasManagementPatch) {
        return apiError("No fields to update", 400);
    }

    const VALID_STATUSES: ErrorStatus[] = ["open", "investigating", "resolved", "wont_fix"];
    if (status && !VALID_STATUSES.includes(status)) {
        return apiError(`Invalid status: ${status}`, 400);
    }
    if (body.escalation_level && !["normal", "elevated", "critical"].includes(body.escalation_level)) {
        return apiError(`Invalid escalation_level: ${body.escalation_level}`, 400);
    }

    try {
        if (hasEventPatch) {
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
        }

        const nextOwnerId = body.claim
            ? auth.userId
            : body.release
                ? null
                : body.owner_id === undefined
                    ? undefined
                    : (body.owner_id ?? null);

        const management = hasManagementPatch || (status === "resolved" || status === "wont_fix")
            ? await saveWorkItemMeta(
                db,
                "error_event",
                id,
                {
                    owner_id: nextOwnerId,
                    escalation_level: body.escalation_level ?? ((status === "resolved" || status === "wont_fix") ? "normal" : undefined),
                    sla_due_at: body.sla_due_at ?? ((status === "resolved" || status === "wont_fix") ? null : undefined),
                    ops_note: body.ops_note,
                },
                auth.userId,
            )
            : null;

        await logPlatformAction(
            auth.userId,
            "Updated incident controls",
            "support",
            {
                error_event_id: id,
                status: status ?? null,
                owner_id: management?.owner_id ?? null,
                escalation_level: management?.escalation_level ?? null,
                sla_due_at: management?.sla_due_at ?? null,
            },
            getClientIpFromRequest(request),
        );

        return NextResponse.json({ ok: true, management });
    } catch (err) {
        logError("[superadmin/errors PATCH]", err);
        return apiError("Failed to update error event", 500);
    }
}
