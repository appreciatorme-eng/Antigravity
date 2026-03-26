/**
 * TripBuilt WhatsApp Assistant — Poll Definitions & Follow-up Logic
 *
 * Polls are the primary interactive primitive since Baileys buttons are
 * deprecated by Meta. Each command response can trigger a contextual
 * follow-up poll so the operator stays in flow without typing.
 *
 * Poll vote responses arrive as regular messages in `messages.upsert`
 * with the option text as the message body. The POLL_OPTION_TO_COMMAND
 * map resolves these back to command keywords.
 */
import "server-only";

import { guardedSendPoll } from "@/lib/whatsapp-evolution.server";
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
    "🆕 Recent leads": "leads",

    // Follow-up poll options
    "💵 Revenue details": "revenue",
    "📊 Daily briefing": "brief",
    "📋 View trips": "today",
    "💰 View payments": "payments",
    "🆕 View leads": "leads",
    "📊 View dashboard": "stats",
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
        options: ["📋 Today's trips", "💰 Pending payments", "💵 Revenue details", "🆕 Recent leads"],
    },
    today: {
        question: "📋 What next?",
        options: ["💰 Pending payments", "🆕 Recent leads", "📊 Dashboard overview"],
    },
    payments: {
        question: "📋 What next?",
        options: ["📋 Today's trips", "💵 Revenue details", "📊 Dashboard overview"],
    },
    revenue: {
        question: "📋 What next?",
        options: ["💰 Pending payments", "📋 Today's trips", "📊 Dashboard overview"],
    },
    leads: {
        question: "📋 What next?",
        options: ["📋 Today's trips", "💰 Pending payments", "📊 Dashboard overview"],
    },
    brief: {
        question: "📋 What next?",
        options: ["📊 Dashboard overview", "📋 Today's trips", "💰 Pending payments", "🆕 Recent leads"],
    },
};

/** The welcome poll sent when assistant group is first created. */
export const WELCOME_POLL: PollDefinition = {
    question: "📋 Try it now — pick one:",
    options: ["📊 Dashboard overview", "📋 Today's trips", "💰 Pending payments", "🆕 Recent leads"],
};

/** Poll sent after a new lead notification. */
export const LEAD_NOTIFICATION_POLL: PollDefinition = {
    question: "📋 What do you want to do?",
    options: ["🆕 View leads", "📊 View dashboard"],
};

/** Poll sent after a payment notification. */
export const PAYMENT_NOTIFICATION_POLL: PollDefinition = {
    question: "📋 Next?",
    options: ["💰 View payments", "📊 View dashboard"],
};

// ---------------------------------------------------------------------------
// Follow-up poll sender
// ---------------------------------------------------------------------------

/** Delay in ms between text response and follow-up poll. */
const FOLLOW_UP_DELAY_MS = 1200;

/**
 * Send a contextual follow-up poll after a command response.
 * Runs in the background (fire-and-forget) so it doesn't block the response.
 * Returns immediately — the poll is sent after a short delay.
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
            await guardedSendPoll(
                instanceName,
                groupJid,
                poll.question,
                poll.options,
                1,
            );
        } catch (err) {
            logError("[assistant-polls] Failed to send follow-up poll", err);
        }
    })();
}

/**
 * Send a specific poll (welcome, notification follow-up, etc.).
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
    await guardedSendPoll(
        instanceName,
        groupJid,
        poll.question,
        poll.options,
        1,
    );
}
