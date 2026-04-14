// POST /api/cron/error-digest — weekly Slack digest of open/investigating errors.
// Scheduled: 0 3 * * 1 (Monday 03:00 UTC = 08:30 IST)
// Auth: x-cron-secret header (same pattern as other cron handlers)

import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError, logEvent } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Slack digest post
// ---------------------------------------------------------------------------

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
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    const sorted = sortByLevel(events);
    const fatalCount = sorted.filter((e) => e.level === "fatal").length;
    const summaryLine = fatalCount > 0
        ? `${events.length} open (${fatalCount} fatal)`
        : `${events.length} open`;

    // Build one section block per error (capped at 15 to stay within Slack block limits)
    const eventBlocks = sorted.slice(0, 15).map((e) => {
        const emoji = LEVEL_EMOJI[e.level] ?? "🔴";
        const userSuffix = e.user_count > 0 ? `, ${e.user_count} user${e.user_count === 1 ? "" : "s"}` : "";
        const link = e.sentry_issue_url
            ? `<${e.sentry_issue_url}|View →>`
            : "";

        return {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `${emoji} *[${e.level}]* ${e.title.substring(0, 80)}\n${e.event_count} event${e.event_count === 1 ? "" : "s"}${userSuffix}${link ? `   ${link}` : ""}`,
            },
        };
    });

    const overflowNote = sorted.length > 15
        ? [
              {
                  type: "context",
                  elements: [{ type: "mrkdwn", text: `_…and ${sorted.length - 15} more. <https://tripbuilt.com/god/errors|View all →>_` }],
              },
          ]
        : [];

    const body = {
        text: `📊 Weekly Error Digest — ${summaryLine}`,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `📊 Weekly Error Digest — ${summaryLine}`,
                    emoji: true,
                },
            },
            { type: "divider" },
            ...eventBlocks,
            ...overflowNote,
            { type: "divider" },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `Sent by TripBuilt cron • <https://tripbuilt.com/god/errors|Open Error Dashboard>`,
                    },
                ],
            },
        ],
    };

    const res = await fetch(webhookUrl, {
        // eslint-disable-next-line no-restricted-syntax -- server-side Slack webhook call, no auth header
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(`Slack webhook responded with ${res.status}`);
    }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
    const cronAuth = await authorizeCronRequest(request, {
        secretHeaderNames: ["x-cron-secret"],
        replayWindowMs: 10 * 60 * 1000,
    });

    if (!cronAuth.authorized) {
        return NextResponse.json({ error: cronAuth.reason }, { status: cronAuth.status });
    }

    logEvent("info", "cron/error-digest: starting weekly digest run", {});

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events not yet in generated types
        const supabase = createAdminClient() as any;

        const { data, error } = await supabase
            .from("error_events")
            .select("id, sentry_issue_id, sentry_issue_url, title, level, culprit, event_count, user_count, first_seen_at, status")
            .in("status", ["open", "investigating"])
            .order("created_at", { ascending: false });

        if (error) {
            logError("cron/error-digest: DB query failed", error, {});
            return NextResponse.json({ error: "DB query failed" }, { status: 500 });
        }

        const events = (data ?? []) as ErrorEventRow[];

        if (events.length === 0) {
            logEvent("info", "cron/error-digest: no open errors — skipping Slack post", {});
            return NextResponse.json({ ok: true, posted: false, count: 0 });
        }

        await postDigestToSlack(events);

        logEvent("info", "cron/error-digest: Slack digest posted", { count: events.length });
        return NextResponse.json({ ok: true, posted: true, count: events.length });
    } catch (err) {
        logError("cron/error-digest: unexpected error", err, {});
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
