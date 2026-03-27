/* ------------------------------------------------------------------
 * GET/POST /api/admin/notes
 * Agent notes per conversation — private internal notes.
 * GET: ?key=<phone_or_email> → returns the note
 * POST: { key, note } → upserts the note
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// GET — fetch note for a conversation
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const orgId = auth.organizationId!;
        const url = new URL(request.url);
        const key = url.searchParams.get("key");

        if (!key) {
            return apiError("'key' query parameter is required", 400);
        }

        const db = createAdminClient();
        const { data } = await db
            .from("conversation_notes" as any)
            .select("note, updated_at")
            .eq("organization_id", orgId)
            .eq("conversation_key", key)
            .single();

        const row = data as { note?: string; updated_at?: string } | null;
        return apiSuccess({ note: row?.note ?? "", updatedAt: row?.updated_at ?? null });
    } catch (err) {
        logError("[notes] GET failed", err);
        return apiError("Failed to fetch note", 500);
    }
}

// ---------------------------------------------------------------------------
// POST — upsert note for a conversation
// ---------------------------------------------------------------------------

interface NoteBody {
    key: string;
    note: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const orgId = auth.organizationId!;
        const userId = auth.userId;
        const raw = (await request.json()) as Partial<NoteBody>;

        if (!raw.key || typeof raw.key !== "string") {
            return apiError("'key' is required", 400);
        }
        if (typeof raw.note !== "string") {
            return apiError("'note' is required", 400);
        }

        const db = createAdminClient();
        const { error } = await db
            .from("conversation_notes" as any)
            .upsert(
                {
                    organization_id: orgId,
                    conversation_key: raw.key,
                    note: raw.note,
                    updated_by: userId,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "organization_id,conversation_key" },
            );

        if (error) {
            logError("[notes] upsert failed", error);
            return apiError("Failed to save note", 500);
        }

        return apiSuccess({ saved: true });
    } catch (err) {
        logError("[notes] POST failed", err);
        return apiError("Failed to save note", 500);
    }
}
