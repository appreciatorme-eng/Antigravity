/* ------------------------------------------------------------------
 * POST /api/admin/email/disconnect
 * Removes the Gmail (Google) social connection for the org.
 * Requires admin role with organization.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";

export async function POST(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const orgId = auth.organizationId!;
        const admin = createAdminClient();

        const { error } = await admin
            .from("social_connections")
            .delete()
            .eq("organization_id", orgId)
            .eq("platform", "google");

        if (error) {
            logError("[email/disconnect] Delete failed", error);
            return apiError("Failed to disconnect Gmail", 500);
        }

        return apiSuccess({ disconnected: true });
    } catch (err) {
        logError("[email/disconnect] Failed", err);
        return apiError("Failed to disconnect Gmail", 500);
    }
}
