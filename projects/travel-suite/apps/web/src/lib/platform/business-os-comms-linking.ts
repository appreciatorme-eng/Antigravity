import { createAdminClient } from "@/lib/supabase/admin";
import { loadCommsSequences, updateCommsSequence } from "@/lib/platform/business-comms";
import { runBusinessOsEventAutomation } from "@/lib/platform/business-os";
import { recordOrgActivityEvent } from "@/lib/platform/org-memory";

function normalizeMetadata(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function normalizeDigits(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const digits = value.replace(/\D/g, "");
    return digits.length > 6 ? digits : null;
}

function isoToMs(value: string | null): number {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function inferReplyDisposition(message: string): "positive" | "blocked" | "needs_follow_up" | "not_interested" {
    const text = message.trim().toLowerCase();
    if (!text) return "needs_follow_up";
    if (/\b(not interested|stop|unsubscribe|no thanks|don't contact|do not contact)\b/.test(text)) {
        return "not_interested";
    }
    if (/\b(can't|cannot|busy|later|next week|blocked|issue|problem|budget|expensive)\b/.test(text)) {
        return "blocked";
    }
    if (/\b(yes|ok|okay|sure|done|paid|great|works|approved|confirm)\b/.test(text)) {
        return "positive";
    }
    return "needs_follow_up";
}

export async function linkInboundReplyToCommsSequence(
    admin: ReturnType<typeof createAdminClient>,
    input: {
        orgId: string;
        waId: string;
        messageId: string;
        body: string;
    },
): Promise<{ linked: boolean; commsSequenceId: string | null; automationTriggered: boolean }> {
    const sequences = await loadCommsSequences(admin as never, input.orgId, "all");
    const candidates = sequences
        .filter((sequence) => sequence.status !== "completed")
        .map((sequence) => {
            const metadata = normalizeMetadata(sequence.metadata) ?? {};
            if (metadata.send_state !== "sent" && metadata.send_state !== "approved_pending_send") {
                return null;
            }
            if (typeof metadata.customer_replied_at === "string") return null;

            const recipientPhone = normalizeDigits(metadata.recipient_phone);
            const recipientWaId = normalizeDigits(metadata.wa_id);
            const replyTargetPhone = normalizeDigits(metadata.reply_to_phone);
            const sentVia = typeof metadata.sent_via === "string" ? metadata.sent_via : null;

            let score = 0;
            if (sequence.channel === "whatsapp") score += 70;
            else if (sequence.channel === "mixed") score += 35;

            if (sentVia === "whatsapp") score += 60;
            if (recipientPhone && recipientPhone === input.waId) score += 90;
            if (recipientWaId && recipientWaId === input.waId) score += 90;
            if (replyTargetPhone && replyTargetPhone === input.waId) score += 80;
            if (sequence.last_sent_at) score += 10;

            return {
                sequence,
                metadata,
                score,
                lastSentAtMs: isoToMs(sequence.last_sent_at),
            };
        })
        .filter((item): item is {
            sequence: Awaited<ReturnType<typeof loadCommsSequences>>[number];
            metadata: Record<string, unknown>;
            score: number;
            lastSentAtMs: number;
        } => Boolean(item))
        .sort((a, b) => b.score - a.score || b.lastSentAtMs - a.lastSentAtMs);

    const candidate = candidates[0] ?? null;
    if (!candidate) return { linked: false, commsSequenceId: null, automationTriggered: false };

    const second = candidates[1] ?? null;
    if (candidate.score < 35 || (second && candidate.score <= 45 && second.score >= candidate.score - 5)) {
        return { linked: false, commsSequenceId: null, automationTriggered: false };
    }

    const replyAt = new Date().toISOString();
    const disposition = inferReplyDisposition(input.body);
    const updated = await updateCommsSequence(admin as never, candidate.sequence.id, {
        channel: candidate.sequence.channel === "email" ? "mixed" : candidate.sequence.channel,
        metadata: {
            ...candidate.metadata,
            send_state: "replied",
            customer_replied_at: replyAt,
            customer_replied_by: "whatsapp_webhook_evolution",
            reply_summary: input.body.slice(0, 500),
            reply_disposition: disposition,
            reply_channel: "whatsapp",
            reply_source_message_id: input.messageId,
            reply_source_wa_id: input.waId,
        },
    });
    if (!updated) return { linked: false, commsSequenceId: null, automationTriggered: false };

    await recordOrgActivityEvent(admin as never, {
        org_id: input.orgId,
        actor_id: null,
        event_type: "comms_sequence_reply_recorded",
        title: "Captured WhatsApp customer reply",
        detail: input.body.slice(0, 500),
        entity_type: "comms_sequence",
        entity_id: candidate.sequence.id,
        source: "whatsapp_webhook_evolution",
        metadata: {
            channel: "whatsapp",
            source_message_id: input.messageId,
            wa_id: input.waId,
            disposition,
        },
    });

    await runBusinessOsEventAutomation(admin as never, {
        orgId: input.orgId,
        currentUserId: null,
        trigger: "comms_updated",
    });

    return { linked: true, commsSequenceId: candidate.sequence.id, automationTriggered: true };
}
