/**
 * TripBuilt WhatsApp Assistant — Operator Notifications
 *
 * Sends notifications to the operator's private "🤖 TripBuilt Assistant" WhatsApp group.
 * Uses the already-connected Evolution API session — no extra numbers or Meta API needed.
 *
 * Each notification can optionally include a follow-up poll for quick actions.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { guardedSendText } from "@/lib/whatsapp-evolution.server";
import { logError } from "@/lib/observability/logger";
import { sendPoll, PAYMENT_NOTIFICATION_POLL } from "./assistant-polls";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationTarget {
    readonly instanceName: string;
    readonly groupJid: string;
}

// ---------------------------------------------------------------------------
// Core: resolve operator's assistant group
// ---------------------------------------------------------------------------

async function resolveTarget(orgId: string): Promise<NotificationTarget | null> {
    const admin = createAdminClient();
    const { data: rawConn } = await admin
        .from("whatsapp_connections")
        .select("instance_name, session_name, assistant_group_jid")
        .eq("organization_id", orgId)
        .eq("status", "connected")
        .maybeSingle();
    const conn = rawConn as {
        instance_name?: string;
        session_name?: string;
        assistant_group_jid?: string;
    } | null;

    const instanceName = conn?.instance_name ?? conn?.session_name;
    const groupJid = conn?.assistant_group_jid;

    if (!instanceName || !groupJid) return null;
    return { instanceName, groupJid };
}

// ---------------------------------------------------------------------------
// Core: send notification to operator's assistant group
// ---------------------------------------------------------------------------

/**
 * Send a notification message to the operator's TripBuilt Assistant WhatsApp group.
 * Best-effort: errors are logged but never thrown to the caller.
 * Returns the target info so callers can send follow-up polls.
 */
export async function notifyOperator(
    orgId: string,
    message: string,
): Promise<NotificationTarget | null> {
    try {
        const target = await resolveTarget(orgId);
        if (!target) return null;

        await guardedSendText(target.instanceName, target.groupJid, message);
        return target;
    } catch (err) {
        logError("[assistant-notifications] Failed to notify operator", err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Pre-formatted notification helpers
// ---------------------------------------------------------------------------

export async function notifyNewLead(
    _orgId: string,
    _phone: string,
    _preview: string,
): Promise<void> {
    void [_orgId, _phone, _preview];
    return;
}

export async function notifyPaymentReceived(
    orgId: string,
    clientName: string,
    amount: string,
): Promise<void> {
    const target = await notifyOperator(orgId, [
        `💰 *Payment Received*`,
        `👤 ${clientName}`,
        `💵 ${amount}`,
        "",
        "Payment confirmed and recorded.",
    ].join("\n"));

    if (target) {
        void sendPoll(target.instanceName, target.groupJid, PAYMENT_NOTIFICATION_POLL).catch((err) => {
            logError("[assistant-notifications] Failed to send payment poll", err);
        });
    }
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

export async function notifyCustomerAssistantHandoff(
    _orgId: string,
    _phone: string,
    _preview: string,
    _intakeUrl: string | null,
): Promise<void> {
    void [_orgId, _phone, _preview, _intakeUrl];
    return;
}
