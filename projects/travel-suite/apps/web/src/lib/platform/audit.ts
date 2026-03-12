// Platform audit logger — writes to platform_audit_log table.
// All super_admin actions must call this for an immutable audit trail.

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

export type AuditCategory =
  | "kill_switch"
  | "org_management"
  | "announcement"
  | "settings"
  | "support"
  | "cost_override";

export async function logPlatformAction(
  actorId: string,
  action: string,
  category: AuditCategory,
  details: Record<string, unknown> = {},
  ipAddress?: string
): Promise<void> {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("platform_audit_log").insert({
      actor_id: actorId,
      action,
      category,
      details: details as Json,
      ip_address: ipAddress ?? null,
    });
  } catch (err) {
    console.error("[platform-audit] Failed to write audit log:", err);
  }
}

export async function logPlatformActionWithTarget(
  actorId: string,
  action: string,
  category: AuditCategory,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
  ipAddress?: string
): Promise<void> {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("platform_audit_log").insert({
      actor_id: actorId,
      action,
      category,
      target_type: targetType,
      target_id: targetId,
      details: details as Json,
      ip_address: ipAddress ?? null,
    });
  } catch (err) {
    console.error("[platform-audit] Failed to write audit log:", err);
  }
}

export function getClientIpFromRequest(
  request: Request & { headers: { get(name: string): string | null } }
): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first?.trim()) return first.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
