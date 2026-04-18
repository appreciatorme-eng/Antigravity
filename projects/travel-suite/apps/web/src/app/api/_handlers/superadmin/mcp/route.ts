/**
 * Travel Suite God Mode — MCP Server
 *
 * Exposes live business intelligence and operating tools to AI agents (Claude, Cursor, etc.)
 * All tools are protected by requireSuperAdmin() — only authenticated super admins
 * can establish a connection.
 *
 * Tool categories:
 *  [Health]   get_ops_health, get_error_digest
 *  [Revenue]  get_revenue_summary, get_overdue_invoices, get_top_spending_orgs
 *  [Customers] get_churn_risk_orgs, get_org_details, get_recent_signups
 *  [Support]  get_support_backlog, escalate_support_ticket
 *  [Content]  draft_announcement, list_kill_switches
 *  [Actions]  propose_slack_alert, send_ops_alert (Human-in-the-loop)
 */

import { NextRequest, NextResponse } from "next/server";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendHitlProposal, sendOpsAlert } from "@/lib/god-slack";
import { Redis } from "@upstash/redis";
import { listAccounts } from "@/lib/platform/god-accounts";
import {
    buildBusinessOsPayload,
    draftAccountPlaybook,
    draftCollectionsSequence,
    draftCustomerSaveOutreach,
    draftGrowthExperiment,
    draftRenewalStrategy,
    generateDailyOpsBrief,
    getAccountsNeedingFirstProposal,
    getActivationRiskAccounts,
    getMarginWatchAccounts,
    getStalledAccounts,
    getUnownedHighRiskAccounts,
    getUnreviewedHighRiskAccounts,
    getWhatsAppActivationGapAccounts,
    proposeAccountStateUpdate,
    runBusinessOpsLoop,
    proposeWorkItemBatch,
} from "@/lib/platform/business-os";

export const maxDuration = 60;

function getRedis(): Redis | null {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) return null;
    return new Redis({ url, token });
}

function monthStartISO(): string {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString();
}

// ── MCP Server definition ─────────────────────────────────────────────────────
const mcpServer = new Server(
    { name: "travel-suite-god-mode", version: "2.0.0" },
    { capabilities: { tools: {} } }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        // ── Health ────────────────────────────────────────────────────────────
        {
            name: "get_ops_health",
            description:
                "Real-time platform health: queue depths, AI cost MTD, open support tickets, " +
                "and active subscription count. Start every morning analysis here.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "get_error_digest",
            description:
                "10 most recent platform error events ordered by severity. " +
                "Use as the Incident Commander — look for recurring patterns and propose code fixes.",
            inputSchema: { type: "object", properties: {} },
        },

        // ── Revenue ───────────────────────────────────────────────────────────
        {
            name: "get_revenue_summary",
            description:
                "MRR, active subscriptions breakdown by tier (free/pro/enterprise), " +
                "total overdue invoice amount, and AI API cost MTD. The essential revenue snapshot.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "get_overdue_invoices",
            description:
                "List of all overdue invoices with org name, amount, and how many days past due. " +
                "Use to identify collection priorities or trigger dunning outreach proposals.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "Max invoices to return (default 20)" },
                },
            },
        },
        {
            name: "get_top_spending_orgs",
            description:
                "Top organizations by AI API spend this month. " +
                "Use to identify upsell candidates or organizations approaching cost caps.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "How many orgs to return (default 10)" },
                },
            },
        },

        // ── Customers ─────────────────────────────────────────────────────────
        {
            name: "get_churn_risk_orgs",
            description:
                "Organizations flagged as churn risks based on: overdue invoices, urgent support tickets, " +
                "or expiring proposals. Returns ranked list with risk flags.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "get_org_details",
            description:
                "Full profile of a specific organization: subscription tier, AI usage this month, " +
                "open support tickets, overdue invoices, and recent audit log entries.",
            inputSchema: {
                type: "object",
                properties: {
                    org_id: { type: "string", description: "The organization UUID" },
                },
                required: ["org_id"],
            },
        },
        {
            name: "get_recent_signups",
            description:
                "New organizations and users that signed up in the last N days. " +
                "Use to track growth trends or identify new accounts to welcome.",
            inputSchema: {
                type: "object",
                properties: {
                    days: { type: "number", description: "Look-back window in days (default 7)" },
                },
            },
        },
        {
            name: "generate_daily_ops_brief",
            description:
                "AI COO brief for the current operating day. Ranks the highest-risk accounts, " +
                "calls out ownership gaps, and summarizes where the team should focus first.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "get_activation_risk_accounts",
            description:
                "Accounts stuck before healthy activation. Use to find orgs that signed up or used AI, " +
                "but have not yet reached the first proposal milestone cleanly.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "How many accounts to return (default 10)" },
                },
            },
        },
        {
            name: "get_unowned_high_risk_accounts",
            description:
                "Accounts with meaningful risk but no assigned owner. Use as an AI COO handoff queue.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "How many accounts to return (default 10)" },
                },
            },
        },
        {
            name: "get_stalled_accounts",
            description:
                "Accounts with blocked or snoozed work, overdue next actions, or ownership gaps. " +
                "Use to catch operating drift before it turns into churn.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "How many stalled accounts to return (default 10)" },
                },
            },
        },
        {
            name: "get_accounts_needing_first_proposal",
            description:
                "Accounts that still have not crossed the first proposal sent milestone. " +
                "Use to focus activation work around Trip Built's core product value.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "How many accounts to return (default 10)" },
                },
            },
        },
        {
            name: "get_unreviewed_high_risk_accounts",
            description:
                "High-risk accounts that have not been reviewed recently in Business OS. " +
                "Use this as an AI COO review-enforcement queue.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "How many accounts to return (default 10)" },
                },
            },
        },
        {
            name: "get_whatsapp_activation_gaps",
            description:
                "Accounts where WhatsApp captured proposal intent but no proposal was actually sent. " +
                "Use to close the strongest activation leak in Trip Built.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "How many accounts to return (default 10)" },
                },
            },
        },
        {
            name: "get_margin_watch_accounts",
            description:
                "Accounts where AI cost, proposal throughput, and monetization are drifting out of balance. " +
                "Use to catch underpriced or inefficient accounts early.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "How many accounts to return (default 10)" },
                },
            },
        },
        {
            name: "run_business_ops_loop",
            description:
                "Creates missing Business OS work items for activation rescue, collections, support recovery, review enforcement, and margin watch. " +
                "Use when you want AI to populate today's queue directly.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "draft_account_playbook",
            description:
                "Draft an operator playbook for a specific organization using the shared Business OS account model.",
            inputSchema: {
                type: "object",
                properties: {
                    org_id: { type: "string", description: "The organization UUID" },
                },
                required: ["org_id"],
            },
        },
        {
            name: "draft_customer_save_outreach",
            description:
                "Draft outreach copy to stabilize a specific account without sending it.",
            inputSchema: {
                type: "object",
                properties: {
                    org_id: { type: "string", description: "The organization UUID" },
                },
                required: ["org_id"],
            },
        },
        {
            name: "draft_collections_sequence",
            description:
                "Draft a collections workflow for a specific account with overdue balance or expiring commercial risk.",
            inputSchema: {
                type: "object",
                properties: {
                    org_id: { type: "string", description: "The organization UUID" },
                },
                required: ["org_id"],
            },
        },
        {
            name: "draft_renewal_strategy",
            description:
                "Draft a renewal and expansion stance for a specific account using activation, usage, and risk signals.",
            inputSchema: {
                type: "object",
                properties: {
                    org_id: { type: "string", description: "The organization UUID" },
                },
                required: ["org_id"],
            },
        },
        {
            name: "draft_growth_experiment",
            description:
                "Draft a focused growth experiment for a specific account, emphasizing activation, repeat usage, or expansion.",
            inputSchema: {
                type: "object",
                properties: {
                    org_id: { type: "string", description: "The organization UUID" },
                },
                required: ["org_id"],
            },
        },
        {
            name: "propose_account_state_update",
            description:
                "Create a HITL-ready proposal for updating account state, ownership, or posture. " +
                "Never mutates directly; returns reasoning or can be forwarded to Slack approval.",
            inputSchema: {
                type: "object",
                properties: {
                    org_id: { type: "string", description: "The organization UUID" },
                },
                required: ["org_id"],
            },
        },
        {
            name: "propose_work_item_batch",
            description:
                "Generate a HITL-ready batch proposal for creating follow-up work items on the highest-priority Business OS accounts.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "How many top accounts to include (default 5)" },
                },
            },
        },

        // ── Support ───────────────────────────────────────────────────────────
        {
            name: "get_support_backlog",
            description:
                "Current support ticket queue: counts by priority, oldest unresolved ticket age, " +
                "and SLA breach count. Use to gauge customer satisfaction pressure.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "escalate_support_ticket",
            description:
                "Sends a HITL Slack proposal to escalate a specific support ticket to urgent priority " +
                "and assign it for immediate human response. Does NOT auto-mutate — requires [Approve].",
            inputSchema: {
                type: "object",
                properties: {
                    ticket_id: { type: "string", description: "The support ticket UUID" },
                    reason: { type: "string", description: "Why this ticket needs escalation" },
                },
                required: ["ticket_id", "reason"],
            },
        },

        // ── Content & Config ──────────────────────────────────────────────────
        {
            name: "draft_announcement",
            description:
                "Draft a platform-wide announcement and send it to Slack for HITL approval before broadcasting. " +
                "Use for incident communications, new feature announcements, or pricing changes.",
            inputSchema: {
                type: "object",
                properties: {
                    subject: { type: "string", description: "Announcement subject line" },
                    body: { type: "string", description: "Full announcement body (markdown supported)" },
                    target_tier: {
                        type: "string",
                        enum: ["all", "free", "pro", "enterprise"],
                        description: "Which subscription tier to target",
                    },
                },
                required: ["subject", "body"],
            },
        },
        {
            name: "list_kill_switches",
            description:
                "Read the current state of all platform kill switches and feature flags from Redis. " +
                "Use to understand what is currently enabled/disabled before proposing changes.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "propose_feature_flag_change",
            description:
                "Propose enabling or disabling a platform feature flag via HITL Slack approval. " +
                "Never changes the flag directly — a human must click [Approve] in Slack first.",
            inputSchema: {
                type: "object",
                properties: {
                    flag: {
                        type: "string",
                        enum: ["maintenance_mode", "ai_enabled", "whatsapp_enabled", "social_posting_enabled", "marketplace_enabled"],
                        description: "The feature flag to change",
                    },
                    new_value: { type: "boolean", description: "The proposed new value" },
                    reason: { type: "string", description: "Why this change is being proposed" },
                },
                required: ["flag", "new_value", "reason"],
            },
        },

        // ── HITL Actions ──────────────────────────────────────────────────────
        {
            name: "propose_slack_alert",
            description:
                "Send a Human-in-the-Loop proposal to the Slack ops channel with [Approve] / [Reject] buttons. " +
                "Use for any action that requires human sign-off before execution.",
            inputSchema: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    reasoning: { type: "string" },
                    actionPayload: { type: "string" },
                    riskLevel: { type: "string", enum: ["medium", "high", "critical"] },
                },
                required: ["title", "reasoning", "actionPayload"],
            },
        },
        {
            name: "send_ops_alert",
            description:
                "Send a plain-text informational alert to the Slack ops channel. " +
                "Use for summaries and FYI messages, not for actions needing approval.",
            inputSchema: {
                type: "object",
                properties: {
                    message: { type: "string" },
                },
                required: ["message"],
            },
        },
    ],
}));

// ── Tool handlers ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- MCP SDK request params are dynamically typed at runtime
mcpServer.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const args = request.params.arguments ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase admin client is used with dynamic MCP query composition
    const db = createAdminClient() as any;

    switch (request.params.name) {

        // ── get_ops_health ────────────────────────────────────────────────────
        case "get_ops_health": {
            const redis = getRedis();
            const [tickets, subs, aiUsage] = await Promise.all([
                db.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
                db.from("subscriptions").select("amount").eq("status", "active"),
                db.from("organization_ai_usage").select("estimated_cost_usd").eq("month_start", monthStartISO()),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lightweight MCP text formatter over dynamic rows
            const mrr = (subs.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lightweight MCP text formatter over dynamic rows
            const aiMtd = (aiUsage.data ?? []).reduce((s: number, r: any) => s + Number(r.estimated_cost_usd ?? 0), 0);

            let queueInfo = "Redis not configured";
            if (redis) {
                try {
                    const [n, s] = await Promise.all([
                        redis.llen("queue:notifications:pending"),
                        redis.llen("queue:social:pending"),
                    ]);
                    queueInfo = `Notifications: ${n} pending | Social: ${s} pending`;
                } catch { queueInfo = "Queue check failed"; }
            }

            return { content: [{ type: "text", text: [
                `## Platform Health (${new Date().toUTCString()})`,
                `- **Active Subscriptions:** ${(subs.data ?? []).length} | MRR: ₹${Math.round(mrr).toLocaleString("en-IN")}`,
                `- **AI Cost MTD:** $${aiMtd.toFixed(2)}`,
                `- **Open Support Tickets:** ${tickets.count ?? 0}`,
                `- **Queues:** ${queueInfo}`,
            ].join("\n") }] };
        }

        // ── get_error_digest ──────────────────────────────────────────────────
        case "get_error_digest": {
            const { data: errors } = await db
                .from("error_events")
                .select("id, title, level, status, event_count, user_count, first_seen_at")
                .in("status", ["open", "investigating"])
                .order("level", { ascending: true })
                .limit(10);

            if (!errors?.length) return { content: [{ type: "text", text: "✅ No open error events." }] };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error digest rows come from dynamic MCP query output
            const lines = errors.map((e: any, i: number) =>
                `**${i + 1}. [${(e.level ?? "unknown").toUpperCase()}]** ${e.title ?? "Untitled"}\n` +
                `   Events: ${e.event_count ?? 0} | Affected users: ${e.user_count ?? 0} | First seen: ${e.first_seen_at ?? "unknown"}`
            );
            return { content: [{ type: "text", text: `## Error Digest\n\n${lines.join("\n\n")}` }] };
        }

        // ── get_revenue_summary ───────────────────────────────────────────────
        case "get_revenue_summary": {
            const [subs, accountPortfolio] = await Promise.all([
                db.from("subscriptions").select("amount, status, plan_id").eq("status", "active"),
                listAccounts(db, { limit: 5000, page: 0 }),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- subscription rows are dynamic in MCP mode
            const mrr = (subs.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
            const overdue = accountPortfolio.accounts.reduce((sum, account) => sum + account.snapshot.overdue_balance, 0);
            const aiMtd = accountPortfolio.accounts.reduce((sum, account) => sum + account.snapshot.ai_spend_mtd_usd, 0);
            const tierCounts = accountPortfolio.accounts.reduce((acc: Record<string, number>, account) => {
                const t = account.tier ?? "free";
                acc[t] = (acc[t] ?? 0) + 1;
                return acc;
            }, {});

            return { content: [{ type: "text", text: [
                `## Revenue Summary (${new Date().toUTCString()})`,
                `- **MRR:** ₹${Math.round(mrr).toLocaleString("en-IN")}`,
                `- **Active Subscriptions:** ${(subs.data ?? []).length}`,
                `- **Tier Distribution:** ${Object.entries(tierCounts).map(([k, v]) => `${k}: ${v}`).join(" | ")}`,
                `- **Overdue Invoices Total:** ₹${Math.round(overdue).toLocaleString("en-IN")}`,
                `- **AI API Cost MTD:** $${aiMtd.toFixed(2)}`,
                `- **Source:** shared account snapshot + live subscription ledger`,
            ].join("\n") }] };
        }

        // ── get_overdue_invoices ──────────────────────────────────────────────
        case "get_overdue_invoices": {
            const limit = Number(args.limit ?? 20);
            const { data: invoices } = await db
                .from("invoices")
                .select("id, invoice_number, status, due_date, balance_amount, total_amount, organization_id, organizations(name)")
                .in("status", ["issued", "overdue", "partially_paid"])
                .gt("balance_amount", 0)
                .lt("due_date", new Date().toISOString())
                .order("due_date", { ascending: true })
                .limit(limit);

            if (!invoices?.length) return { content: [{ type: "text", text: "✅ No overdue invoices." }] };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- invoice rows come from a dynamic MCP query
            const lines = invoices.map((inv: any) => {
                const days = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86_400_000);
                const orgName = inv.organizations?.name ?? inv.organization_id ?? "Unknown";
                const amount = Number(inv.balance_amount ?? inv.total_amount ?? 0);
                return `- **${orgName}** | Invoice #${inv.invoice_number ?? inv.id.slice(0,8)} | ₹${Math.round(amount).toLocaleString("en-IN")} | ${days} days overdue`;
            });
            return { content: [{ type: "text", text: `## Overdue Invoices (${invoices.length})\n\n${lines.join("\n")}` }] };
        }

        // ── get_top_spending_orgs ─────────────────────────────────────────────
        case "get_top_spending_orgs": {
            const limit = Number(args.limit ?? 10);
            const { accounts } = await listAccounts(db, { limit: 5000, page: 0 });
            const usage = accounts
                .filter((account) => account.snapshot.ai_spend_mtd_usd > 0 || account.snapshot.ai_requests_mtd > 0)
                .sort((left, right) =>
                    right.snapshot.ai_spend_mtd_usd - left.snapshot.ai_spend_mtd_usd
                    || right.snapshot.ai_requests_mtd - left.snapshot.ai_requests_mtd,
                )
                .slice(0, limit);

            if (!usage.length) return { content: [{ type: "text", text: "No AI usage data this month." }] };

            const lines = usage.map((account, i) => {
                return `${i + 1}. **${account.name}** [${account.tier}] — $${account.snapshot.ai_spend_mtd_usd.toFixed(2)} | ${account.snapshot.ai_requests_mtd.toLocaleString()} requests`;
            });
            return { content: [{ type: "text", text: `## Top AI Spending Orgs (MTD)\n\n${lines.join("\n")}` }] };
        }

        // ── get_churn_risk_orgs ───────────────────────────────────────────────
        case "get_churn_risk_orgs": {
            const { accounts } = await listAccounts(db, { risk: "churn", limit: 10, page: 0 });
            if (!accounts.length) return { content: [{ type: "text", text: "✅ No high-risk churn signals detected." }] };
            const lines = accounts.map((account, index) =>
                `${index + 1}. **${account.name}** [${account.tier}] — ${account.snapshot.overdue_balance_label} overdue | ${account.snapshot.urgent_support_count} urgent tickets | health ${account.account_state.health_band}`
            );
            return { content: [{ type: "text", text: `## Churn Risk Organizations\n\n${lines.join("\n")}` }] };
        }

        // ── get_org_details ───────────────────────────────────────────────────
        case "get_org_details": {
            const orgId = String(args.org_id ?? "");
            if (!orgId) throw new Error("org_id is required");
            const workspace = await buildBusinessOsPayload(db, "", {
                selected_org_id: orgId,
                limit: 120,
            });
            const detail = workspace.selected_account;
            const accountRow = workspace.accounts.find((account) => account.org_id === orgId) ?? null;
            if (!detail || !accountRow) return { content: [{ type: "text", text: `Org ${orgId} not found.` }] };

            return { content: [{ type: "text", text: [
                `## Org: ${detail.organization.name}`,
                `- **Tier:** ${detail.organization.tier} | **Health:** ${detail.account_state.health_band} | **Lifecycle:** ${detail.account_state.lifecycle_stage}`,
                `- **Priority:** ${accountRow.priority_score} | **Activation stage:** ${accountRow.effective_activation_stage.replaceAll("_", " ")}`,
                `- **Created:** ${detail.organization.created_at?.slice(0, 10) ?? "unknown"}`,
                `- **Members:** ${detail.snapshot.member_count}`,
                `- **AI Usage MTD:** ${detail.snapshot.ai_requests_mtd} requests | $${detail.snapshot.ai_spend_mtd_usd.toFixed(2)}`,
                `- **Open Tickets:** ${detail.snapshot.open_support_count} (${detail.snapshot.urgent_support_count} urgent/high)`,
                `- **Open Errors:** ${detail.snapshot.open_error_count} (${detail.snapshot.fatal_error_count} fatal)`,
                `- **Overdue Invoices:** ${detail.snapshot.overdue_balance_label}`,
                `- **Open Work Items:** ${detail.work_items.length}`,
                `- **Pending approvals:** ${detail.pending_approvals.length} | **Next action:** ${detail.account_state.next_action ?? "none"}`,
                "",
                `### Why this account is ranked here`,
                ...(accountRow.priority_reasons.length > 0
                    ? accountRow.priority_reasons.slice(0, 4).map((reason) => `- ${reason}`)
                    : ["- No major priority reasons surfaced in the shared account model."]),
            ].join("\n") }] };
        }

        // ── get_recent_signups ────────────────────────────────────────────────
        case "get_recent_signups": {
            const days = Number(args.days ?? 7);
            const since = daysAgo(days);
            const [newOrgs, newUsers] = await Promise.all([
                db.from("organizations").select("id, name, subscription_tier, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(20),
                db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- signup rows come from a dynamic MCP query
            const lines = (newOrgs.data ?? []).map((o: any) =>
                `- **${o.name ?? o.id}** [${o.subscription_tier ?? "free"}] — joined ${o.created_at?.slice(0, 10)}`
            );
            return { content: [{ type: "text", text: [
                `## Signups in the Last ${days} Days`,
                `- **New orgs:** ${(newOrgs.data ?? []).length}`,
                `- **New users:** ${newUsers.count ?? 0}`,
                "",
                ...(lines.length ? lines : ["No new signups in this window."]),
            ].join("\n") }] };
        }

        case "generate_daily_ops_brief": {
            const brief = await generateDailyOpsBrief(db, "");
            return {
                content: [{
                    type: "text",
                    text: [
                        `## AI COO Daily Brief`,
                        `- **Headline:** ${brief.headline}`,
                        `- **Summary:** ${brief.summary}`,
                        `- **Queue focus:** ${brief.queue_focus}`,
                        "",
                        `### Priorities`,
                        ...(brief.priorities.length > 0 ? brief.priorities.map((item) => `- ${item}`) : ["- No urgent priorities in the current posture."]),
                        "",
                        `### Gaps`,
                        ...(brief.gaps.length > 0 ? brief.gaps.map((item) => `- ${item}`) : ["- No major ownership or posture gaps surfaced."]),
                    ].join("\n"),
                }],
            };
        }

        case "get_activation_risk_accounts": {
            const limit = Number(args.limit ?? 10);
            const accounts = await getActivationRiskAccounts(db, limit);
            if (!accounts.length) return { content: [{ type: "text", text: "✅ No activation-risk accounts surfaced right now." }] };
            return {
                content: [{
                    type: "text",
                    text: `## Activation Risk Accounts\n\n${accounts.map((account, index) =>
                        `${index + 1}. **${account.name}** — ${account.activation_risk_reasons.join(", ") || "stalled before first proposal"}`
                    ).join("\n")}`,
                }],
            };
        }

        case "get_unowned_high_risk_accounts": {
            const limit = Number(args.limit ?? 10);
            const accounts = await getUnownedHighRiskAccounts(db, limit);
            if (!accounts.length) return { content: [{ type: "text", text: "✅ No unowned high-risk accounts right now." }] };
            return {
                content: [{
                    type: "text",
                    text: `## Unowned High-Risk Accounts\n\n${accounts.map((account, index) =>
                        `${index + 1}. **${account.name}** — ${account.priority_reasons.slice(0, 3).join(", ")}`
                    ).join("\n")}`,
                }],
            };
        }

        case "get_stalled_accounts": {
            const limit = Number(args.limit ?? 10);
            const accounts = await getStalledAccounts(db, limit);
            if (!accounts.length) return { content: [{ type: "text", text: "✅ No stalled accounts right now." }] };
            return {
                content: [{
                    type: "text",
                    text: `## Stalled Accounts\n\n${accounts.map((account, index) =>
                        `${index + 1}. **${account.name}** — ${account.priority_reasons.slice(0, 3).join(", ")}`
                    ).join("\n")}`,
                }],
            };
        }

        case "get_accounts_needing_first_proposal": {
            const limit = Number(args.limit ?? 10);
            const accounts = await getAccountsNeedingFirstProposal(db, limit);
            if (!accounts.length) return { content: [{ type: "text", text: "✅ All visible accounts have crossed the first proposal milestone." }] };
            return {
                content: [{
                    type: "text",
                    text: `## Accounts Needing First Proposal\n\n${accounts.map((account, index) =>
                        `${index + 1}. **${account.name}** — ${account.activation_risk_reasons.join(", ") || "no proposal sent yet"}`
                    ).join("\n")}`,
                }],
            };
        }

        case "get_unreviewed_high_risk_accounts": {
            const limit = Number(args.limit ?? 10);
            const accounts = await getUnreviewedHighRiskAccounts(db, limit);
            if (!accounts.length) return { content: [{ type: "text", text: "✅ No high-risk review gaps right now." }] };
            return {
                content: [{
                    type: "text",
                    text: `## Unreviewed High-Risk Accounts\n\n${accounts.map((account, index) => {
                        const reviewText = account.account_state.last_reviewed_at
                            ? `last reviewed ${new Date(account.account_state.last_reviewed_at).toLocaleDateString()}`
                            : "never reviewed";
                        return `${index + 1}. **${account.name}** — ${reviewText}; ${account.priority_reasons.slice(0, 3).join(", ")}`;
                    }).join("\n")}`,
                }],
            };
        }

        case "get_whatsapp_activation_gaps": {
            const limit = Number(args.limit ?? 10);
            const accounts = await getWhatsAppActivationGapAccounts(db, limit);
            if (!accounts.length) return { content: [{ type: "text", text: "✅ No WhatsApp-to-proposal activation gaps right now." }] };
            return {
                content: [{
                    type: "text",
                    text: `## WhatsApp Activation Gaps\n\n${accounts.map((account, index) =>
                        `${index + 1}. **${account.name}** — ${account.snapshot.whatsapp_proposal_draft_count} WhatsApp drafts, ${account.snapshot.proposal_sent_count} proposals sent, ${account.activation_risk_reasons.join(", ")}`
                    ).join("\n")}`,
                }],
            };
        }

        case "get_margin_watch_accounts": {
            const limit = Number(args.limit ?? 10);
            const accounts = await getMarginWatchAccounts(db, limit);
            if (!accounts.length) return { content: [{ type: "text", text: "✅ No margin-watch accounts right now." }] };
            return {
                content: [{
                    type: "text",
                    text: `## Margin Watch Accounts\n\n${accounts.map((account, index) =>
                        `${index + 1}. **${account.name}** — ${account.margin_watch_reasons.join(", ")}`
                    ).join("\n")}`,
                }],
            };
        }

        case "run_business_ops_loop": {
            const result = await runBusinessOpsLoop(db);
            return {
                content: [{
                    type: "text",
                    text: [
                        "## Business OS AI Ops Loop",
                        `- **Candidates:** ${result.candidate_count}`,
                        `- **Created:** ${result.created_count}`,
                        `- **Deduped:** ${result.deduped_count}`,
                        "",
                        "### Created queue",
                        ...(result.created_work_items.length > 0
                            ? result.created_work_items.map((item) => `- ${item.title} (${item.kind})`)
                            : ["- No new work items were needed."]),
                    ].join("\n"),
                }],
            };
        }

        case "draft_account_playbook": {
            const orgId = String(args.org_id ?? "");
            if (!orgId) throw new Error("org_id is required");
            const draft = await draftAccountPlaybook(db, orgId);
            return { content: [{ type: "text", text: `## Account Playbook\n\n${draft}` }] };
        }

        case "draft_customer_save_outreach": {
            const orgId = String(args.org_id ?? "");
            if (!orgId) throw new Error("org_id is required");
            const draft = await draftCustomerSaveOutreach(db, orgId);
            return { content: [{ type: "text", text: `## Customer Save Outreach\n\n${draft}` }] };
        }

        case "draft_collections_sequence": {
            const orgId = String(args.org_id ?? "");
            if (!orgId) throw new Error("org_id is required");
            const draft = await draftCollectionsSequence(db, orgId);
            return { content: [{ type: "text", text: `## Collections Sequence\n\n${draft}` }] };
        }

        case "draft_renewal_strategy": {
            const orgId = String(args.org_id ?? "");
            if (!orgId) throw new Error("org_id is required");
            const draft = await draftRenewalStrategy(db, orgId);
            return { content: [{ type: "text", text: `## Renewal Strategy\n\n${draft}` }] };
        }

        case "draft_growth_experiment": {
            const orgId = String(args.org_id ?? "");
            if (!orgId) throw new Error("org_id is required");
            const draft = await draftGrowthExperiment(db, orgId);
            return { content: [{ type: "text", text: `## Growth Experiment\n\n${draft}` }] };
        }

        case "propose_account_state_update": {
            const orgId = String(args.org_id ?? "");
            if (!orgId) throw new Error("org_id is required");
            const proposal = await proposeAccountStateUpdate(db, orgId);
            await sendHitlProposal(proposal.title, proposal.reasoning, proposal.actionPayload, proposal.riskLevel);
            return { content: [{ type: "text", text: `✅ Account state proposal sent to Slack for approval.` }] };
        }

        case "propose_work_item_batch": {
            const limit = Number(args.limit ?? 5);
            const proposal = await proposeWorkItemBatch(db, limit);
            await sendHitlProposal(proposal.title, proposal.reasoning, proposal.actionPayload, proposal.riskLevel);
            return { content: [{ type: "text", text: `✅ Business OS work-item batch proposal sent to Slack for approval.` }] };
        }

        // ── get_support_backlog ───────────────────────────────────────────────
        case "get_support_backlog": {
            const { data: tickets } = await db
                .from("support_tickets")
                .select("id, title, priority, status, created_at")
                .in("status", ["open", "in_progress"])
                .order("created_at", { ascending: true });

            if (!tickets?.length) return { content: [{ type: "text", text: "✅ Support queue is empty." }] };

            const counts: Record<string, number> = {};
            for (const t of tickets) counts[t.priority ?? "medium"] = (counts[t.priority ?? "medium"] ?? 0) + 1;
            const oldest = tickets[0];
            const oldestAge = Math.floor((Date.now() - new Date(oldest.created_at).getTime()) / 86_400_000);

            return { content: [{ type: "text", text: [
                `## Support Backlog (${tickets.length} open)`,
                `- **Urgent:** ${counts.urgent ?? 0} | **High:** ${counts.high ?? 0} | **Medium:** ${counts.medium ?? 0} | **Low:** ${counts.low ?? 0}`,
                `- **Oldest ticket:** "${oldest.title}" — ${oldestAge} days old`,
            ].join("\n") }] };
        }

        // ── escalate_support_ticket ───────────────────────────────────────────
        case "escalate_support_ticket": {
            const ticketId = String(args.ticket_id ?? "");
            const reason = String(args.reason ?? "");
            if (!ticketId) throw new Error("ticket_id is required");

            const { data: ticket } = await db
                .from("support_tickets")
                .select("id, title, priority, status")
                .eq("id", ticketId)
                .single();

            if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

            await sendHitlProposal(
                `Escalate Ticket: "${ticket.title}"`,
                `AI recommends escalating this ticket to urgent priority.\n\nCurrent priority: ${ticket.priority} | Status: ${ticket.status}\n\nReason: ${reason}`,
                `escalate_ticket|id:${ticketId}|priority:urgent`,
                "high"
            );
            return { content: [{ type: "text", text: `✅ Escalation proposal sent to Slack for ticket: "${ticket.title}"` }] };
        }

        // ── draft_announcement ────────────────────────────────────────────────
        case "draft_announcement": {
            const subject = String(args.subject ?? "Announcement");
            const body = String(args.body ?? "");
            const tier = String(args.target_tier ?? "all");

            await sendHitlProposal(
                `Draft Announcement: "${subject}"`,
                `AI has drafted the following announcement targeting **${tier}** tier users.\n\n---\n**${subject}**\n\n${body}\n---`,
                `broadcast_announcement|subject:${encodeURIComponent(subject)}|tier:${tier}`,
                "medium"
            );
            return { content: [{ type: "text", text: `✅ Announcement draft sent to Slack for approval. Target: ${tier} users.` }] };
        }

        // ── list_kill_switches ────────────────────────────────────────────────
        case "list_kill_switches": {
            const redis = getRedis();
            if (!redis) return { content: [{ type: "text", text: "Redis not configured — cannot read feature flags." }] };

            const flags = ["maintenance_mode", "ai_enabled", "whatsapp_enabled", "social_posting_enabled", "marketplace_enabled"];
            const values = await redis.mget<string[]>(...flags.map(f => `platform:flag:${f}`));

            const lines = flags.map((flag, i) => {
                const raw = values[i];
                const val = raw === null ? "(not set — defaults to active)" : raw;
                return `- **${flag}:** ${val}`;
            });
            return { content: [{ type: "text", text: `## Platform Kill Switches\n\n${lines.join("\n")}` }] };
        }

        // ── propose_feature_flag_change ───────────────────────────────────────
        case "propose_feature_flag_change": {
            const flag = String(args.flag ?? "");
            const newValue = Boolean(args.new_value);
            const reason = String(args.reason ?? "");
            if (!flag) throw new Error("flag is required");

            await sendHitlProposal(
                `Feature Flag Change: ${flag} → ${newValue ? "ON" : "OFF"}`,
                `AI is proposing to set **${flag}** to **${newValue ? "enabled" : "disabled"}**.\n\nReason: ${reason}`,
                `set_feature_flag|flag:${flag}|value:${newValue}`,
                newValue === false && flag === "maintenance_mode" ? "critical" : "high"
            );
            return { content: [{ type: "text", text: `✅ Feature flag change proposal sent to Slack. ${flag} → ${newValue}` }] };
        }

        // ── propose_slack_alert ───────────────────────────────────────────────
        case "propose_slack_alert": {
            await sendHitlProposal(
                String(args.title ?? "AI Proposal"),
                String(args.reasoning ?? ""),
                String(args.actionPayload ?? ""),
                (args.riskLevel as "medium" | "high" | "critical") ?? "medium"
            );
            return { content: [{ type: "text", text: `✅ HITL proposal posted to Slack: "${args.title}"` }] };
        }

        // ── send_ops_alert ────────────────────────────────────────────────────
        case "send_ops_alert": {
            await sendOpsAlert(String(args.message ?? ""));
            return { content: [{ type: "text", text: "✅ Ops alert sent to Slack." }] };
        }

        default:
            throw new Error(`Unknown tool: ${request.params.name}`);
    }
});

// ── HTTP handlers ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const auth = await requireSuperAdmin(req);
    if (!auth.ok) return auth.response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SSE transport expects a response constructor-like object
    const transport = new SSEServerTransport("/api/superadmin/mcp/messages", NextResponse as any);
    await mcpServer.connect(transport);
    return NextResponse.json({ status: "streaming_ready", endpoint: "/api/superadmin/mcp/messages", tool_count: 26 });
}

export async function POST(req: NextRequest) {
    const auth = await requireSuperAdmin(req);
    if (!auth.ok) return auth.response;
    return NextResponse.json({ status: "ok" });
}
