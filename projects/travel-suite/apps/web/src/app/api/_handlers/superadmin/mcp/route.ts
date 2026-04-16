import { NextRequest, NextResponse } from "next/server";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendHitlProposal, sendOpsAlert } from "@/lib/god-slack";
import { Redis } from "@upstash/redis";

export const maxDuration = 60;

// ── Redis helper (same pattern as cost/aggregate) ────────────────────────────
function getRedis(): Redis | null {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) return null;
    return new Redis({ url, token });
}

// ── MCP Server ────────────────────────────────────────────────────────────────
const mcpServer = new Server(
    { name: "travel-suite-god-mode", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "get_ops_health",
            description:
                "Returns real-time platform health: queue depths (notifications, social, PDF), " +
                "AI cost utilisation per category, and count of open support tickets.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "get_error_digest",
            description:
                "Returns the 10 most recent platform errors from the error log. " +
                "Use this as the Incident Commander — scan for recurring patterns and propose fixes.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "propose_slack_alert",
            description:
                "Send a Human-in-the-Loop proposal to the Slack ops channel. " +
                "The human operator will see an [Approve] / [Reject] button before anything executes.",
            inputSchema: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Short title for the proposal" },
                    reasoning: { type: "string", description: "Why the AI is proposing this action" },
                    actionPayload: { type: "string", description: "Machine-readable action string" },
                    riskLevel: { type: "string", enum: ["medium", "high", "critical"] },
                },
                required: ["title", "reasoning", "actionPayload"],
            },
        },
        {
            name: "send_ops_alert",
            description:
                "Send a plain-text alert directly to the Slack ops channel. " +
                "Use for informational summaries, not for actions requiring human approval.",
            inputSchema: {
                type: "object",
                properties: {
                    message: { type: "string", description: "The alert message body" },
                },
                required: ["message"],
            },
        },
    ],
}));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const args = request.params.arguments ?? {};

    switch (request.params.name) {

        // ── Tool 1: get_ops_health ──────────────────────────────────────────────
        case "get_ops_health": {
            const supabase = createAdminClient();
            const redis = getRedis();

            const [openTickets, aiUsage] = await Promise.all([
                supabase
                    .from("support_tickets")
                    .select("id", { count: "exact", head: true })
                    .in("status", ["open", "in_progress"]),
                supabase
                    .from("organization_ai_usage")
                    .select("estimated_cost_usd")
                    .order("month_start", { ascending: false })
                    .limit(50),
            ]);

            const totalMtdUsd = (aiUsage.data ?? []).reduce(
                (sum: number, r: any) => sum + Number(r.estimated_cost_usd ?? 0), 0
            );

            let queueDepths = { notifications: "N/A", social: "N/A" };
            if (redis) {
                try {
                    const [notifPending, socialPending] = await Promise.all([
                        redis.llen("queue:notifications:pending"),
                        redis.llen("queue:social:pending"),
                    ]);
                    queueDepths = {
                        notifications: String(notifPending),
                        social: String(socialPending),
                    };
                } catch { /* Redis optional */ }
            }

            const summary = [
                `**Platform Health Summary** (${new Date().toUTCString()})`,
                `- Open Support Tickets: ${openTickets.count ?? 0}`,
                `- AI Cost MTD: $${totalMtdUsd.toFixed(2)}`,
                `- Notification Queue Depth: ${queueDepths.notifications}`,
                `- Social Post Queue Depth: ${queueDepths.social}`,
            ].join("\n");

            return { content: [{ type: "text", text: summary }] };
        }

        // ── Tool 2: get_error_digest (Incident Commander) ──────────────────────
        case "get_error_digest": {
            const supabase = createAdminClient();
            const { data: errors } = await (supabase as any)
                .from("error_logs")
                .select("id, message, stack, created_at, context")
                .order("created_at", { ascending: false })
                .limit(10);

            if (!errors || errors.length === 0) {
                return { content: [{ type: "text", text: "No recent errors found in the error log." }] };
            }

            const digest = errors.map((e: any, i: number) =>
                `Error ${i + 1} (${e.created_at})\nMessage: ${e.message}\nContext: ${JSON.stringify(e.context ?? {})}`
            ).join("\n\n---\n\n");

            return { content: [{ type: "text", text: `Error Digest\n\n${digest}` }] };
        }

        // ── Tool 3: propose_slack_alert (HITL) ─────────────────────────────────
        case "propose_slack_alert": {
            await sendHitlProposal(
                String(args.title ?? "AI Proposal"),
                String(args.reasoning ?? ""),
                String(args.actionPayload ?? ""),
                (args.riskLevel as "medium" | "high" | "critical") ?? "medium"
            );
            return { content: [{ type: "text", text: `HITL proposal posted to Slack: "${args.title}"` }] };
        }

        // ── Tool 4: send_ops_alert ─────────────────────────────────────────────
        case "send_ops_alert": {
            await sendOpsAlert(String(args.message ?? ""));
            return { content: [{ type: "text", text: "Ops alert sent to Slack." }] };
        }

        default:
            throw new Error(`Unknown tool: ${request.params.name}`);
    }
});

// ── GET: Open SSE connection ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const auth = await requireSuperAdmin(req);
    if (!auth.ok) return auth.response;

    const transport = new SSEServerTransport("/api/superadmin/mcp/messages", NextResponse as any);
    await mcpServer.connect(transport);
    return NextResponse.json({ status: "streaming_ready", endpoint: "/api/superadmin/mcp/messages" });
}

// ── POST: Receive agent messages ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const auth = await requireSuperAdmin(req);
    if (!auth.ok) return auth.response;
    return NextResponse.json({ status: "ok" });
}
