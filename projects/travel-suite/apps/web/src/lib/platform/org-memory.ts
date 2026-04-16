import type { SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient;

export type OrgActivityEvent = {
    id: string;
    org_id: string;
    actor_id: string | null;
    actor_name: string | null;
    event_type: string;
    title: string;
    detail: string | null;
    entity_type: string | null;
    entity_id: string | null;
    source: string;
    metadata: Record<string, unknown> | null;
    occurred_at: string | null;
};

export type OrgMemoryNote = {
    id: string;
    org_id: string;
    author_id: string | null;
    author_name: string | null;
    category: "context" | "handoff" | "promise" | "support";
    title: string;
    body: string;
    pinned: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type ProfileLookupRow = {
    id: string;
    full_name: string | null;
    email: string | null;
};

type OrgActivityEventRow = {
    id: string;
    org_id: string;
    actor_id: string | null;
    event_type: string;
    title: string;
    detail: string | null;
    entity_type: string | null;
    entity_id: string | null;
    source: string | null;
    metadata: unknown;
    occurred_at: string | null;
};

type OrgMemoryNoteRow = {
    id: string;
    org_id: string;
    author_id: string | null;
    category: string | null;
    title: string;
    body: string;
    pinned: boolean | null;
    created_at: string | null;
    updated_at: string | null;
};

function cleanText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

function normalizeMetadata(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

async function loadProfileLookup(db: AdminClient, ids: string[]): Promise<Map<string, string>> {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (!uniqueIds.length) return new Map();
    const result = await db.from("profiles").select("id, full_name, email").in("id", uniqueIds);
    const lookup = new Map<string, string>();
    for (const profile of (result.data ?? []) as ProfileLookupRow[]) {
        lookup.set(profile.id, cleanText(profile.full_name) ?? cleanText(profile.email) ?? "Unknown");
    }
    return lookup;
}

export async function recordOrgActivityEvent(
    db: AdminClient,
    payload: {
        org_id: string | null | undefined;
        actor_id?: string | null;
        event_type: string;
        title: string;
        detail?: string | null;
        entity_type?: string | null;
        entity_id?: string | null;
        source?: string;
        metadata?: Record<string, unknown> | null;
        occurred_at?: string | null;
    },
): Promise<void> {
    if (!payload.org_id) return;
    await db.from("org_activity_events").insert({
        org_id: payload.org_id,
        actor_id: payload.actor_id ?? null,
        event_type: payload.event_type,
        title: payload.title,
        detail: cleanText(payload.detail),
        entity_type: cleanText(payload.entity_type),
        entity_id: cleanText(payload.entity_id),
        source: cleanText(payload.source) ?? "system",
        metadata: payload.metadata ?? {},
        occurred_at: cleanText(payload.occurred_at) ?? new Date().toISOString(),
    });
}

export async function listOrgActivityEvents(db: AdminClient, orgId: string, limit = 20): Promise<OrgActivityEvent[]> {
    const result = await db
        .from("org_activity_events")
        .select("id, org_id, actor_id, event_type, title, detail, entity_type, entity_id, source, metadata, occurred_at")
        .eq("org_id", orgId)
        .order("occurred_at", { ascending: false })
        .limit(limit);

    const rows = (result.data ?? []) as OrgActivityEventRow[];
    return hydrateOrgActivityEvents(db, rows);
}

async function hydrateOrgActivityEvents(db: AdminClient, rows: OrgActivityEventRow[]): Promise<OrgActivityEvent[]> {
    const actorLookup = await loadProfileLookup(
        db,
        rows.map((row) => row.actor_id ?? "").filter(Boolean),
    );

    return rows.map((row) => ({
        id: row.id,
        org_id: row.org_id,
        actor_id: row.actor_id,
        actor_name: row.actor_id ? actorLookup.get(row.actor_id) ?? null : null,
        event_type: row.event_type,
        title: row.title,
        detail: cleanText(row.detail),
        entity_type: cleanText(row.entity_type),
        entity_id: cleanText(row.entity_id),
        source: cleanText(row.source) ?? "system",
        metadata: normalizeMetadata(row.metadata),
        occurred_at: cleanText(row.occurred_at),
    }));
}

export async function listOrgActivityEventFeed(
    db: AdminClient,
    options: {
        orgId: string;
        limit?: number;
        cursor?: string | null;
        source?: string | "all" | null;
        eventType?: string | "all" | null;
        search?: string | null;
    },
): Promise<{ events: OrgActivityEvent[]; next_cursor: string | null }> {
    const limit = Math.min(80, Math.max(5, options.limit ?? 25));
    const source = cleanText(options.source);
    const eventType = cleanText(options.eventType);
    const cursor = cleanText(options.cursor);
    const search = cleanText(options.search);

    let query = db
        .from("org_activity_events")
        .select("id, org_id, actor_id, event_type, title, detail, entity_type, entity_id, source, metadata, occurred_at")
        .eq("org_id", options.orgId)
        .order("occurred_at", { ascending: false })
        .limit(limit + 1);

    if (source && source !== "all") query = query.eq("source", source);
    if (eventType && eventType !== "all") query = query.eq("event_type", eventType);
    if (cursor) query = query.lt("occurred_at", cursor);
    if (search) query = query.or(`title.ilike.%${search}%,detail.ilike.%${search}%`);

    const result = await query;
    const rows = (result.data ?? []) as OrgActivityEventRow[];
    const trimmedRows = rows.slice(0, limit);
    const nextCursor = rows.length > limit
        ? cleanText(trimmedRows[trimmedRows.length - 1]?.occurred_at ?? null)
        : null;

    return {
        events: await hydrateOrgActivityEvents(db, trimmedRows),
        next_cursor: nextCursor,
    };
}

export async function listOrgMemoryNotes(db: AdminClient, orgId: string, limit = 10): Promise<OrgMemoryNote[]> {
    const result = await db
        .from("org_memory_notes")
        .select("id, org_id, author_id, category, title, body, pinned, created_at, updated_at")
        .eq("org_id", orgId)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

    const rows = (result.data ?? []) as OrgMemoryNoteRow[];
    const authorLookup = await loadProfileLookup(
        db,
        rows.map((row) => row.author_id ?? "").filter(Boolean),
    );

    return rows.map((row) => ({
        id: row.id,
        org_id: row.org_id,
        author_id: row.author_id,
        author_name: row.author_id ? authorLookup.get(row.author_id) ?? null : null,
        category: row.category === "handoff" || row.category === "promise" || row.category === "support" ? row.category : "context",
        title: row.title,
        body: row.body,
        pinned: Boolean(row.pinned),
        created_at: cleanText(row.created_at),
        updated_at: cleanText(row.updated_at),
    }));
}

export async function createOrgMemoryNote(
    db: AdminClient,
    payload: {
        org_id: string;
        author_id: string | null;
        category?: "context" | "handoff" | "promise" | "support";
        title: string;
        body: string;
        pinned?: boolean;
    },
): Promise<OrgMemoryNote | null> {
    const result = await db
        .from("org_memory_notes")
        .insert({
            org_id: payload.org_id,
            author_id: payload.author_id,
            category: payload.category ?? "context",
            title: payload.title.trim(),
            body: payload.body.trim(),
            pinned: Boolean(payload.pinned),
        })
        .select("id, org_id, author_id, category, title, body, pinned, created_at, updated_at")
        .single();

    if (!result.data) return null;
    const note = result.data as OrgMemoryNoteRow;
    const authorLookup = await loadProfileLookup(db, note.author_id ? [note.author_id] : []);
    return {
        id: note.id,
        org_id: note.org_id,
        author_id: note.author_id,
        author_name: note.author_id ? authorLookup.get(note.author_id) ?? null : null,
        category: note.category === "handoff" || note.category === "promise" || note.category === "support" ? note.category : "context",
        title: note.title,
        body: note.body,
        pinned: Boolean(note.pinned),
        created_at: cleanText(note.created_at),
        updated_at: cleanText(note.updated_at),
    };
}
