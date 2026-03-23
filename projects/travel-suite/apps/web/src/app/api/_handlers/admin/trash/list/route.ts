/* ------------------------------------------------------------------
 * GET /api/admin/trash/list?table=trips|proposals|clients|invoices
 * Returns soft-deleted items for the authenticated user's org
 * ------------------------------------------------------------------ */

import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";
import {
  getDeletedItems,
  daysUntilPermanentDeletion,
  type SoftDeletableTable,
} from "@/lib/soft-delete";

const VALID_TABLES = new Set<SoftDeletableTable>([
  "trips",
  "proposals",
  "clients",
  "invoices",
]);

function isValidTable(value: string): value is SoftDeletableTable {
  return VALID_TABLES.has(value as SoftDeletableTable);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;
    const { organizationId } = authResult;

    if (!organizationId) {
      return apiError("Organization not configured", 400);
    }

    const url = new URL(request.url);
    const table = url.searchParams.get("table") ?? "";

    if (!isValidTable(table)) {
      return apiError(
        "Invalid table. Must be one of: trips, proposals, clients, invoices",
        400,
      );
    }

    const items = await getDeletedItems(table, organizationId);

    const itemsWithDaysRemaining = (items ?? []).map((item) => ({
      ...item,
      days_remaining: daysUntilPermanentDeletion(
        (item as Record<string, unknown>).deleted_at as string,
      ),
    }));

    return apiSuccess({ items: itemsWithDaysRemaining, table });
  } catch (error) {
    logError("[admin/trash/list] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
