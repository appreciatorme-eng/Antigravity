/* ------------------------------------------------------------------
 * POST /api/admin/trash/restore  { table, id }
 * Restores a soft-deleted item by clearing deleted_at
 * ------------------------------------------------------------------ */

import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";
import { restoreItem, type SoftDeletableTable } from "@/lib/soft-delete";

const VALID_TABLES = new Set<SoftDeletableTable>([
  "trips",
  "proposals",
  "clients",
  "invoices",
]);

function isValidTable(value: string): value is SoftDeletableTable {
  return VALID_TABLES.has(value as SoftDeletableTable);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;
    const { organizationId } = authResult;

    if (!organizationId) {
      return apiError("Organization not configured", 400);
    }

    const body = await request.json();
    const { table, id } = body as { table?: string; id?: string };

    if (!table || !isValidTable(table)) {
      return apiError(
        "Invalid table. Must be one of: trips, proposals, clients, invoices",
        400,
      );
    }

    if (!id || typeof id !== "string") {
      return apiError("Missing or invalid id", 400);
    }

    await restoreItem(table, id, organizationId);

    return apiSuccess({ restored: true, table, id });
  } catch (error) {
    logError("[admin/trash/restore] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
