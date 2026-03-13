import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";

const bulkSchema = z.object({
  action: z.enum(["approve", "archive"]),
  ids: z.array(z.string().uuid()).min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { userId, organizationId, adminClient } = auth;

    const body = await request.json().catch(() => null);
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid bulk proposal payload", 400);
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const { data: proposals, error: proposalsError } = await adminClient
      .from("proposals")
      .select("id")
      .eq("organization_id", organizationId!)
      .in("id", parsed.data.ids);

    if (proposalsError) {
      throw proposalsError;
    }

    const allowedIds = new Set((proposals || []).map((proposal) => proposal.id));
    const now = new Date().toISOString();
    const errors: string[] = [];

    const notFound = parsed.data.ids.filter((id) => !allowedIds.has(id));
    for (const id of notFound) {
      errors.push(`${id}: not found in your workspace`);
    }

    const allowedIdsList = parsed.data.ids.filter((id) => allowedIds.has(id));
    const processed: string[] = [];

    if (allowedIdsList.length > 0) {
      const updatePayload =
        parsed.data.action === "approve"
          ? {
              status: "approved",
              approved_at: now,
              approved_by: profile?.full_name || userId,
              updated_at: now,
            }
          : {
              status: "archived",
              updated_at: now,
            };

      const { error } = await adminClient
        .from("proposals")
        .update(updatePayload)
        .eq("organization_id", organizationId!)
        .in("id", allowedIdsList);

      if (error) {
        throw error;
      }

      processed.push(...allowedIdsList);
    }

    return apiSuccess({
      action: parsed.data.action,
      processed: processed.length,
      processedIds: processed,
      errors,
    });
  } catch (error) {
    console.error("[proposals/bulk] failed:", error);
    return apiError("Failed to process proposals", 500);
  }
}
