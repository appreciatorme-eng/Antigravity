import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/lib/database.types";

export type OverviewRange = "7d" | "30d" | "90d";
export type SavedView = "all" | "revenue" | "customer-risk" | "incidents" | "growth";
export type WorkItemKind = "support_ticket" | "error_event";
export type EscalationLevel = "normal" | "elevated" | "critical";

export type SavedPreset = {
    id: string;
    name: string;
    view: SavedView;
    range: OverviewRange;
};

export type WorkItemMeta = {
    owner_id: string | null;
    escalation_level: EscalationLevel;
    sla_due_at: string | null;
    ops_note: string | null;
    updated_at: string | null;
    updated_by: string | null;
};

const MAX_PRESETS = 8;
const PRESET_KEY_PREFIX = "god_presets:";
const WORK_ITEM_KEY_PREFIX = "god_work_item:";

type PlatformSettingsClient = SupabaseClient;
type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeView(value: unknown): SavedView {
    if (value === "revenue" || value === "customer-risk" || value === "incidents" || value === "growth") return value;
    return "all";
}

function normalizeRange(value: unknown): OverviewRange {
    if (value === "7d" || value === "90d") return value;
    return "30d";
}

function normalizePreset(value: unknown): SavedPreset | null {
    if (!isRecord(value)) return null;
    const id = typeof value.id === "string" ? value.id.trim() : "";
    const name = typeof value.name === "string" ? value.name.trim() : "";
    if (!id || !name) return null;
    return {
        id: id.slice(0, 64),
        name: name.slice(0, 60),
        view: normalizeView(value.view),
        range: normalizeRange(value.range),
    };
}

function normalizeIso(value: unknown): string | null {
    if (typeof value !== "string" || !value.trim()) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
}

function normalizeEscalation(value: unknown): EscalationLevel {
    if (value === "elevated" || value === "critical") return value;
    return "normal";
}

function normalizeWorkItemMeta(value: unknown): WorkItemMeta {
    if (!isRecord(value)) {
        return {
            owner_id: null,
            escalation_level: "normal",
            sla_due_at: null,
            ops_note: null,
            updated_at: null,
            updated_by: null,
        };
    }
    return {
        owner_id: typeof value.owner_id === "string" && value.owner_id.trim() ? value.owner_id : null,
        escalation_level: normalizeEscalation(value.escalation_level),
        sla_due_at: normalizeIso(value.sla_due_at),
        ops_note: typeof value.ops_note === "string" && value.ops_note.trim() ? value.ops_note.trim().slice(0, 2000) : null,
        updated_at: normalizeIso(value.updated_at),
        updated_by: typeof value.updated_by === "string" && value.updated_by.trim() ? value.updated_by : null,
    };
}

function userPresetKey(userId: string): string {
    return `${PRESET_KEY_PREFIX}${userId}`;
}

export function workItemKey(kind: WorkItemKind, itemId: string): string {
    return `${WORK_ITEM_KEY_PREFIX}${kind}:${itemId}`;
}

function workItemIdFromKey(key: string): string | null {
    const parts = key.split(":");
    if (parts.length < 3) return null;
    return parts.slice(2).join(":").trim() || null;
}

async function getSettingValue(adminClient: PlatformSettingsClient, key: string): Promise<unknown> {
    const result = await adminClient
        .from("platform_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
    if (!result.data) return null;
    return result.data.value;
}

async function upsertSetting(adminClient: PlatformSettingsClient, key: string, value: Json): Promise<void> {
    await adminClient.from("platform_settings").upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
    });
}

export async function loadUserPresets(adminClient: PlatformSettingsClient, userId: string): Promise<SavedPreset[]> {
    const raw = await getSettingValue(adminClient, userPresetKey(userId));
    if (!Array.isArray(raw)) return [];
    return raw
        .map((entry) => normalizePreset(entry))
        .filter((entry): entry is SavedPreset => Boolean(entry))
        .slice(0, MAX_PRESETS);
}

export async function saveUserPresets(adminClient: PlatformSettingsClient, userId: string, presets: SavedPreset[]): Promise<SavedPreset[]> {
    const normalized = presets
        .map((preset) => normalizePreset(preset))
        .filter((preset): preset is SavedPreset => Boolean(preset))
        .slice(0, MAX_PRESETS);
    await upsertSetting(adminClient, userPresetKey(userId), normalized as unknown as Json);
    return normalized;
}

export async function loadWorkItemMeta(
    adminClient: PlatformSettingsClient,
    kind: WorkItemKind,
    itemId: string,
): Promise<WorkItemMeta> {
    const raw = await getSettingValue(adminClient, workItemKey(kind, itemId));
    return normalizeWorkItemMeta(raw);
}

export async function loadWorkItemMetaForIds(
    adminClient: PlatformSettingsClient,
    kind: WorkItemKind,
    itemIds: string[],
): Promise<Map<string, WorkItemMeta>> {
    const uniqueIds = Array.from(new Set(itemIds.filter(Boolean)));
    if (uniqueIds.length === 0) return new Map();
    const keys = uniqueIds.map((itemId) => workItemKey(kind, itemId));
    const result = await adminClient
        .from("platform_settings")
        .select("key, value")
        .in("key", keys);

    const map = new Map<string, WorkItemMeta>();
    for (const row of result.data ?? []) {
        const itemId = workItemIdFromKey(String(row.key));
        if (!itemId) continue;
        map.set(itemId, normalizeWorkItemMeta(row.value));
    }
    return map;
}

export async function saveWorkItemMeta(
    adminClient: PlatformSettingsClient,
    kind: WorkItemKind,
    itemId: string,
    patch: Partial<WorkItemMeta>,
    actorId: string,
): Promise<WorkItemMeta> {
    const previous = await loadWorkItemMeta(adminClient, kind, itemId);
    const next: WorkItemMeta = {
        owner_id: patch.owner_id === undefined ? previous.owner_id : (patch.owner_id ?? null),
        escalation_level: patch.escalation_level ? normalizeEscalation(patch.escalation_level) : previous.escalation_level,
        sla_due_at: patch.sla_due_at === undefined ? previous.sla_due_at : normalizeIso(patch.sla_due_at),
        ops_note: patch.ops_note === undefined
            ? previous.ops_note
            : (typeof patch.ops_note === "string" && patch.ops_note.trim() ? patch.ops_note.trim().slice(0, 2000) : null),
        updated_at: new Date().toISOString(),
        updated_by: actorId,
    };
    await upsertSetting(adminClient, workItemKey(kind, itemId), next as unknown as Json);
    return next;
}
