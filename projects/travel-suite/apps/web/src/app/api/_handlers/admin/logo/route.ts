/* ------------------------------------------------------------------
 * POST /api/admin/logo
 * Saves logo_url to the organization (uses admin client to bypass RLS).
 * ------------------------------------------------------------------ */

import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";
import { z } from "zod";

const LogoSchema = z.object({
  logo_url: z.string().url().max(2048),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;
    const { organizationId, adminClient } = authResult;

    if (!organizationId) {
      return apiError("Organization not configured", 400);
    }

    const body = await request.json().catch(() => null);
    const parsed = LogoSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid logo URL", 400);
    }

    const { error } = await adminClient
      .from("organizations")
      .update({ logo_url: parsed.data.logo_url })
      .eq("id", organizationId);

    if (error) {
      logError("[admin/logo] Failed to save logo_url", error);
      return apiError("Failed to save logo", 500);
    }

    return apiSuccess({ saved: true });
  } catch (error) {
    logError("[/api/admin/logo:POST] Unhandled error", error);
    return apiError("An unexpected error occurred", 500);
  }
}
