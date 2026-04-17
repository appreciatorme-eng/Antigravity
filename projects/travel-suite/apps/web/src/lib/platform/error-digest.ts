// Shared error digest logic — used by both the standalone cron handler and
// the automation-processor chained runner.

import { createAdminClient } from "@/lib/supabase/admin";
import { logError, logEvent } from "@/lib/observability/logger";

interface ErrorEventRow {
    id: string;
    sentry_issue_id: string;
    sentry_issue_url: string | null;
    title: string;
    level: string;
    culprit: string | null;
    event_count: number;
    user_count: number;
    first_seen_at: string;
    status: string;
}

export interface ErrorDigestResult {
    posted: boolean;
    count: number;
    skipped?: boolean;
}

const LEVEL_EMOJI: Record<string, string> = {
    fatal: "💀",
    error: "🔴",
    warning: "🟡",
    info: "🔵",
    debug: "⚪",
};
const LEVEL_ORDER = ["fatal", "error", "warning", "info", "debug"];

function sortByLevel(events: ErrorEventRow[]): ErrorEventRow[] {
    return [...events].sort((a, b) => {
        const ai = LEVEL_ORDER.indexOf(a.level);
        const bi = LEVEL_ORDER.indexOf(b.level);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}

async function postDigestToSlack(events: ErrorEventRow[]): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL ?? process.env.SLACK_OPS_WEBHOOK_URL;
    if (!webhookUrl) return;

    const sorted = sortByLevel(events);
    const fatalCount = sorted.filter((e) => e.level === "fatal").length;
    const summaryLine = fatalCount > 0
        ? `${events.length} open (${fatalCount} fatal)`
        : `${events.length} open`;

    const eventBlocks = sorted.slice(0, 15).map((e) => {
        const emoji = LEVEL_EMOJI[e.level] ?? "🔴";
        const userSuffix = e.user_count > 0 ? `, ${e.user_count} user${e.user_count === 1 ? "" : "s"}` : "";
        const link = e.sentry_issue_url ? `<${e.sentry_issue_url}|View →>` : "";
        return {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `${emoji} *[${e.level}]* ${e.title.substring(0, 80)}\n${e.event_count} event${e.event_count === 1 ? "" : "s"}${userSuffix}${link ? `   ${link}` : ""}`,
            },
        };
    });

    const overflowNote = sorted.length > 15
        ? [{ type: "context", elements: [{ type: "mrkdwn", text: `_…and ${sorted.length - 15} more. <https://tripbuilt.com/god/errors|View all →>_` }] }]
        : [];

    const body = {
        text: `📊 Weekly Error Digest — ${summaryLine}`,
        blocks: [
            { type: "header", text: { type: "plain_text", text: `📊 Weekly Error Digest — ${summaryLine}`, emoji: true } },
            { type: "divider" },
            ...eventBlocks,
            ...overflowNote,
            { type: "divider" },
            { type: "context", elements: [{ type: "mrkdwn", text: `Sent by TripBuilt cron • <https://tripbuilt.com/god/errors|Open Error Dashboard>` }] },
        ],
    };

    const res = await fetch(webhookUrl, {
        method: "POST", // eslint-disable-line no-restricted-syntax -- server-side Slack webhook call, no auth header
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(`Slack webhook responded with ${res.status}`);
    }
}

/**
 * Runs the error digest: queries open errors and posts a Slack summary.
 * Designed to be called Monday weekly. Pass skipOnEmpty=true to skip when no errors exist.
 */
export async function runErrorDigest(): Promise<ErrorDigestResult> {
    logEvent("info", "error-digest: starting run", {});

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events not yet in generated types
        const supabase = createAdminClient() as any;

        const { data, error } = await supabase
            .from("error_events")
            .select("id, sentry_issue_id, sentry_issue_url, title, level, culprit, event_count, user_count, first_seen_at, status")
            .in("status", ["open", "investigating"])
            .order("created_at", { ascending: false });

        if (error) {
            logError("error-digest: DB query failed", error, {});
            return { posted: false, count: 0 };
        }

        const events = (data ?? []) as ErrorEventRow[];

        if (events.length === 0) {
            logEvent("info", "error-digest: no open errors — skipping Slack post", {});
            return { posted: false, count: 0, skipped: true };
        }

        await postDigestToSlack(events);
        logEvent("info", "error-digest: Slack digest posted", { count: events.length });
        return { posted: true, count: events.length };
    } catch (err) {
        logError("error-digest: unexpected error", err, {});
        return { posted: false, count: 0 };
    }
}
