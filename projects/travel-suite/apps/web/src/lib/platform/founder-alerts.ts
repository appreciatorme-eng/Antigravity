// Real-time WhatsApp alerts to the founder for critical business events.
// Gated on FOUNDER_WHATSAPP_NUMBER env var — silent no-op if not set.

import { sendWhatsAppText } from "@/lib/whatsapp.server";
import { logError, logEvent } from "@/lib/observability/logger";

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
