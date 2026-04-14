/**
 * Sentry Internal Integration Webhook Handler
 *
 * Receives issue lifecycle events from Sentry and:
 *  1. Verifies a shared secret token passed in the URL query param (?token=...)
 *  2. Upserts / updates a row in `error_events` for permanent storage + resolution tracking
 *  3. Posts a rich Block Kit message to Slack via Incoming Webhook
 *
 * Supported actions:
 *  - issue.created  → upsert open row + Slack alert (🔁 Regression alert if was resolved)
 *  - issue.resolved → set status='resolved' silently (no Slack noise)
 *  - issue.ignored  → set status='wont_fix' silently
 *
 * Both DB write and Slack POST are fire-and-forget so Sentry receives a
 * <200ms response (Sentry's webhook timeout is 3 seconds).
 *
 * Setup:
 *  - SENTRY_WEBHOOK_SECRET  — random hex token (in the webhook URL as ?token=<value>)
 *  - SLACK_WEBHOOK_URL      — Slack Incoming Webhook URL from Slack App settings
 *  Webhook URL in Sentry: https://tripbuilt.com/api/webhooks/sentry?token=<SENTRY_WEBHOOK_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError, logEvent, getRequestId, getRequestContext } from "@/lib/observability/logger";
import type { LogContext } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SentryIssue {
    id: string;
    title: string;
    culprit?: string;
    status: string;
    level: string;
    project?: { name?: string; slug?: string };
    permalink?: string;
    firstSeen?: string;
    lastSeen?: string;
    count?: string | number;
    userCount?: number;
    isUnhandled?: boolean;
    tags?: Array<{ key: string; value: string }>;
}

interface SentryWebhookPayload {
    action: string;
    data?: { issue?: SentryIssue };
    actor?: { type?: string; name?: string };
}

// ---------------------------------------------------------------------------
// Token verification
// ---------------------------------------------------------------------------

function verifyToken(incoming: string, expected: string): boolean {
    if (!incoming || !expected) return false;
    try {
        // Pad to same length to avoid length-based timing leaks
        const a = Buffer.from(incoming.padEnd(64, "\0"), "utf8");
        const b = Buffer.from(expected.padEnd(64, "\0"), "utf8");
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b) && incoming.length === expected.length;
    } catch {
        return false;
    }
}

// ---------------------------------------------------------------------------
// Slack notification
// ---------------------------------------------------------------------------

const LEVEL_EMOJI: Record<string, string> = {
    fatal: "💀",
    error: "🔴",
    warning: "🟡",
    info: "🔵",
    debug: "⚪",
};

async function postToSlack(issue: SentryIssue, isRegression: boolean): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return; // Slack not configured — silently skip

    const emoji = isRegression ? "🔁" : (LEVEL_EMOJI[issue.level] ?? "🔴");
    const count = issue.count ?? 1;
    const userCount = issue.userCount ?? 0;
    const project = issue.project?.name ?? "tripbuilt";

    const headingPrefix = isRegression
        ? "🔁 Regression"
        : `${LEVEL_EMOJI[issue.level] ?? "🔴"} New ${issue.level.charAt(0).toUpperCase() + issue.level.slice(1)}`;

    const body = {
        text: `${emoji} ${isRegression ? "Regression" : "New Sentry Issue"}: ${issue.title}`,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `${headingPrefix}: ${issue.title.substring(0, 90)}`,
                    emoji: true,
                },
            },
            ...(isRegression
                ? [
                      {
                          type: "section",
                          text: {
                              type: "mrkdwn",
                              text: ":warning: This issue was previously resolved and has *re-opened*.",
                          },
                      },
                  ]
                : []),
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Project:*\n${project}`,
                    },
                    {
                        type: "mrkdwn",
                        text: `*Culprit:*\n${issue.culprit ?? "unknown"}`,
                    },
                ],
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Events:*\n${count}`,
                    },
                    {
                        type: "mrkdwn",
                        text: `*Users affected:*\n${userCount}`,
                    },
                ],
            },
            ...(issue.permalink
                ? [
                      {
                          type: "actions",
                          elements: [
                              {
                                  type: "button",
                                  text: { type: "plain_text", text: "View in Sentry →", emoji: false },
                                  url: issue.permalink,
                                  style: isRegression ? "danger" : "primary",
                              },
                          ],
                      },
                  ]
                : []),
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `Status: *${issue.status}* • First seen: ${issue.firstSeen ? new Date(issue.firstSeen).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "now"} IST`,
                    },
                ],
            },
        ],
    };

    const response = await fetch(webhookUrl, {
        // eslint-disable-next-line no-restricted-syntax -- server-side Slack webhook call, no auth header
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Slack webhook responded with ${response.status}`);
    }
}

// ---------------------------------------------------------------------------
// DB persistence
// ---------------------------------------------------------------------------

/**
 * Upserts the error event and returns whether this is a regression
 * (the issue was previously in 'resolved' status and is now re-created).
 */
async function persistErrorEvent(issue: SentryIssue, ctx: LogContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events table not yet in generated types
    const supabase = createAdminClient() as any;

    // Check current status before upserting so we can detect regressions
    const { data: existing } = await supabase
        .from("error_events")
        .select("status")
        .eq("sentry_issue_id", issue.id)
        .maybeSingle();

    const wasResolved = existing?.status === "resolved";

    const { error } = await supabase.from("error_events").upsert(
        {
            sentry_issue_id: issue.id,
            sentry_issue_url: issue.permalink ?? null,
            title: issue.title,
            level: issue.level ?? "error",
            culprit: issue.culprit ?? null,
            environment: "production",
            event_count: Number(issue.count ?? 1),
            user_count: issue.userCount ?? 0,
            first_seen_at: issue.firstSeen ?? new Date().toISOString(),
            context: {},
            status: "open",
            // Clear resolution fields when re-opening
            resolved_at: null,
            resolution_notes: wasResolved ? null : undefined,
        },
        {
            onConflict: "sentry_issue_id",
            ignoreDuplicates: false,
        }
    );

    if (error) {
        throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    logEvent("info", wasResolved ? "Sentry regression: issue re-opened" : "Sentry error event persisted", {
        ...ctx,
        sentry_issue_id: issue.id,
        is_regression: wasResolved,
    });

    return wasResolved;
}

async function autoResolveEvent(sentryIssueId: string, ctx: LogContext): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events table not yet in generated types
    const supabase = createAdminClient() as any;

    const { error } = await supabase
        .from("error_events")
        .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
        })
        .eq("sentry_issue_id", sentryIssueId);

    if (error) {
        throw new Error(`Supabase update failed: ${error.message}`);
    }

    logEvent("info", "Sentry issue auto-resolved", { ...ctx, sentry_issue_id: sentryIssueId });
}

async function autoIgnoreEvent(sentryIssueId: string, ctx: LogContext): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events table not yet in generated types
    const supabase = createAdminClient() as any;

    const { error } = await supabase
        .from("error_events")
        .update({ status: "wont_fix" })
        .eq("sentry_issue_id", sentryIssueId);

    if (error) {
        throw new Error(`Supabase update failed: ${error.message}`);
    }

    logEvent("info", "Sentry issue auto-ignored", { ...ctx, sentry_issue_id: sentryIssueId });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
    const requestId = getRequestId(request);
    const ctx = getRequestContext(request, requestId);

    // Verify shared secret token from query param
    const incomingToken = request.nextUrl.searchParams.get("token") ?? "";
    const expectedToken = process.env.SENTRY_WEBHOOK_SECRET ?? "";

    if (!verifyToken(incomingToken, expectedToken)) {
        logEvent("warn", "Sentry webhook: invalid or missing token", ctx);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();

    let payload: SentryWebhookPayload;
    try {
        payload = JSON.parse(rawBody) as SentryWebhookPayload;
    } catch {
        logEvent("warn", "Sentry webhook: invalid JSON body", ctx);
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const { action, data } = payload;
    const issue = data?.issue;

    // Acknowledge immediately for unknown actions
    if (!issue) {
        return NextResponse.json({ ok: true });
    }

    // ── resolved: sync status to DB silently ──────────────────────────────
    if (action === "resolved") {
        logEvent("info", "Sentry issue.resolved received", {
            ...ctx,
            sentry_issue_id: issue.id,
        });
        autoResolveEvent(issue.id, ctx).catch((err) =>
            logError("Failed to auto-resolve Sentry issue in DB", err, ctx)
        );
        return NextResponse.json({ ok: true });
    }

    // ── ignored: sync status to DB silently ───────────────────────────────
    if (action === "ignored") {
        logEvent("info", "Sentry issue.ignored received", {
            ...ctx,
            sentry_issue_id: issue.id,
        });
        autoIgnoreEvent(issue.id, ctx).catch((err) =>
            logError("Failed to auto-ignore Sentry issue in DB", err, ctx)
        );
        return NextResponse.json({ ok: true });
    }

    // ── created: upsert + Slack alert (regression-aware) ──────────────────
    if (action === "created") {
        logEvent("info", "Sentry issue.created received", {
            ...ctx,
            sentry_issue_id: issue.id,
            sentry_level: issue.level,
        });

        // Fire-and-forget chain: persist first (to detect regression), then Slack
        persistErrorEvent(issue, ctx)
            .then((isRegression) =>
                postToSlack(issue, isRegression).catch((err) =>
                    logError("Failed to post Sentry event to Slack", err, ctx)
                )
            )
            .catch((err) =>
                logError("Failed to persist Sentry error event to DB", err, ctx)
            );

        return NextResponse.json({ ok: true });
    }

    // All other actions (assigned, seen, etc.) — acknowledge silently
    return NextResponse.json({ ok: true });
}
