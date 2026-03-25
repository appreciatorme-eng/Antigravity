/* ------------------------------------------------------------------
 * PUT /api/admin/whatsapp/contact-names
 * Update custom_name and/or is_personal for a WhatsApp contact.
 * Requires admin role with organization context.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";

const UpdateSchema = z.object({
    wa_id: z.string().min(1),
    custom_name: z.string().trim().max(100).optional(),
    is_personal: z.boolean().optional(),
});

export async function PUT(request: Request): Promise<Response> {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return apiError("Invalid JSON", 400);
    }

    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid payload", 400);

    const { wa_id, custom_name, is_personal } = parsed.data;

    const updates: Record<string, unknown> = {
        org_id: auth.organizationId,
        wa_id,
        updated_at: new Date().toISOString(),
    };
    if (custom_name !== undefined) updates.custom_name = custom_name || null;
    if (is_personal !== undefined) updates.is_personal = is_personal;

    // Table pending type generation -- use untyped rpc until `npx supabase gen types` runs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = auth.adminClient as any;
    const { error } = await client
        .from("whatsapp_contact_names")
        .upsert(updates, { onConflict: "org_id,wa_id" });

    if (error) return apiError("Failed to update contact", 500);
    return apiSuccess({ updated: true });
}
