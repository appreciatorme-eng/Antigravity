import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";

const bulkSchema = z.object({
  action: z.enum(["approve", "archive"]),
  ids: z.array(z.string().uuid()).min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json().catch(() => null);
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid bulk proposal payload", 400);
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.organization_id) {
      return apiError("Organization not found", 404);
    }

    const { data: proposals, error: proposalsError } = await admin
      .from("proposals")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .in("id", parsed.data.ids);

    if (proposalsError) {
      throw proposalsError;
    }

    const allowedIds = new Set((proposals || []).map((proposal) => proposal.id));
    const now = new Date().toISOString();
    const processed: string[] = [];
    const errors: string[] = [];

    for (const proposalId of parsed.data.ids) {
      if (!allowedIds.has(proposalId)) {
        errors.push(`${proposalId}: not found in your workspace`);
        continue;
      }

      const updatePayload =
        parsed.data.action === "approve"
          ? {
              status: "approved",
              approved_at: now,
              approved_by: profile.full_name || user.email || user.id,
              updated_at: now,
            }
          : {
              status: "archived",
              updated_at: now,
            };

      const { error } = await admin
        .from("proposals")
        .update(updatePayload)
        .eq("organization_id", profile.organization_id)
        .eq("id", proposalId);

      if (error) {
        errors.push(`${proposalId}: ${safeErrorMessage(error, "Request failed")}`);
        continue;
      }

      processed.push(proposalId);
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
