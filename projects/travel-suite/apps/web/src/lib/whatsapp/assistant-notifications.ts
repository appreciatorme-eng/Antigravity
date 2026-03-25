/**
 * TripBuilt WhatsApp Assistant — Operator Notifications
 *
 * Sends notifications to the operator's private "🤖 TripBuilt Assistant" WhatsApp group.
 * Uses the already-connected Evolution API session — no extra numbers or Meta API needed.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEvolutionText } from "@/lib/whatsapp-evolution.server";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Core: send notification to operator's assistant group
// ---------------------------------------------------------------------------

/**
 * Send a notification message to the operator's TripBuilt Assistant WhatsApp group.
 * Best-effort: errors are logged but never thrown to the caller.
 */
export async function notifyOperator(
    orgId: string,
    message: string,
): Promise<void> {
    try {
        const admin = createAdminClient();
        const { data: rawConn } = await admin
            .from("whatsapp_connections")
            .select("instance_name, session_name, assistant_group_jid")
            .eq("organization_id", orgId)
            .eq("status", "connected")
            .maybeSingle();
        const conn = rawConn as { instance_name?: string; session_name?: string; assistant_group_jid?: string } | null;

        const instanceName = conn?.instance_name ?? conn?.session_name;
        const groupJid = conn?.assistant_group_jid;

        if (!instanceName || !groupJid) return;

        await sendEvolutionText(instanceName, groupJid, message);
    } catch (err) {
        logError("[assistant-notifications] Failed to notify operator", err);
    }
}

// ---------------------------------------------------------------------------
// Pre-formatted notification helpers
// ---------------------------------------------------------------------------

export async function notifyNewLead(
    orgId: string,
    phone: string,
    preview: string,
): Promise<void> {
    const masked = phone.length > 6
        ? phone.slice(0, -4).replace(/\d/g, "•") + phone.slice(-4)
        : phone;
    await notifyOperator(orgId, [
        `🆕 *New Lead*`,
        `📱 ${masked}`,
        `💬 "${preview.slice(0, 100)}"`,
        "",
        "Open TripBuilt inbox to respond.",
    ].join("\n"));
}

export async function notifyPaymentReceived(
    orgId: string,
    clientName: string,
    amount: string,
): Promise<void> {
    await notifyOperator(orgId, [
        `💰 *Payment Received*`,
        `👤 ${clientName}`,
        `💵 ${amount}`,
        "",
        "Payment confirmed and recorded.",
    ].join("\n"));
}

export async function notifyAutomationSent(
    orgId: string,
    ruleName: string,
    phone: string,
): Promise<void> {
    const masked = phone.length > 6
        ? phone.slice(0, -4).replace(/\d/g, "•") + phone.slice(-4)
        : phone;
    await notifyOperator(orgId, [
        `🤖 *Automation Triggered*`,
        `⚡ ${ruleName}`,
        `📱 Sent to ${masked}`,
    ].join("\n"));
}
