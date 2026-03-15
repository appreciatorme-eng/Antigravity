import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const AvailabilityQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const AvailabilityCreateSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(240).optional(),
});


export async function GET(request: Request) {
  try {
    const adminResult = await requireAdmin(request, { requireOrganization: true });
    if (!adminResult.ok) {
      return adminResult.response;
    }
    if (!adminResult.organizationId) {
      return apiError("Admin organization not configured", 400);
    }
    const organizationId = adminResult.organizationId;

    const rateLimit = await enforceRateLimit({
      identifier: adminResult.userId,
      limit: 30,
      windowMs: 60_000,
      prefix: "api:availability:get",
    });
    if (!rateLimit.success) {
      return apiError("Rate limit exceeded", 429);
    }

    const url = new URL(request.url);
    const parsed = AvailabilityQuerySchema.safeParse({
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    });

    if (!parsed.success) {
      return apiError("Invalid availability query", 400, {
        details: parsed.error.flatten(),
      });
    }

    const admin = adminResult.adminClient;
    const { data, error } = await admin
      .from("operator_unavailability")
      .select("id, start_date, end_date, reason, created_at")
      .eq("organization_id", organizationId)
      .lte("start_date", parsed.data.to)
      .gte("end_date", parsed.data.from)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("[availability] failed to load blocked dates:", error);
      return apiError("Failed to load blocked dates", 500);
    }

    const rows = data ?? [];
    return apiSuccess(
      rows.map((row) => ({
        id: row.id,
        startDate: row.start_date,
        endDate: row.end_date,
        reason: row.reason,
        createdAt: row.created_at,
      })),
    );
  } catch (error) {
    console.error("[availability] unexpected GET error:", error);
    return apiError("Failed to load blocked dates", 500);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request, { requireOrganization: true });
    if (!admin.ok) {
      return admin.response;
    }
    if (!admin.organizationId) {
      return apiError("Admin organization not configured", 400);
    }
    const organizationId = admin.organizationId;

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: 30,
      windowMs: 60_000,
      prefix: "api:availability:post",
    });
    if (!rateLimit.success) {
      return apiError("Rate limit exceeded", 429);
    }

    if (!passesMutationCsrfGuard(request)) {
      return apiError("CSRF validation failed for admin mutation", 403);
    }

    const parsed = AvailabilityCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("Invalid blocked dates payload", 400, {
        details: parsed.error.flatten(),
      });
    }

    if (parsed.data.end_date < parsed.data.start_date) {
      return apiError("End date must be on or after the start date", 400);
    }

    const { data, error } = await admin.adminClient
      .from("operator_unavailability")
      .insert({
        organization_id: organizationId,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date,
        reason: parsed.data.reason?.trim() || null,
      })
      .select("id, start_date, end_date, reason, created_at")
      .single();

    if (error) {
      console.error("[availability] failed to create blocked dates:", error);
      return apiError("Failed to block dates", 500);
    }

    return apiSuccess({
      id: data.id,
      startDate: data.start_date,
      endDate: data.end_date,
      reason: data.reason,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error("[availability] unexpected POST error:", error);
    return apiError("Failed to block dates", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin(request, { requireOrganization: true });
    if (!admin.ok) {
      return admin.response;
    }
    if (!admin.organizationId) {
      return apiError("Admin organization not configured", 400);
    }
    const organizationId = admin.organizationId;

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: 30,
      windowMs: 60_000,
      prefix: "api:availability:delete",
    });
    if (!rateLimit.success) {
      return apiError("Rate limit exceeded", 429);
    }

    if (!passesMutationCsrfGuard(request)) {
      return apiError("CSRF validation failed for admin mutation", 403);
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return apiError("Blocked date id is required", 400);
    }

    const { error } = await admin.adminClient
      .from("operator_unavailability")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("[availability] failed to delete blocked dates:", error);
      return apiError("Failed to unblock dates", 500);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("[availability] unexpected DELETE error:", error);
    return apiError("Failed to unblock dates", 500);
  }
}
