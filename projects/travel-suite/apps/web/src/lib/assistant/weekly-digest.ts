import "server-only";

/* ------------------------------------------------------------------
 * Weekly Insights Digest -- zero-cost performance summary.
 *
 * Generates a weekly business insights message from direct DB queries.
 * No LLM call needed ($0.00 per digest).
 *
 * Insights include:
 *   - Revenue comparison (this week vs last week)
 *   - Trip completion rate
 *   - New clients acquired
 *   - Proposals conversion rate
 *   - Overdue invoice aging
 *
 * All queries use the admin client to bypass RLS.
 * ------------------------------------------------------------------ */

import type { ActionContext } from "./types";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "./prompts/system";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeeklyInsights {
  readonly periodLabel: string;
  readonly totalRevenue: number;
  readonly lastWeekRevenue: number;
  readonly revenueChange: number;
  readonly tripsCompleted: number;
  readonly tripsTotal: number;
  readonly newClients: number;
  readonly proposalsSent: number;
  readonly proposalsAccepted: number;
  readonly overdueInvoiceCount: number;
  readonly overdueTotal: number;
  readonly currency: string;
}

interface EligibleDigestOrg {
  readonly organizationId: string;
  readonly userId: string;
  readonly phone: string;
  readonly orgName: string;
}

interface DigestResult {
  readonly queued: number;
  readonly skipped: number;
  readonly errors: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function weekAgoISO(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function twoWeeksAgoISO(): string {
  return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Insight builder
// ---------------------------------------------------------------------------

async function buildWeeklyInsights(
  ctx: ActionContext,
): Promise<WeeklyInsights> {
  const weekAgo = weekAgoISO();
  const twoWeeksAgo = twoWeeksAgoISO();
  const now = new Date().toISOString();

  // Run all queries in parallel
  const [
    thisWeekInvoices,
    lastWeekInvoices,
    thisWeekTrips,
    newClients,
    proposals,
    overdueInvoices,
  ] = await Promise.all([
    // This week's paid invoices (revenue)
    ctx.supabase
      .from("invoices")
      .select("total_amount, currency")
      .eq("organization_id", ctx.organizationId)
      .eq("status", "paid")
      .gte("updated_at", weekAgo)
      .lt("updated_at", now),

    // Last week's paid invoices
    ctx.supabase
      .from("invoices")
      .select("total_amount")
      .eq("organization_id", ctx.organizationId)
      .eq("status", "paid")
      .gte("updated_at", twoWeeksAgo)
      .lt("updated_at", weekAgo),

    // This week's trips
    ctx.supabase
      .from("trips")
      .select("id, status")
      .eq("organization_id", ctx.organizationId)
      .gte("created_at", weekAgo),

    // New clients this week
    ctx.supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", ctx.organizationId)
      .gte("created_at", weekAgo)
      .not("lifecycle_stage", "is", null),

    // Proposals this week
    ctx.supabase
      .from("proposals")
      .select("id, status")
      .eq("organization_id", ctx.organizationId)
      .gte("created_at", weekAgo),

    // Overdue invoices
    ctx.supabase
      .from("invoices")
      .select("balance_amount, currency")
      .eq("organization_id", ctx.organizationId)
      .in("status", ["overdue", "issued"])
      .lt("due_date", todayISO()),
  ]);

  // Calculate metrics
  const thisWeekRev = (thisWeekInvoices.data ?? []).reduce(
    (sum, inv) => sum + (Number(inv.total_amount) || 0),
    0,
  );
  const lastWeekRev = (lastWeekInvoices.data ?? []).reduce(
    (sum, inv) => sum + (Number(inv.total_amount) || 0),
    0,
  );

  const trips = thisWeekTrips.data ?? [];
  const completedTrips = trips.filter(
    (t) => t.status === "completed" || t.status === "delivered",
  );

  const allProposals = proposals.data ?? [];
  const acceptedProposals = allProposals.filter(
    (p) => p.status === "accepted" || p.status === "confirmed",
  );

  const overdue = overdueInvoices.data ?? [];
  const overdueTotal = overdue.reduce(
    (sum, inv) => sum + (Number(inv.balance_amount) || 0),
    0,
  );

  const currency = (thisWeekInvoices.data ?? [])[0]?.currency ?? "INR";

  const revenueChange =
    lastWeekRev > 0
      ? Math.round(((thisWeekRev - lastWeekRev) / lastWeekRev) * 100)
      : 0;

  return {
    periodLabel: `Week of ${new Date(weekAgo).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    totalRevenue: thisWeekRev,
    lastWeekRevenue: lastWeekRev,
    revenueChange,
    tripsCompleted: completedTrips.length,
    tripsTotal: trips.length,
    newClients: (newClients.data ?? []).length,
    proposalsSent: allProposals.length,
    proposalsAccepted: acceptedProposals.length,
    overdueInvoiceCount: overdue.length,
    overdueTotal,
    currency,
  };
}

// ---------------------------------------------------------------------------
// Message formatter
// ---------------------------------------------------------------------------

export function formatDigestMessage(
  insights: WeeklyInsights,
  orgName: string,
): string {
  const sections: string[] = [];

  sections.push(`*Weekly Business Insights for ${orgName}*`);
  sections.push(`_${insights.periodLabel}_`);

  // Revenue
  const arrow = insights.revenueChange >= 0 ? "up" : "down";
  const changeText =
    insights.revenueChange !== 0
      ? ` (${insights.revenueChange > 0 ? "+" : ""}${insights.revenueChange}% vs last week)`
      : "";
  sections.push(
    `\n*Revenue:* ${formatCurrency(insights.totalRevenue, insights.currency)}${changeText} -- trending ${arrow}`,
  );

  // Trips
  const tripRate =
    insights.tripsTotal > 0
      ? Math.round((insights.tripsCompleted / insights.tripsTotal) * 100)
      : 0;
  sections.push(
    `*Trips:* ${insights.tripsCompleted}/${insights.tripsTotal} completed (${tripRate}% rate)`,
  );

  // Clients
  sections.push(`*New Clients:* ${insights.newClients}`);

  // Proposals
  const convRate =
    insights.proposalsSent > 0
      ? Math.round(
          (insights.proposalsAccepted / insights.proposalsSent) * 100,
        )
      : 0;
  sections.push(
    `*Proposals:* ${insights.proposalsAccepted}/${insights.proposalsSent} converted (${convRate}%)`,
  );

  // Overdue
  if (insights.overdueInvoiceCount > 0) {
    sections.push(
      `\n*Overdue:* ${insights.overdueInvoiceCount} invoices totaling ${formatCurrency(insights.overdueTotal, insights.currency)}`,
    );
  } else {
    sections.push("\nNo overdue invoices!");
  }

  sections.push("\nReply with any question to dive deeper!");

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// Eligible org discovery
// ---------------------------------------------------------------------------

export async function getEligibleOrgsForDigest(): Promise<
  ReadonlyArray<EligibleDigestOrg>
> {
  try {
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prefRows, error: prefError } = await (supabase as any)
      .from("assistant_preferences")
      .select("organization_id, user_id")
      .eq("preference_key", "weekly_digest_enabled")
      .eq("preference_value", true);

    if (prefError || !prefRows || prefRows.length === 0) {
      return [];
    }

    const typedRows = prefRows as ReadonlyArray<{
      organization_id: string;
      user_id: string;
    }>;

    const userIds = typedRows.map((r) => r.user_id);

    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, phone_normalized, organization_id")
      .in("id", userIds)
      .not("phone_normalized", "is", null);

    if (profileError || !profileRows) return [];

    const phoneByUserId = new Map(
      profileRows.map((p) => [p.id, p.phone_normalized ?? ""]),
    );

    const orgIds = [...new Set(typedRows.map((r) => r.organization_id))];

    const { data: orgRows, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .in("id", orgIds);

    if (orgError || !orgRows) return [];

    const orgNameById = new Map(orgRows.map((o) => [o.id, o.name]));

    const results: EligibleDigestOrg[] = [];
    for (const pref of typedRows) {
      const phone = phoneByUserId.get(pref.user_id);
      if (!phone) continue;
      results.push({
        organizationId: pref.organization_id,
        userId: pref.user_id,
        phone,
        orgName:
          orgNameById.get(pref.organization_id) ?? "Your Organisation",
      });
    }
    return results;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Batch digest generator
// ---------------------------------------------------------------------------

export async function generateAndQueueDigests(): Promise<DigestResult> {
  const eligible = await getEligibleOrgsForDigest();
  if (eligible.length === 0) return { queued: 0, skipped: 0, errors: 0 };

  const supabase = createAdminClient();
  const dateKey = todayISO();
  let queued = 0;
  let skipped = 0;
  let errors = 0;

  const seenOrgs = new Set<string>();

  for (const entry of eligible) {
    if (seenOrgs.has(entry.organizationId)) continue;
    seenOrgs.add(entry.organizationId);

    try {
      const insights = await buildWeeklyInsights({
        organizationId: entry.organizationId,
        userId: entry.userId,
        channel: "whatsapp",
        supabase,
      });

      const message = formatDigestMessage(insights, entry.orgName);
      const idempotencyKey = `${entry.organizationId}:digest:${dateKey}`;

      const { error: insertError } = await supabase
        .from("notification_queue")
        .insert({
          notification_type: "weekly_digest",
          channel_preference: "whatsapp",
          user_id: entry.userId,
          recipient_phone: entry.phone,
          scheduled_for: new Date().toISOString(),
          idempotency_key: idempotencyKey,
          status: "pending",
          attempts: 0,
          payload: { message, org_name: entry.orgName },
        });

      if (insertError) {
        if (insertError.code === "23505") {
          skipped += 1;
        } else {
          errors += 1;
        }
      } else {
        queued += 1;
      }
    } catch {
      errors += 1;
    }
  }

  return { queued, skipped, errors };
}
