import "server-only";

import type { ActionContext, OwnerAgenda, SuggestedAction } from "./types";
import { getCachedContextSnapshot } from "./context-engine";
import { generateDailyOpsBrief } from "@/lib/platform/business-os";

const AGENDA_CACHE_TTL_MS = 5 * 60 * 1000;

interface AgendaCacheEntry {
  readonly agenda: OwnerAgenda;
  readonly expiresAt: number;
}

const agendaCache = new Map<string, AgendaCacheEntry>();

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(date: string | null): boolean {
  return date !== null && date < todayISO();
}

function takeMax<T>(items: readonly T[], max: number): readonly T[] {
  return items.slice(0, max);
}

function buildFallbackSummary(snapshot: Awaited<ReturnType<typeof getCachedContextSnapshot>>): string {
  const parts: string[] = [];
  if (snapshot.todayTrips.length > 0) parts.push(`${snapshot.todayTrips.length} trip${snapshot.todayTrips.length === 1 ? "" : "s"} active today`);
  if (snapshot.pendingInvoices.length > 0) parts.push(`${snapshot.pendingInvoices.length} pending payment${snapshot.pendingInvoices.length === 1 ? "" : "s"}`);
  if (snapshot.failedNotifications.length > 0) parts.push(`${snapshot.failedNotifications.length} failed notification${snapshot.failedNotifications.length === 1 ? "" : "s"}`);
  return parts.length > 0 ? parts.join(" • ") : "No urgent issues detected right now.";
}

async function getActiveWhatsappSessionName(ctx: ActionContext): Promise<string | null> {
  const { data } = await ctx.supabase
    .from("whatsapp_connections")
    .select("session_name")
    .eq("organization_id", ctx.organizationId)
    .eq("status", "connected")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.session_name ?? null;
}

async function loadNeedsResponse(
  ctx: ActionContext,
  sessionName: string | null,
): Promise<readonly string[]> {
  if (!sessionName) return [];

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await ctx.supabase
    .from("whatsapp_webhook_events")
    .select("wa_id, metadata")
    .filter("metadata->>direction", "eq", "in")
    .filter("metadata->>session", "eq", sessionName)
    .gte("created_at", yesterday)
    .order("created_at", { ascending: false })
    .limit(12);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const row of (data ?? []) as Array<{ wa_id: string; metadata: Record<string, unknown> | null }>) {
    if (seen.has(row.wa_id)) continue;
    seen.add(row.wa_id);
    const meta = row.metadata ?? {};
    const name = typeof meta.pushName === "string" && meta.pushName.trim() ? meta.pushName.trim() : row.wa_id;
    const preview = typeof meta.body_preview === "string" ? meta.body_preview.trim() : "";
    result.push(preview ? `${name} — "${preview.slice(0, 60)}"` : name);
    if (result.length >= 3) break;
  }

  return result;
}

async function loadTripRisks(ctx: ActionContext): Promise<readonly string[]> {
  const today = todayISO();
  const { data } = await ctx.supabase
    .from("trips")
    .select("id, status, start_date, end_date, driver_id, profiles!trips_client_id_fkey(full_name)")
    .eq("organization_id", ctx.organizationId)
    .gte("end_date", today)
    .lte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(12);

  const risks: string[] = [];
  for (const row of (data ?? []) as Array<{
    id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    driver_id: string | null;
    profiles: { full_name: string | null } | null;
  }>) {
    const client = row.profiles?.full_name ?? "Unknown client";
    if (!row.driver_id) {
      risks.push(`${client} — no driver assigned`);
    } else if (row.status === "planned" || row.status === "pending") {
      risks.push(`${client} — trip is still ${row.status}`);
    }
    if (risks.length >= 3) break;
  }

  return risks;
}

function buildCollectionsActions(snapshot: Awaited<ReturnType<typeof getCachedContextSnapshot>>): readonly string[] {
  return takeMax(
    snapshot.pendingInvoices
      .filter((invoice) => isOverdue(invoice.dueDate))
      .sort((left, right) => (left.dueDate ?? "").localeCompare(right.dueDate ?? ""))
      .map((invoice) => `${invoice.clientName ?? "Unknown"} — ${invoice.currency} ${invoice.balanceAmount.toLocaleString("en-IN")} overdue`),
    3,
  );
}

function buildRecommendedActions(agenda: {
  readonly tripRisks: readonly string[];
  readonly collectionsActions: readonly string[];
  readonly needsResponse: readonly string[];
}): readonly SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  if (agenda.needsResponse.length > 0) {
    actions.push({ label: "Review leads", prefilledMessage: "leads" });
  }
  if (agenda.collectionsActions.length > 0) {
    actions.push({ label: "Review payments", prefilledMessage: "payments" });
  }
  if (agenda.tripRisks.length > 0) {
    actions.push({ label: "Review trips", prefilledMessage: "today" });
  }

  actions.push({ label: "Daily brief", prefilledMessage: "brief" });
  return takeMax(actions, 4);
}

export async function buildOwnerAgenda(ctx: ActionContext): Promise<OwnerAgenda> {
  const key = `${ctx.organizationId}:${ctx.userId}`;
  const cached = agendaCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.agenda;
  }

  const snapshot = await getCachedContextSnapshot(ctx);
  const sessionName = await getActiveWhatsappSessionName(ctx).catch(() => null);
  const [brief, needsResponse, tripRisks] = await Promise.all([
    generateDailyOpsBrief(ctx.supabase as never, ctx.userId).catch(() => null),
    loadNeedsResponse(ctx, sessionName).catch(() => [] as const),
    loadTripRisks(ctx).catch(() => [] as const),
  ]);

  const collectionsActions = buildCollectionsActions(snapshot);
  const fallbackPriorities = [
    ...tripRisks,
    ...collectionsActions,
    ...needsResponse.map((item) => `Customer follow-up needed — ${item}`),
  ];

  const agenda: OwnerAgenda = {
    headline: brief?.headline ?? "Your WhatsApp operations agenda is ready.",
    summary: brief?.summary ?? buildFallbackSummary(snapshot),
    queueFocus: brief?.queue_focus ?? "Clear the most urgent customer, payment, and trip issues first.",
    topPriorities: takeMax(brief?.priorities ?? fallbackPriorities, 4),
    gaps: takeMax(brief?.gaps ?? [], 3),
    needsResponse,
    collectionsActions,
    tripRisks,
    recommendedNextActions: buildRecommendedActions({ tripRisks, collectionsActions, needsResponse }),
    generatedAt: new Date().toISOString(),
    source: brief ? "business_os" : "fallback",
  };

  agendaCache.set(key, {
    agenda,
    expiresAt: Date.now() + AGENDA_CACHE_TTL_MS,
  });

  return agenda;
}

export function buildOwnerAgendaPromptBlock(agenda: OwnerAgenda): string {
  const sections: string[] = [
    "## Owner Operating Agenda",
    `Headline: ${agenda.headline}`,
    `Summary: ${agenda.summary}`,
    `Queue focus: ${agenda.queueFocus}`,
  ];

  if (agenda.topPriorities.length > 0) {
    sections.push("\n### Top priorities");
    sections.push(agenda.topPriorities.map((item) => `- ${item}`).join("\n"));
  }

  if (agenda.gaps.length > 0) {
    sections.push("\n### Operating gaps");
    sections.push(agenda.gaps.map((item) => `- ${item}`).join("\n"));
  }

  if (agenda.needsResponse.length > 0) {
    sections.push("\n### Needs response");
    sections.push(agenda.needsResponse.map((item) => `- ${item}`).join("\n"));
  }

  if (agenda.collectionsActions.length > 0) {
    sections.push("\n### Collections");
    sections.push(agenda.collectionsActions.map((item) => `- ${item}`).join("\n"));
  }

  if (agenda.tripRisks.length > 0) {
    sections.push("\n### Trip risks");
    sections.push(agenda.tripRisks.map((item) => `- ${item}`).join("\n"));
  }

  return sections.join("\n");
}

export function formatOwnerAgenda(agenda: OwnerAgenda): string {
  const lines: string[] = [
    `🧭 *${agenda.headline}*`,
    agenda.summary,
    "",
    `*Queue focus:* ${agenda.queueFocus}`,
  ];

  if (agenda.topPriorities.length > 0) {
    lines.push("", "*Top priorities:*");
    lines.push(...takeMax(agenda.topPriorities, 4).map((item, index) => `${index + 1}. ${item}`));
  }

  if (agenda.gaps.length > 0) {
    lines.push("", "*Operating gaps:*");
    lines.push(...takeMax(agenda.gaps, 3).map((item) => `• ${item}`));
  }

  if (agenda.needsResponse.length > 0) {
    lines.push("", "*Needs response:*");
    lines.push(...takeMax(agenda.needsResponse, 3).map((item) => `• ${item}`));
  }

  if (agenda.collectionsActions.length > 0) {
    lines.push("", "*Collections to review:*");
    lines.push(...takeMax(agenda.collectionsActions, 3).map((item) => `• ${item}`));
  }

  if (agenda.tripRisks.length > 0) {
    lines.push("", "*Trip risks today:*");
    lines.push(...takeMax(agenda.tripRisks, 3).map((item) => `• ${item}`));
  }

  if (agenda.recommendedNextActions.length > 0) {
    lines.push("", "*Do next:*");
    lines.push(
      ...agenda.recommendedNextActions.map(
        (action) => `• ${action.label} — reply *${action.prefilledMessage}*`,
      ),
    );
  }

  return lines.join("\n");
}
