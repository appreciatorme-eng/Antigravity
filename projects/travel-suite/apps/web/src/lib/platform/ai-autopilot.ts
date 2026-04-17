// AI Autopilot — daily AI decision loop.
// Reads ops state, generates ranked work item proposals via OpenAI, creates them, posts to Slack.
// Gated on OPENAI_API_KEY — silent no-op if not configured.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createGodWorkItem } from "@/lib/platform/god-accounts";
import type { GodWorkItemKind, GodWorkItemSeverity } from "@/lib/platform/god-accounts";
import {
    generateDailyOpsBrief,
    getActivationRiskAccounts,
    getMarginWatchAccounts,
    getStalledAccounts,
    getUnownedHighRiskAccounts,
    type BusinessOsAccountRow,
} from "@/lib/platform/business-os";
import { sendOpsAlert, type SlackBlock } from "@/lib/god-slack";
import { logError, logEvent } from "@/lib/observability/logger";
import { logPlatformAction } from "@/lib/platform/audit";

type AdminClient = SupabaseClient;

export type AiAutopilotResult =
    | { readonly ran: false; readonly reason: string }
    | {
          readonly ran: true;
          readonly model: string;
          readonly accounts_analyzed: number;
          readonly work_items_created: number;
          readonly work_item_ids: string[];
          readonly summary: string;
          readonly prompt_tokens: number;
          readonly completion_tokens: number;
          readonly slackPosted: boolean;
      };

type AiProposal = {
    org_id: string;
    org_name: string;
    action: string;
    reasoning: string;
    priority: "critical" | "high" | "medium";
    work_item_kind: string;
};

type OpenAiChatMessage = { role: "system" | "user"; content: string };

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const AI_MODEL = "gpt-4o";

const SYSTEM_PROMPT = `You are an AI business operations analyst for TripBuilt, a B2B SaaS platform for Indian tour operators.
Analyze customer account health and propose specific, actionable next steps.

For each account, propose ONE concrete action. Focus on:
- Accounts at risk of churning (overdue balance, no activity, fatal errors)
- Accounts stuck in onboarding (signed up but no proposals sent in 7+ days)
- Accounts with payment collection problems (overdue_balance > 0)
- Accounts with unresolved support or fatal errors

Output a JSON object:
{
  "summary": "<2-sentence plain English description of the most critical situation today>",
  "proposals": [
    {
      "org_id": "<exact org_id>",
      "org_name": "<exact org name>",
      "action": "<specific action, e.g. 'Send collections follow-up: 45-day overdue ₹12,000'>",
      "reasoning": "<why: what signals triggered this>",
      "priority": "critical|high|medium",
      "work_item_kind": "collections|churn_risk|renewal|growth_followup|support_escalation|incident_followup"
    }
  ]
}

Rules:
- Output ONLY the JSON, no prose
- Rank proposals by priority (critical first)
- Maximum 8 proposals
- Be specific: mention actual amounts, days overdue, or the specific signal
- Skip accounts that look healthy`;

function buildAccountSummary(account: BusinessOsAccountRow): string {
    const snap = account.snapshot;
    const state = account.account_state;
    const lines = [
        `Org: ${account.name} (id: ${account.org_id})`,
        `  Stage: ${state.activation_stage} | Health: ${state.health_band}`,
        `  Trips: ${snap.trip_count} | Proposals sent/won: ${snap.proposal_sent_count}/${snap.proposal_won_count}`,
        `  Overdue balance: ₹${snap.overdue_balance.toFixed(0)} | Urgent support: ${snap.urgent_support_count}`,
        `  Fatal errors: ${snap.fatal_error_count} | AI requests MTD: ${snap.ai_requests_mtd}`,
    ];
    if (account.priority_reasons.length > 0) {
        lines.push(`  Flags: ${account.priority_reasons.slice(0, 3).join("; ")}`);
    }
    return lines.join("\n");
}

async function callAi(
    apiKey: string,
    messages: OpenAiChatMessage[],
): Promise<{ content: string; promptTokens: number; completionTokens: number } | null> {
    try {
        const response = await fetch(OPENAI_CHAT_URL, {
            // eslint-disable-next-line no-restricted-syntax -- server-side OpenAI call, not a mutation endpoint
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: AI_MODEL,
                messages,
                response_format: { type: "json_object" },
                temperature: 0.2,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            logError("[ai-autopilot] OpenAI error", new Error(response.statusText), { status: response.status });
            return null;
        }

        const data = await response.json() as {
            choices: Array<{ message: { content: string } }>;
            usage: { prompt_tokens: number; completion_tokens: number };
        };

        return {
            content: data.choices[0]?.message?.content ?? "",
            promptTokens: data.usage?.prompt_tokens ?? 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
        };
    } catch (err) {
        logError("[ai-autopilot] Fetch failed", err);
        return null;
    }
}

function parseResponse(content: string): { summary: string; proposals: AiProposal[] } {
    try {
        const parsed = JSON.parse(content) as { summary?: unknown; proposals?: unknown[] };
        const summary = typeof parsed.summary === "string" ? parsed.summary : "";
        const raw = Array.isArray(parsed.proposals) ? parsed.proposals : [];
        const proposals = raw
            .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
            .slice(0, 8)
            .map((p) => ({
                org_id: typeof p.org_id === "string" ? p.org_id : "",
                org_name: typeof p.org_name === "string" ? p.org_name : "Unknown",
                action: typeof p.action === "string" ? p.action.slice(0, 200) : "",
                reasoning: typeof p.reasoning === "string" ? p.reasoning.slice(0, 500) : "",
                priority: (p.priority === "critical" || p.priority === "high") ? p.priority as "critical" | "high" : "medium" as const,
                work_item_kind: typeof p.work_item_kind === "string" ? p.work_item_kind : "churn_risk",
            }))
            .filter((p) => Boolean(p.org_id && p.action));
        return { summary, proposals };
    } catch {
        return { summary: "", proposals: [] };
    }
}

const VALID_KINDS: GodWorkItemKind[] = ["collections", "renewal", "churn_risk", "support_escalation", "incident_followup", "growth_followup"];

function toValidKind(kind: string): GodWorkItemKind {
    return VALID_KINDS.includes(kind as GodWorkItemKind) ? (kind as GodWorkItemKind) : "churn_risk";
}

function toValidSeverity(priority: AiProposal["priority"]): GodWorkItemSeverity {
    if (priority === "critical") return "critical";
    if (priority === "high") return "high";
    return "medium";
}

export async function runAiAutopilot(db: AdminClient): Promise<AiAutopilotResult> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return { ran: false, reason: "OPENAI_API_KEY not configured" };

    const [brief, activationRisk, marginWatch, stalled, unowned] = await Promise.all([
        generateDailyOpsBrief(db, ""),
        getActivationRiskAccounts(db, 8),
        getMarginWatchAccounts(db, 6),
        getStalledAccounts(db, 6),
        getUnownedHighRiskAccounts(db, 6),
    ]);

    // Deduplicate across lists
    const seen = new Set<string>();
    const allAccounts: BusinessOsAccountRow[] = [];
    for (const account of [...activationRisk, ...marginWatch, ...stalled, ...unowned]) {
        if (!seen.has(account.org_id)) {
            seen.add(account.org_id);
            allAccounts.push(account);
        }
    }

    if (allAccounts.length === 0) return { ran: false, reason: "no accounts requiring attention" };

    const userContent = [
        `## Daily Ops Brief\n${brief.headline}\n${brief.summary}`,
        brief.priorities.length > 0 ? `\n## Rule-engine flags\n${brief.priorities.slice(0, 6).join("\n")}` : "",
        `\n## Accounts to analyze (${allAccounts.length})\n`,
        allAccounts.map(buildAccountSummary).join("\n\n"),
    ].filter(Boolean).join("");

    const aiResult = await callAi(apiKey, [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
    ]);

    if (!aiResult) return { ran: false, reason: "AI API call failed" };

    const { summary, proposals } = parseResponse(aiResult.content);
    const orgIdSet = new Set(allAccounts.map((a) => a.org_id));
    const workItemIds: string[] = [];

    for (const proposal of proposals) {
        if (!orgIdSet.has(proposal.org_id)) continue;
        try {
            const item = await createGodWorkItem(db, {
                kind: toValidKind(proposal.work_item_kind),
                target_type: "organization",
                target_id: proposal.org_id,
                org_id: proposal.org_id,
                owner_id: null,
                status: "open",
                severity: toValidSeverity(proposal.priority),
                title: proposal.action,
                summary: proposal.reasoning,
                due_at: null,
                metadata: { source: "ai_autopilot", model: AI_MODEL },
            });
            workItemIds.push(item.id);
        } catch (err) {
            logError("[ai-autopilot] Failed to create work item", err, { orgId: proposal.org_id });
        }
    }

    const criticalCount = proposals.filter((p) => p.priority === "critical").length;
    const highCount = proposals.filter((p) => p.priority === "high").length;

    const blocks: SlackBlock[] = [
        {
            type: "header",
            text: { type: "plain_text", text: "🤖 AI Autopilot — Daily Run", emoji: true },
        },
        {
            type: "section",
            text: { type: "mrkdwn", text: summary || brief.headline },
        },
        {
            type: "section",
            fields: [
                { type: "mrkdwn", text: `*Analyzed:* ${allAccounts.length} accounts` },
                { type: "mrkdwn", text: `*Created:* ${workItemIds.length} work items` },
                { type: "mrkdwn", text: `*Critical:* ${criticalCount}` },
                { type: "mrkdwn", text: `*High:* ${highCount}` },
            ],
        },
    ];

    // Top 3 proposals with work item IDs for Slack-based closing
    const proposalsWithIds = proposals.slice(0, 3).map((p, i) => ({ ...p, id: workItemIds[i] ?? null }));
    for (const proposal of proposalsWithIds) {
        const emoji = proposal.priority === "critical" ? "🚨" : proposal.priority === "high" ? "⚠️" : "ℹ️";
        const idHint = proposal.id ? `\n\`close ${proposal.id.slice(0, 8)}\`` : "";
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `${emoji} *${proposal.org_name}*\n${proposal.action}\n_${proposal.reasoning.slice(0, 120)}_${idHint}`,
            },
        });
    }

    blocks.push({
        type: "context",
        elements: [
            {
                type: "mrkdwn",
                text: `👉 <https://tripbuilt.com/god/business-os|Business OS>  •  ${AI_MODEL}  •  ${aiResult.promptTokens + aiResult.completionTokens} tokens`,
            },
        ],
    });

    const slackPosted = await sendOpsAlert("🤖 AI Autopilot run complete", blocks);

    await logPlatformAction(null, "Autopilot: AI decision run", "automation", {
        model: AI_MODEL,
        accounts_analyzed: allAccounts.length,
        proposals_generated: proposals.length,
        work_items_created: workItemIds.length,
        prompt_tokens: aiResult.promptTokens,
        completion_tokens: aiResult.completionTokens,
        brief_headline: brief.headline,
    });

    logEvent("info", "[ai-autopilot] Completed", {
        accounts: allAccounts.length,
        proposals: proposals.length,
        workItems: workItemIds.length,
        tokens: aiResult.promptTokens + aiResult.completionTokens,
    });

    return {
        ran: true,
        model: AI_MODEL,
        accounts_analyzed: allAccounts.length,
        work_items_created: workItemIds.length,
        work_item_ids: workItemIds,
        summary: summary || brief.headline,
        prompt_tokens: aiResult.promptTokens,
        completion_tokens: aiResult.completionTokens,
        slackPosted,
    };
}
