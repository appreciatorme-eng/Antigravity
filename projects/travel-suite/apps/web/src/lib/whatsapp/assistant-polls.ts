/**
 * TripBuilt WhatsApp Assistant — Follow-up menu prompts
 *
 * The operator assistant originally used WhatsApp polls for quick actions,
 * but Evolution/Baileys webhooks deliver poll votes as encrypted
 * `pollUpdateMessage` payloads instead of the tapped option text. This app
 * does not currently decrypt those votes, so assistant polls become dead-end
 * UI. To keep the assistant reliable, we send plain-text command menus that
 * prompt the operator to reply with explicit keywords.
 */
import "server-only";

import { guardedSendText } from "@/lib/whatsapp-evolution.server";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Poll option → command mapping
// ---------------------------------------------------------------------------

/**
 * Maps poll option display text → assistant command keyword.
 * When a poll vote arrives as a message, we look it up here.
 */
export const POLL_OPTION_TO_COMMAND: Readonly<Record<string, string>> = {
    // Main menu poll
    "📊 Dashboard overview": "stats",
    "📋 Today's trips": "today",
    "💰 Pending payments": "payments",

    // Follow-up poll options
    "💵 Revenue details": "revenue",
    "📊 Daily briefing": "brief",
    "📋 View trips": "today",
    "💰 View payments": "payments",
    "📊 View dashboard": "stats",
    "🗂️ Priority work": "work",
};

// ---------------------------------------------------------------------------
// Follow-up poll definitions (contextual per command)
// ---------------------------------------------------------------------------

interface PollDefinition {
    readonly question: string;
    readonly options: readonly string[];
}

/** Follow-up polls keyed by the command that just executed. */
const FOLLOW_UP_POLLS: Readonly<Record<string, PollDefinition>> = {
    stats: {
        question: "📋 Dive deeper into:",
        options: ["📋 Today's trips", "💰 Pending payments", "💵 Revenue details", "📊 Daily briefing"],
    },
    today: {
        question: "📋 What next?",
        options: ["💰 Pending payments", "📊 Daily briefing", "📊 Dashboard overview"],
    },
    payments: {
        question: "📋 What next?",
        options: ["📋 Today's trips", "🗂️ Priority work", "📊 Dashboard overview"],
    },
    revenue: {
        question: "📋 What next?",
        options: ["💰 Pending payments", "📋 Today's trips", "🗂️ Priority work"],
    },
    leads: {
        question: "📋 What next?",
        options: ["📋 Today's trips", "💰 Pending payments", "📊 Dashboard overview"],
    },
    brief: {
        question: "📋 What next?",
        options: ["📊 Dashboard overview", "📋 Today's trips", "💰 Pending payments", "🗂️ Priority work"],
    },
    work: {
        question: "📋 What next?",
        options: ["📋 Today's trips", "💰 Pending payments", "📊 Dashboard overview"],
    },
};

/** The welcome menu sent when assistant group is first created. */
export const WELCOME_POLL: PollDefinition = {
    question: "📋 Try it now — pick one:",
    options: ["📊 Dashboard overview", "📋 Today's trips", "💰 Pending payments", "📊 Daily briefing"],
};

/** Poll sent after a payment notification. */
export const PAYMENT_NOTIFICATION_POLL: PollDefinition = {
    question: "📋 Next?",
    options: ["💰 View payments", "📊 View dashboard"],
};

// ---------------------------------------------------------------------------
// Follow-up poll sender
// ---------------------------------------------------------------------------

/** Delay in ms between text response and follow-up prompt. */
const FOLLOW_UP_DELAY_MS = 1200;

function optionToKeyword(option: string): string {
    return (
        POLL_OPTION_TO_COMMAND[option] ??
        option
            .replace(/^[^\p{Letter}\p{Number}]+/u, "")
            .trim()
            .toLowerCase()
    );
}

function formatPrompt(question: string, options: readonly string[]): string {
    return [
        question,
        "",
        ...options.map((option) => `• ${option}  → reply \`${optionToKeyword(option)}\``),
    ].join("\n");
}

/**
 * Send a contextual follow-up prompt after a command response.
 * Runs in the background (fire-and-forget) so it doesn't block the response.
 * Returns immediately — the prompt is sent after a short delay.
 */
export function sendFollowUpPoll(
    instanceName: string,
    groupJid: string,
    completedCommand: string,
): void {
    const poll = FOLLOW_UP_POLLS[completedCommand];
    if (!poll) return;

    // Fire and forget — don't await, don't block the response
    void (async () => {
        try {
            await new Promise((r) => setTimeout(r, FOLLOW_UP_DELAY_MS));
            await guardedSendText(
                instanceName,
                groupJid,
                formatPrompt(poll.question, poll.options),
            );
        } catch (err) {
            logError("[assistant-polls] Failed to send follow-up prompt", err);
        }
    })();
}

/**
 * Send a specific menu prompt (welcome, notification follow-up, etc.).
 * Returns a promise — caller decides whether to await or fire-and-forget.
 */
export async function sendPoll(
    instanceName: string,
    groupJid: string,
    poll: PollDefinition,
    delayMs: number = FOLLOW_UP_DELAY_MS,
): Promise<void> {
    if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
    }
    await guardedSendText(
        instanceName,
        groupJid,
        formatPrompt(poll.question, poll.options),
    );
}
