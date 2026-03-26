/**
 * TripBuilt WhatsApp Assistant — Command Router
 *
 * Routes operator messages in the assistant group to the appropriate
 * handler: keyword commands for instant data, or AI for natural language.
 *
 * All handlers return a formatted WhatsApp message string.
 * The router itself never throws — errors are caught and returned as
 * user-friendly error messages.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { ContextSnapshot } from "@/lib/assistant/types";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEvolutionText } from "@/lib/whatsapp-evolution.server";
import { getCachedContextSnapshot } from "@/lib/assistant/context-engine";
import { formatBriefingMessage } from "@/lib/assistant/briefing";
import {
    formatDashboard,
    formatHelpMenu,
    formatLeads,
    formatPendingPayments,
    formatRevenue,
    formatTripsToday,
} from "./assistant-formatters";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdminClient = SupabaseClient<Database>;

interface CommandContext {
    readonly admin: AdminClient;
    readonly orgId: string;
    readonly instanceName: string;
    readonly groupJid: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Minimum message length to trigger AI fallback (skip "ok", "👍", etc.) */
const MIN_AI_MESSAGE_LENGTH = 4;

/** Pattern for messages that are just emoji / reactions */
const EMOJI_ONLY_RE = /^[\p{Emoji_Presentation}\p{Emoji}\s]+$/u;

// ---------------------------------------------------------------------------
// Keyword map
// ---------------------------------------------------------------------------

const KEYWORD_ALIASES: Record<string, string> = {
    // Help
    "help": "help",
    "?": "help",
    "menu": "help",
    "commands": "help",

    // Today's trips
    "today": "today",
    "trips": "today",
    "pickups": "today",
    "pickup": "today",
    "trips today": "today",

    // Leads
    "leads": "leads",
    "lead": "leads",
    "new": "leads",
    "inbox": "leads",

    // Payments
    "payments": "payments",
    "payment": "payments",
    "pending": "payments",
    "due": "payments",

    // Revenue
    "revenue": "revenue",
    "money": "revenue",
    "earnings": "revenue",
    "income": "revenue",

    // Dashboard
    "stats": "stats",
    "dashboard": "stats",
    "overview": "stats",

    // Briefing
    "brief": "brief",
    "briefing": "brief",
    "summary": "brief",
    "morning": "brief",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Route an operator message from the assistant group.
 * Returns true if the message was handled, false if it should be ignored.
 */
export async function routeAssistantCommand(
    instanceName: string,
    groupJid: string,
    message: string,
): Promise<boolean> {
    const admin = createAdminClient();

    // Resolve the org from the session name
    const { data: rawConn } = await admin
        .from("whatsapp_connections")
        .select("organization_id, assistant_group_jid")
        .eq("session_name", instanceName)
        .maybeSingle();
    const conn = rawConn as {
        organization_id?: string;
        assistant_group_jid?: string;
    } | null;

    // Only handle messages in the actual assistant group
    if (!conn?.assistant_group_jid || conn.assistant_group_jid !== groupJid) {
        return false;
    }

    const orgId = conn.organization_id as string;
    const ctx: CommandContext = { admin, orgId, instanceName, groupJid };

    const normalised = message.trim().toLowerCase();
    const command = KEYWORD_ALIASES[normalised];

    let reply: string;

    try {
        if (command) {
            reply = await handleKeywordCommand(ctx, command);
        } else if (shouldTriggerAI(normalised)) {
            reply = await handleNaturalLanguage(ctx, message);
        } else {
            // Short / emoji / casual message — don't respond
            return true;
        }
    } catch (err) {
        logError("[assistant-commands] command failed", err);
        reply = "⚠️ Something went wrong. Please try again or type *help*.";
    }

    if (reply) {
        await sendEvolutionText(instanceName, groupJid, reply).catch((err) => {
            logError("[assistant-commands] Failed to send reply", err);
        });
    }

    return true;
}

// ---------------------------------------------------------------------------
// AI trigger filter — avoid firing on casual chat
// ---------------------------------------------------------------------------

/** Determine if a message warrants an AI response. */
function shouldTriggerAI(normalised: string): boolean {
    // Too short — likely "ok", "ya", "no"
    if (normalised.length < MIN_AI_MESSAGE_LENGTH) return false;

    // Emoji-only
    if (EMOJI_ONLY_RE.test(normalised)) return false;

    // Common acknowledgements that shouldn't trigger AI
    const skipPhrases = [
        "ok", "okay", "fine", "thanks", "thank you", "noted",
        "done", "yes", "no", "sure", "alright", "cool", "great",
        "good", "nice", "perfect", "awesome", "got it",
    ];
    if (skipPhrases.includes(normalised)) return false;

    return true;
}

// ---------------------------------------------------------------------------
// Keyword command dispatcher
// ---------------------------------------------------------------------------

async function handleKeywordCommand(
    ctx: CommandContext,
    command: string,
): Promise<string> {
    switch (command) {
        case "help":
            return formatHelpMenu();

        case "today":
            return handleTodayCommand(ctx);

        case "leads":
            return handleLeadsCommand(ctx);

        case "payments":
            return handlePaymentsCommand(ctx);

        case "revenue":
            return handleRevenueCommand(ctx);

        case "stats":
            return handleStatsCommand(ctx);

        case "brief":
            return handleBriefCommand(ctx);

        default:
            return formatHelpMenu();
    }
}

// ---------------------------------------------------------------------------
// Individual command handlers
// ---------------------------------------------------------------------------

async function handleTodayCommand(ctx: CommandContext): Promise<string> {
    const snapshot = await getSnapshot(ctx);
    return formatTripsToday(snapshot.todayTrips);
}

async function handlePaymentsCommand(ctx: CommandContext): Promise<string> {
    const snapshot = await getSnapshot(ctx);
    return formatPendingPayments(snapshot.pendingInvoices);
}

async function handleLeadsCommand(ctx: CommandContext): Promise<string> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: rawEvents } = await ctx.admin
        .from("whatsapp_webhook_events")
        .select("wa_id, metadata")
        .filter("metadata->>direction", "eq", "in")
        .gte("created_at", yesterday)
        .order("created_at", { ascending: false })
        .limit(15);

    const events = (rawEvents ?? []) as ReadonlyArray<{
        wa_id: string;
        metadata: Record<string, unknown> | null;
    }>;

    // Deduplicate by wa_id
    const seen = new Set<string>();
    const unique = events.filter((e) => {
        if (seen.has(e.wa_id)) return false;
        seen.add(e.wa_id);
        return true;
    });

    const leads = unique.map((e) => {
        const meta = e.metadata as {
            body_preview?: string;
            pushName?: string;
        } | null;
        return {
            phone: e.wa_id,
            name: meta?.pushName ?? null,
            preview: meta?.body_preview ?? "",
        };
    });

    return formatLeads(leads);
}

async function handleRevenueCommand(ctx: CommandContext): Promise<string> {
    const now = new Date();
    const monthName = MONTH_NAMES[now.getMonth()] ?? "";
    const lastMonthName = MONTH_NAMES[(now.getMonth() - 1 + 12) % 12] ?? "";

    const { totalRupees: currentTotal, count: currentCount } =
        await getMonthlyRevenue(ctx.admin, ctx.orgId, now.getFullYear(), now.getMonth());

    const lastMonth = now.getMonth() === 0
        ? { year: now.getFullYear() - 1, month: 11 }
        : { year: now.getFullYear(), month: now.getMonth() - 1 };
    const { totalRupees: lastTotal } =
        await getMonthlyRevenue(ctx.admin, ctx.orgId, lastMonth.year, lastMonth.month);

    return formatRevenue(currentTotal, lastTotal, monthName, lastMonthName, currentCount);
}

async function handleStatsCommand(ctx: CommandContext): Promise<string> {
    const now = new Date();
    const monthName = MONTH_NAMES[now.getMonth()] ?? "";

    const [snapshot, { totalRupees }] = await Promise.all([
        getSnapshot(ctx),
        getMonthlyRevenue(ctx.admin, ctx.orgId, now.getFullYear(), now.getMonth()),
    ]);

    return formatDashboard(snapshot, totalRupees, monthName);
}

async function handleBriefCommand(ctx: CommandContext): Promise<string> {
    const [snapshot, org] = await Promise.all([
        getSnapshot(ctx),
        ctx.admin
            .from("organizations")
            .select("name")
            .eq("id", ctx.orgId)
            .maybeSingle()
            .then((r) => r.data),
    ]);

    return formatBriefingMessage(snapshot, (org?.name as string) ?? "Your Business");
}

// ---------------------------------------------------------------------------
// Natural language handler (AI-powered)
// ---------------------------------------------------------------------------

async function handleNaturalLanguage(
    ctx: CommandContext,
    message: string,
): Promise<string> {
    const { getGeminiModel } = await import("@/lib/ai/gemini.server");
    const snapshot = await getSnapshot(ctx);

    const systemPrompt = buildNLSystemPrompt(snapshot);

    try {
        const model = getGeminiModel();
        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "user", parts: [{ text: message }] },
            ],
            generationConfig: {
                maxOutputTokens: 400,
                temperature: 0.3,
            },
        });

        const text = result.response.text()?.trim();
        if (!text) {
            return "🤔 I couldn't understand that. Try *help* for available commands.";
        }

        return text;
    } catch (err) {
        logError("[assistant-commands] AI generation failed", err);
        return "🤔 I couldn't process that right now. Try a keyword like *today*, *leads*, or *payments*.";
    }
}

function buildNLSystemPrompt(snapshot: ContextSnapshot): string {
    const tripLines = snapshot.todayTrips.map(
        (t) => `- ${t.clientName ?? "Unknown"}: ${t.status ?? "active"} (${t.startDate} → ${t.endDate})`,
    );

    const invoiceLines = snapshot.pendingInvoices.map(
        (inv) => `- ${inv.clientName ?? "Unknown"}: ₹${inv.balanceAmount.toLocaleString("en-IN")} ${inv.status} (due ${inv.dueDate ?? "N/A"})`,
    );

    const clientLines = snapshot.recentClients.map(
        (c) => `- ${c.name ?? "Unknown"}: ${c.lifecycleStage ?? "unknown"} stage`,
    );

    return [
        "You are TripBuilt Assistant, a WhatsApp business assistant for an Indian travel operator.",
        "Answer the operator's question using ONLY the business data below. Be concise (max 300 chars).",
        "Use WhatsApp formatting: *bold*, _italic_. Use ₹ for currency. Use Indian number format.",
        "If you cannot answer from the data, say so and suggest a keyword command.",
        "",
        `*Today's Trips (${snapshot.todayTrips.length}):*`,
        tripLines.length > 0 ? tripLines.join("\n") : "None",
        "",
        `*Pending Invoices (${snapshot.pendingInvoices.length}):*`,
        invoiceLines.length > 0 ? invoiceLines.join("\n") : "None",
        "",
        `*Recent Clients (${snapshot.recentClients.length}):*`,
        clientLines.length > 0 ? clientLines.join("\n") : "None",
        "",
        `*Failed Notifications:* ${snapshot.failedNotifications.length}`,
        `*Data as of:* ${snapshot.generatedAt}`,
    ].join("\n");
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Cached context snapshot — reuses 5-min TTL cache, avoids 4 DB queries per command. */
async function getSnapshot(ctx: CommandContext) {
    return getCachedContextSnapshot({
        organizationId: ctx.orgId,
        userId: "system",
        channel: "whatsapp",
        supabase: ctx.admin,
    });
}

/** Monthly revenue from paid invoices, using `paid_at` for accurate date attribution. */
async function getMonthlyRevenue(
    admin: AdminClient,
    orgId: string,
    year: number,
    month: number,
): Promise<{ totalRupees: number; count: number }> {
    const monthStart = new Date(year, month, 1).toISOString();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data } = await admin
        .from("invoices")
        .select("total_amount")
        .eq("organization_id", orgId)
        .eq("status", "paid")
        .gte("paid_at", monthStart)
        .lte("paid_at", monthEnd);

    const rows = (data ?? []) as ReadonlyArray<{ total_amount: number }>;
    const totalRupees = rows.reduce((s, r) => s + (r.total_amount ?? 0), 0);
    return { totalRupees, count: rows.length };
}
