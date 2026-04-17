// Slack Approval Poller — reads ops channel for 'close <id-prefix>' commands and closes work items.
// Requires SLACK_BOT_TOKEN + SLACK_OPS_CHANNEL_ID env vars — silent no-op without them.

import { createAdminClient } from "@/lib/supabase/admin";
import { updateGodWorkItem } from "@/lib/platform/god-accounts";
import { sendOpsAlert } from "@/lib/god-slack";
import { logError, logEvent } from "@/lib/observability/logger";
import type { Json } from "@/lib/database.types";

const SLACK_API_BASE = "https://slack.com/api";
const LOOKBACK_SECONDS = 90 * 60; // 90 min window to catch commands between cron runs

export type SlackPollResult =
    | { readonly ran: false; readonly reason: string }
    | {
          readonly ran: true;
          readonly messages_scanned: number;
          readonly commands_found: number;
          readonly closed: number;
          readonly errors: number;
      };

type SlackMessage = { ts: string; text: string; user?: string };

// Matches: close/done/snooze + a UUID prefix (min 6 chars)
const CMD_RE = /^(close|done|snooze)\s+([0-9a-f-]{6,36})/i;

function parseCommand(text: string): { action: "close" | "snooze"; idPrefix: string } | null {
    const m = CMD_RE.exec(text.trim());
    if (!m) return null;
    const action = m[1].toLowerCase() === "snooze" ? "snooze" : "close";
    return { action, idPrefix: m[2].toLowerCase() };
}

async function fetchChannelHistory(token: string, channelId: string, oldest: string): Promise<SlackMessage[]> {
    const url = new URL(`${SLACK_API_BASE}/conversations.history`);
    url.searchParams.set("channel", channelId);
    url.searchParams.set("oldest", oldest);
    url.searchParams.set("limit", "60");

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Slack conversations.history HTTP ${res.status}`);
    const data = await res.json() as { ok: boolean; error?: string; messages?: SlackMessage[] };
    if (!data.ok) throw new Error(`Slack API error: ${data.error ?? "unknown"}`);
    return Array.isArray(data.messages) ? data.messages : [];
}

async function isAlreadyProcessed(ts: string): Promise<boolean> {
    const db = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON path filter
    const raw = db as any;
    const { data } = await raw
        .from("platform_audit_log")
        .select("id")
        .eq("action", "Autopilot: Slack command processed")
        .eq("category", "automation")
        .filter("details->>slack_ts", "eq", ts)
        .limit(1)
        .maybeSingle();
    return Boolean(data?.id);
}

async function markProcessed(ts: string, workItemId: string, action: string): Promise<void> {
    const db = createAdminClient();
    await db.from("platform_audit_log").insert({
        actor_id: null,
        action: "Autopilot: Slack command processed",
        category: "automation",
        details: { slack_ts: ts, work_item_id: workItemId, action } as Json,
    } as never);
}

async function findWorkItemByPrefix(idPrefix: string): Promise<string | null> {
    const db = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ilike on UUID column
    const raw = db as any;
    const { data } = await raw
        .from("god_work_items")
        .select("id")
        .ilike("id", `${idPrefix}%`)
        .in("status", ["open", "in_progress", "blocked"])
        .limit(1)
        .maybeSingle();
    return typeof data?.id === "string" ? data.id : null;
}

export async function runSlackApprovalPoller(): Promise<SlackPollResult> {
    const token = process.env.SLACK_BOT_TOKEN?.trim();
    const channelId = process.env.SLACK_OPS_CHANNEL_ID?.trim();

    if (!token || !channelId) {
        return { ran: false, reason: "SLACK_BOT_TOKEN or SLACK_OPS_CHANNEL_ID not configured" };
    }

    const oldest = String(Math.floor(Date.now() / 1000) - LOOKBACK_SECONDS);
    let messages: SlackMessage[];

    try {
        messages = await fetchChannelHistory(token, channelId, oldest);
    } catch (err) {
        logError("[slack-poll] Failed to fetch channel history", err);
        return { ran: false, reason: "Slack API fetch failed" };
    }

    let commandsFound = 0;
    let closed = 0;
    let errors = 0;

    for (const msg of messages) {
        const parsed = parseCommand(msg.text ?? "");
        if (!parsed) continue;
        commandsFound++;

        const alreadyDone = await isAlreadyProcessed(msg.ts).catch(() => false);
        if (alreadyDone) continue;

        const workItemId = await findWorkItemByPrefix(parsed.idPrefix).catch(() => null);
        if (!workItemId) {
            await sendOpsAlert(`⚠️ Slack command \`${parsed.action} ${parsed.idPrefix}\` — no matching open work item found`);
            continue;
        }

        try {
            const newStatus = parsed.action === "snooze" ? "snoozed" : "done";
            const db = createAdminClient();
            await updateGodWorkItem(db as never, workItemId, { status: newStatus });
            await markProcessed(msg.ts, workItemId, parsed.action);
            await sendOpsAlert(`✅ Work item \`${workItemId.slice(0, 8)}\` marked *${newStatus}* via Slack`);
            closed++;
        } catch (err) {
            logError("[slack-poll] Failed to update work item", err, { workItemId });
            errors++;
        }
    }

    logEvent("info", "[slack-poll] Poll complete", { scanned: messages.length, commandsFound, closed, errors });

    return { ran: true, messages_scanned: messages.length, commands_found: commandsFound, closed, errors };
}
