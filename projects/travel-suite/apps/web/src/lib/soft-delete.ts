import { createAdminClient } from "@/lib/supabase/admin";

type SoftDeletableTable = "trips" | "proposals" | "clients" | "invoices";

export type { SoftDeletableTable };

/**
 * Soft-delete and restore utilities.
 *
 * The `deleted_at` column is added by the canonical Supabase migration in
 * `supabase/migrations/20260411221500_add_soft_delete_columns.sql`.
 */

export async function softDelete(
  table: SoftDeletableTable,
  id: string,
  organizationId: string,
) {
  const adminClient = createAdminClient();

  // Cast to bypass generated types that don't yet include deleted_at
  const { error } = await (adminClient.from(table) as unknown as {
    update: (values: Record<string, unknown>) => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => Promise<{ error: unknown }>;
      };
    };
  })
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) throw error;
  return { success: true };
}

export async function restoreItem(
  table: SoftDeletableTable,
  id: string,
  organizationId: string,
) {
  const adminClient = createAdminClient();

  const { error } = await (adminClient.from(table) as unknown as {
    update: (values: Record<string, unknown>) => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => Promise<{ error: unknown }>;
      };
    };
  })
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) throw error;
  return { success: true };
}

export async function getDeletedItems(
  table: SoftDeletableTable,
  organizationId: string,
) {
  const adminClient = createAdminClient();

  const { data, error } = await (adminClient.from(table) as unknown as {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        not: (col: string, op: string, val: null) => {
          order: (col: string, opts: { ascending: boolean }) => Promise<{
            data: Record<string, unknown>[] | null;
            error: unknown;
          }>;
        };
      };
    };
  })
    .select("*")
    .eq("organization_id", organizationId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) throw error;
  return data;
}

export function daysUntilPermanentDeletion(deletedAt: string): number {
  const deleted = new Date(deletedAt);
  const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
}
