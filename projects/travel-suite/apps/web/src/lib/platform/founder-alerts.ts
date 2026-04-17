// Real-time WhatsApp alerts to the founder for critical business events.
// Gated on FOUNDER_WHATSAPP_NUMBER env var — silent no-op if not set.

import { sendWhatsAppText } from "@/lib/whatsapp.server";
import { logError, logEvent } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

export interface FounderAlertContext {
  approvalsSurfaced: number;
  commitmentsBreached: number;
  collectionsAutoClosed: number;
  sendQueueEscalated: number;
  noResponseEscalated: number;
  promiseEscalations: number;
  priorityCount: number;
  founderDigestHeadline: string;
}

export async function sendFounderDailyAlert(ctx: FounderAlertContext): Promise<boolean> {
  const phone = process.env.FOUNDER_WHATSAPP_NUMBER?.trim();
  if (!phone) return false;

  const critical = ctx.commitmentsBreached + ctx.promiseEscalations + ctx.noResponseEscalated;
  const actionable = ctx.approvalsSurfaced + ctx.sendQueueEscalated;

  const lines: string[] = [
    `📊 *Daily Ops Brief*`,
    ctx.founderDigestHeadline,
    ``,
  ];

  if (critical > 0) {
    lines.push(`🚨 *Needs attention*`);
    if (ctx.commitmentsBreached > 0) lines.push(`• ${ctx.commitmentsBreached} commitment breach${ctx.commitmentsBreached > 1 ? "es" : ""}`);
    if (ctx.promiseEscalations > 0) lines.push(`• ${ctx.promiseEscalations} promise escalation${ctx.promiseEscalations > 1 ? "s" : ""}`);
    if (ctx.noResponseEscalated > 0) lines.push(`• ${ctx.noResponseEscalated} no-response escalation${ctx.noResponseEscalated > 1 ? "s" : ""}`);
    lines.push(``);
  }

  if (actionable > 0) {
    lines.push(`✅ *Awaiting your action*`);
    if (ctx.approvalsSurfaced > 0) lines.push(`• ${ctx.approvalsSurfaced} approval${ctx.approvalsSurfaced > 1 ? "s" : ""} to review`);
    if (ctx.sendQueueEscalated > 0) lines.push(`• ${ctx.sendQueueEscalated} queued message${ctx.sendQueueEscalated > 1 ? "s" : ""} escalated`);
    lines.push(``);
  }

  if (ctx.priorityCount > 0) {
    lines.push(`📋 ${ctx.priorityCount} priority item${ctx.priorityCount > 1 ? "s" : ""} in ops queue`);
  }

  lines.push(`👉 tripbuilt.com/god/autopilot`);

  try {
    const result = await sendWhatsAppText(phone, lines.join("\n"));
    if (!result.success) {
      logError("[founder-alerts] WhatsApp send failed", result.error, {});
    } else {
      logEvent("info", "[founder-alerts] Daily brief sent to founder", { critical, actionable });
    }
    return result.success;
  } catch (err) {
    logError("[founder-alerts] Unexpected error sending founder alert", err, {});
    return false;
  }
}

/**
 * Sends an immediate critical alert (not daily digest).
 * Use for: churn detection, fatal errors, payment failures above threshold.
 */
export async function sendFounderCriticalAlert(message: string): Promise<boolean> {
  const phone = process.env.FOUNDER_WHATSAPP_NUMBER?.trim();
  if (!phone) return false;

  try {
    const result = await sendWhatsAppText(phone, `🚨 *TripBuilt Alert*\n\n${message}`);
    return result.success;
  } catch (err) {
    logError("[founder-alerts] Critical alert send failed", err, {});
    return false;
  }
}

export async function sendFounderCriticalAlertOnce(input: {
  dedupeKey: string;
  message: string;
  minIntervalMinutes?: number;
  metadata?: Record<string, unknown>;
}): Promise<{ sent: boolean; skipped: boolean }> {
  const dedupeKey = input.dedupeKey.trim();
  if (!dedupeKey) {
    const sent = await sendFounderCriticalAlert(input.message);
    return { sent, skipped: false };
  }

  const minIntervalMinutes = Math.max(1, Math.floor(input.minIntervalMinutes ?? 180));
  const thresholdIso = new Date(Date.now() - (minIntervalMinutes * 60_000)).toISOString();
  const admin = createAdminClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON path filters are not captured in generated types
    const db = admin as any;
    const { data: existing } = await db
      .from("platform_audit_log")
      .select("id, created_at")
      .eq("action", "Founder: Critical alert")
      .eq("category", "automation")
      .gte("created_at", thresholdIso)
      .filter("details->>dedupe_key", "eq", dedupeKey)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      return { sent: false, skipped: true };
    }
  } catch (err) {
    logError("[founder-alerts] Failed to check critical-alert dedupe state", err, { dedupeKey });
  }

  const sent = await sendFounderCriticalAlert(input.message);
  if (!sent) return { sent: false, skipped: false };

  try {
    await admin
      .from("platform_audit_log")
      .insert({
        actor_id: null,
        action: "Founder: Critical alert",
        category: "automation",
        details: {
          dedupe_key: dedupeKey,
          min_interval_minutes: minIntervalMinutes,
          ...(input.metadata ?? {}),
        } as Json,
      } as never);
    logEvent("info", "[founder-alerts] Critical alert sent", { dedupeKey });
  } catch (err) {
    logError("[founder-alerts] Failed to persist critical-alert audit log", err, { dedupeKey });
  }

  return { sent: true, skipped: false };
}
