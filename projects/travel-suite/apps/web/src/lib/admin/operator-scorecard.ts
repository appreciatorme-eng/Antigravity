import "server-only";

import { resolveWindow } from "@/lib/analytics/adapters";
import { createAdminClient } from "@/lib/supabase/admin";
import { sessionNameFromOrgId } from "@/lib/whatsapp-evolution.server";
import type { Database, Json } from "@/lib/database.types";

type AdminClient = ReturnType<typeof createAdminClient>;
type ScorecardUpsertClient = {
  from: (table: "operator_scorecards") => {
    upsert: (
      values: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => {
      select: (columns: string) => {
        single: () => Promise<{ data: ScorecardRow | null; error: Error | null }>;
      };
    };
  };
};
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProposalRow = Pick<
  Database["public"]["Tables"]["proposals"]["Row"],
  "id" | "status" | "created_at" | "updated_at"
>;
type PaymentLinkRow = Pick<
  Database["public"]["Tables"]["payment_links"]["Row"],
  "id" | "status" | "amount_paise" | "created_at" | "paid_at"
>;
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email">;
type WebhookEventRow = Pick<
  Database["public"]["Tables"]["whatsapp_webhook_events"]["Row"],
  "wa_id" | "received_at" | "metadata"
>;
type CacheEventRow = {
  event_type: string;
  cache_source: string;
  created_at: string | null;
};
type ScorecardRow = {
  id: string;
  organization_id: string;
  month_key: string;
  score: number;
  status: string;
  payload: Json;
  pdf_generated_at: string | null;
  emailed_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type ReviewRecord = {
  id: string;
  rating: number;
  review_date: string;
  response_status: string | null;
  response_posted_at: string | null;
};

const APPROVED_PROPOSAL_STATUSES = new Set(["approved", "accepted", "confirmed", "converted"]);
const CACHE_EVENT_SELECT = "event_type, cache_source, created_at";
const SCORECARD_SELECT = [
  "created_at",
  "emailed_at",
  "id",
  "last_error",
  "month_key",
  "organization_id",
  "payload",
  "pdf_generated_at",
  "score",
  "status",
  "updated_at",
].join(", ");

export interface OperatorScorecardMetrics {
  revenueInr: number;
  proposalsCreated: number;
  proposalsApproved: number;
  approvalRate: number;
  linksSent: number;
  paymentsCollected: number;
  paymentConversionRate: number;
  avgPaidValueInr: number;
  reviewsReceived: number;
  reviewResponseRate: number | null;
  averageRating: number | null;
  avgWhatsAppReplyMinutes: number | null;
  whatsappInboundCount: number;
  whatsappOutboundCount: number;
  cacheHitRate: number | null;
  cacheHits: number;
  cacheMisses: number;
}

export interface OperatorScorecardComparison {
  revenueDeltaPct: number | null;
  proposalDeltaPct: number | null;
  paymentDeltaPct: number | null;
  approvalDeltaPct: number | null;
  reviewResponseDeltaPct: number | null;
  cacheHitDeltaPct: number | null;
}

export interface OperatorScorecardRecipient {
  ownerId: string;
  name: string;
  email: string;
}

export interface TopDestination {
  destination: string;
  count: number;
}

export interface OperatorScorecardPayload {
  monthKey: string;
  monthLabel: string;
  generatedAt: string;
  organization: {
    id: string;
    name: string;
    subscriptionTier: string | null;
    gstin: string | null;
  };
  recipient: OperatorScorecardRecipient;
  score: number;
  status: "leading" | "steady" | "at_risk";
  metrics: OperatorScorecardMetrics;
  comparison: OperatorScorecardComparison;
  highlights: string[];
  actions: string[];
  topDestinations: TopDestination[];
}

export interface PersistedOperatorScorecard {
  row: ScorecardRow;
  payload: OperatorScorecardPayload;
}

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function pct(current: number, total: number): number {
  if (total <= 0) return 0;
  return round((current / total) * 100, 1);
}

function deltaPct(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return current === 0 ? 0 : 100;
  return round(((current - previous) / Math.abs(previous)) * 100, 1);
}

function responseTimeScore(minutes: number | null) {
  if (minutes === null) return 55;
  if (minutes <= 15) return 100;
  if (minutes <= 60) return round(100 - ((minutes - 15) / 45) * 30, 0);
  if (minutes <= 240) return round(70 - ((minutes - 60) / 180) * 50, 0);
  return 10;
}

function revenueTrendScore(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 80 : 50;
  const delta = ((current - previous) / previous) * 100;
  return Math.max(0, Math.min(100, round(50 + delta * 1.2, 0)));
}

function proposalThroughputScore(proposalsCreated: number) {
  if (proposalsCreated <= 0) return 20;
  return Math.min(100, 35 + proposalsCreated * 8);
}

function averageRatingScore(averageRating: number | null) {
  if (averageRating === null) return 60;
  return Math.max(0, Math.min(100, round((averageRating / 5) * 100, 0)));
}

function optionalRateScore(value: number | null) {
  return value === null ? 60 : Math.max(0, Math.min(100, round(value, 0)));
}

function computeScore(current: OperatorScorecardMetrics, previous: OperatorScorecardMetrics): number {
  const weighted =
    optionalRateScore(current.approvalRate) * 0.2 +
    optionalRateScore(current.paymentConversionRate) * 0.2 +
    optionalRateScore(current.reviewResponseRate) * 0.15 +
    averageRatingScore(current.averageRating) * 0.1 +
    optionalRateScore(current.cacheHitRate) * 0.1 +
    responseTimeScore(current.avgWhatsAppReplyMinutes) * 0.1 +
    revenueTrendScore(current.revenueInr, previous.revenueInr) * 0.1 +
    proposalThroughputScore(current.proposalsCreated) * 0.05;

  return round(weighted, 1);
}

function deriveStatus(score: number): OperatorScorecardPayload["status"] {
  if (score >= 80) return "leading";
  if (score >= 60) return "steady";
  return "at_risk";
}

function buildHighlights(metrics: OperatorScorecardMetrics, comparison: OperatorScorecardComparison): string[] {
  const highlights: string[] = [];

  if ((comparison.revenueDeltaPct ?? 0) > 10) {
    highlights.push(`Revenue grew ${comparison.revenueDeltaPct}% month-on-month.`);
  }
  if (metrics.approvalRate >= 40) {
    highlights.push(`Proposal approval stayed strong at ${metrics.approvalRate}%.`);
  }
  if ((metrics.reviewResponseRate ?? 0) >= 80) {
    highlights.push(`You replied to ${metrics.reviewResponseRate}% of reviews this month.`);
  }
  if ((metrics.cacheHitRate ?? 0) >= 90) {
    highlights.push(`Shared itinerary cache hit ${metrics.cacheHitRate}% of lookups.`);
  }
  if (metrics.avgWhatsAppReplyMinutes !== null && metrics.avgWhatsAppReplyMinutes <= 30) {
    highlights.push(`Average WhatsApp reply time held at ${metrics.avgWhatsAppReplyMinutes} minutes.`);
  }

  if (highlights.length === 0) {
    highlights.push("You kept the operator pipeline active with fresh proposals and payment activity.");
  }

  return highlights.slice(0, 3);
}

function buildActions(metrics: OperatorScorecardMetrics): string[] {
  const actions: string[] = [];

  if (metrics.paymentConversionRate < 50) {
    actions.push("Follow up on open payment links faster to lift paid conversion.");
  }
  if ((metrics.reviewResponseRate ?? 100) < 70) {
    actions.push("Use the AI review drafter to improve review response coverage.");
  }
  if (metrics.avgWhatsAppReplyMinutes !== null && metrics.avgWhatsAppReplyMinutes > 60) {
    actions.push("Cut WhatsApp response time by enabling faster handoffs from the inbox.");
  }
  if ((metrics.cacheHitRate ?? 100) < 85) {
    actions.push("Promote more polished itineraries into the shared cache to reduce generation misses.");
  }
  if (metrics.proposalsCreated < 3) {
    actions.push("Push more qualified leads into proposal creation to avoid pipeline thinness next month.");
  }

  if (actions.length === 0) {
    actions.push("Keep the current pace and focus on upsells to grow average paid value next month.");
  }

  return actions.slice(0, 3);
}

function extractDirection(metadata: Json | null | undefined): "in" | "out" | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const direction = (metadata as Record<string, unknown>).direction;
  return direction === "in" || direction === "out" ? direction : null;
}

function computeWhatsAppReplyMinutes(events: WebhookEventRow[]): {
  inboundCount: number;
  outboundCount: number;
  avgReplyMinutes: number | null;
} {
  const grouped = new Map<string, Array<{ receivedAt: string; direction: "in" | "out" }>>();

  for (const event of events) {
    if (!event.wa_id || !event.received_at) continue;
    const direction = extractDirection(event.metadata);
    if (!direction) continue;
    const existing = grouped.get(event.wa_id) || [];
    existing.push({ receivedAt: event.received_at, direction });
    grouped.set(event.wa_id, existing);
  }

  let inboundCount = 0;
  let outboundCount = 0;
  const replyMinutes: number[] = [];

  for (const thread of grouped.values()) {
    thread.sort((left, right) => new Date(left.receivedAt).getTime() - new Date(right.receivedAt).getTime());
    for (let index = 0; index < thread.length; index += 1) {
      const current = thread[index];
      if (current.direction === "in") {
        inboundCount += 1;
        const currentTime = new Date(current.receivedAt).getTime();
        for (let candidateIndex = index + 1; candidateIndex < thread.length; candidateIndex += 1) {
          const candidate = thread[candidateIndex];
          if (candidate.direction !== "out") continue;
          const replyMs = new Date(candidate.receivedAt).getTime() - currentTime;
          if (replyMs >= 0) {
            replyMinutes.push(replyMs / 60000);
            break;
          }
        }
      } else {
        outboundCount += 1;
      }
    }
  }

  return {
    inboundCount,
    outboundCount,
    avgReplyMinutes:
      replyMinutes.length > 0
        ? round(replyMinutes.reduce((sum, value) => sum + value, 0) / replyMinutes.length, 1)
        : null,
  };
}

function resolveScorecardMonth(monthKey?: string) {
  if (monthKey) {
    const window = resolveWindow(monthKey, "1m");
    const start = new Date(window.startISO);
    const previous = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));
    const previousKey = `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}`;
    const previousWindow = resolveWindow(previousKey, "1m");
    return { monthKey, label: window.label, startISO: window.startISO, endISO: window.endISO, previousKey, previousWindow };
  }

  const now = new Date();
  const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const resolvedKey = `${previousMonth.getUTCFullYear()}-${String(previousMonth.getUTCMonth() + 1).padStart(2, "0")}`;
  return resolveScorecardMonth(resolvedKey);
}

async function loadOrganization(admin: AdminClient, organizationId: string) {
  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .select("id, name, owner_id, subscription_tier, gstin")
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError) throw organizationError;
  if (!organization?.owner_id) {
    throw new Error("Organization owner is not configured");
  }

  const { data: ownerProfile, error: ownerError } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", organization.owner_id)
    .maybeSingle();

  if (ownerError) throw ownerError;
  if (!ownerProfile?.email) {
    throw new Error("Organization owner email is not configured");
  }

  return {
    organization,
    ownerProfile,
  } as {
    organization: Pick<OrganizationRow, "id" | "name" | "subscription_tier" | "gstin"> & { owner_id: string };
    ownerProfile: ProfileRow;
  };
}

async function loadReputationReviews(admin: AdminClient, organizationId: string, startISO: string, endISO: string) {
  const typedAdmin = admin as unknown as {
    from: (table: "reputation_reviews") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          gte: (column: string, value: string) => {
            lt: (column: string, value: string) => Promise<{ data: ReviewRecord[] | null; error: Error | null }>;
          };
        };
      };
    };
  };

  const { data, error } = await typedAdmin
    .from("reputation_reviews")
    .select("id, rating, review_date, response_status, response_posted_at")
    .eq("organization_id", organizationId)
    .gte("review_date", startISO.slice(0, 10))
    .lt("review_date", endISO.slice(0, 10));

  if (error) throw error;
  return data || [];
}

async function loadCacheEvents(admin: AdminClient, organizationId: string, startISO: string, endISO: string) {
  const typedAdmin = admin as unknown as {
    from: (table: "shared_itinerary_cache_events") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          gte: (column: string, value: string) => {
            lt: (column: string, value: string) => Promise<{ data: CacheEventRow[] | null; error: Error | null }>;
          };
        };
      };
    };
  };

  const { data, error } = await typedAdmin
    .from("shared_itinerary_cache_events")
    .select(CACHE_EVENT_SELECT)
    .eq("organization_id", organizationId)
    .gte("created_at", startISO)
    .lt("created_at", endISO);

  if (error) throw error;
  return (data || []) as CacheEventRow[];
}

async function loadWhatsAppEvents(admin: AdminClient, organizationId: string, startISO: string, endISO: string) {
  const baseSessionName = sessionNameFromOrgId(organizationId);
  const { data, error } = await admin
    .from("whatsapp_webhook_events")
    .select("wa_id, received_at, metadata")
    .filter("metadata->>session", "like", `${baseSessionName}%`)
    .eq("event_type", "text")
    .gte("received_at", startISO)
    .lt("received_at", endISO);

  if (error) throw error;
  return (data || []) as WebhookEventRow[];
}

async function loadTopDestinations(admin: AdminClient, organizationId: string, startISO: string, endISO: string): Promise<TopDestination[]> {
  type ProposalWithTemplate = {
    template_id: string | null;
    tour_templates: {
      destination: string | null;
    } | null;
  };

  const { data, error } = await admin
    .from("proposals")
    .select("template_id, tour_templates!inner(destination)")
    .eq("organization_id", organizationId)
    .gte("created_at", startISO)
    .lt("created_at", endISO);

  if (error) throw error;

  const proposals = (data || []) as unknown as ProposalWithTemplate[];
  const destinationCounts = new Map<string, number>();

  for (const proposal of proposals) {
    const destination = proposal.tour_templates?.destination;
    if (destination && destination.trim()) {
      const normalizedDestination = destination.trim();
      destinationCounts.set(normalizedDestination, (destinationCounts.get(normalizedDestination) || 0) + 1);
    }
  }

  const topDestinations = Array.from(destinationCounts.entries())
    .map(([destination, count]) => ({ destination, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return topDestinations;
}

async function collectMetrics(admin: AdminClient, organizationId: string, startISO: string, endISO: string) {
  const [proposalsResult, paymentsResult, reviews, cacheEvents, whatsappEvents] = await Promise.all([
    admin
      .from("proposals")
      .select("id, status, created_at, updated_at")
      .eq("organization_id", organizationId)
      .gte("created_at", startISO)
      .lt("created_at", endISO),
    admin
      .from("payment_links")
      .select("id, status, amount_paise, created_at, paid_at")
      .eq("organization_id", organizationId)
      .or(`and(created_at.gte.${startISO},created_at.lt.${endISO}),and(paid_at.gte.${startISO},paid_at.lt.${endISO})`),
    loadReputationReviews(admin, organizationId, startISO, endISO),
    loadCacheEvents(admin, organizationId, startISO, endISO),
    loadWhatsAppEvents(admin, organizationId, startISO, endISO),
  ]);

  if (proposalsResult.error) throw proposalsResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const proposals = (proposalsResult.data || []) as ProposalRow[];
  const paymentLinks = (paymentsResult.data || []) as PaymentLinkRow[];

  const proposalsCreated = proposals.length;
  const proposalsApproved = proposals.filter((proposal) =>
    APPROVED_PROPOSAL_STATUSES.has((proposal.status || "").toLowerCase()),
  ).length;

  const linksSent = paymentLinks.filter((link) => {
    const createdAt = link.created_at ? new Date(link.created_at).getTime() : Number.NaN;
    return Number.isFinite(createdAt) && createdAt >= new Date(startISO).getTime() && createdAt < new Date(endISO).getTime();
  }).length;

  const paidLinks = paymentLinks.filter((link) => {
    if (link.status !== "paid" || !link.paid_at) return false;
    const paidAt = new Date(link.paid_at).getTime();
    return Number.isFinite(paidAt) && paidAt >= new Date(startISO).getTime() && paidAt < new Date(endISO).getTime();
  });

  const revenueInr = round(paidLinks.reduce((sum, link) => sum + Number(link.amount_paise || 0), 0) / 100, 2);
  const paymentsCollected = paidLinks.length;

  const reviewsReceived = reviews.length;
  const respondedReviews = reviews.filter((review) => review.response_status === "responded");
  const reviewResponseRate = reviewsReceived > 0 ? pct(respondedReviews.length, reviewsReceived) : null;
  const averageRating =
    reviewsReceived > 0
      ? round(reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewsReceived, 2)
      : null;

  const cacheHits = cacheEvents.filter((event) => event.event_type === "hit").length;
  const cacheMisses = cacheEvents.filter((event) => event.event_type === "miss").length;
  const cacheHitRate = cacheHits + cacheMisses > 0 ? pct(cacheHits, cacheHits + cacheMisses) : null;

  const whatsappStats = computeWhatsAppReplyMinutes(whatsappEvents);

  return {
    revenueInr,
    proposalsCreated,
    proposalsApproved,
    approvalRate: proposalsCreated > 0 ? pct(proposalsApproved, proposalsCreated) : 0,
    linksSent,
    paymentsCollected,
    paymentConversionRate: linksSent > 0 ? pct(paymentsCollected, linksSent) : 0,
    avgPaidValueInr: paymentsCollected > 0 ? round(revenueInr / paymentsCollected, 2) : 0,
    reviewsReceived,
    reviewResponseRate,
    averageRating,
    avgWhatsAppReplyMinutes: whatsappStats.avgReplyMinutes,
    whatsappInboundCount: whatsappStats.inboundCount,
    whatsappOutboundCount: whatsappStats.outboundCount,
    cacheHitRate,
    cacheHits,
    cacheMisses,
  } satisfies OperatorScorecardMetrics;
}

export async function buildOperatorScorecardPayload(args: {
  organizationId: string;
  monthKey?: string;
  adminClient?: AdminClient;
}): Promise<OperatorScorecardPayload> {
  const admin = args.adminClient || createAdminClient();
  const month = resolveScorecardMonth(args.monthKey);
  const [{ organization, ownerProfile }, currentMetrics, previousMetrics, topDestinations] = await Promise.all([
    loadOrganization(admin, args.organizationId),
    collectMetrics(admin, args.organizationId, month.startISO, month.endISO),
    collectMetrics(admin, args.organizationId, month.previousWindow.startISO, month.previousWindow.endISO),
    loadTopDestinations(admin, args.organizationId, month.startISO, month.endISO),
  ]);

  const comparison: OperatorScorecardComparison = {
    revenueDeltaPct: deltaPct(currentMetrics.revenueInr, previousMetrics.revenueInr),
    proposalDeltaPct: deltaPct(currentMetrics.proposalsCreated, previousMetrics.proposalsCreated),
    paymentDeltaPct: deltaPct(currentMetrics.paymentConversionRate, previousMetrics.paymentConversionRate),
    approvalDeltaPct: deltaPct(currentMetrics.approvalRate, previousMetrics.approvalRate),
    reviewResponseDeltaPct: deltaPct(currentMetrics.reviewResponseRate, previousMetrics.reviewResponseRate),
    cacheHitDeltaPct: deltaPct(currentMetrics.cacheHitRate, previousMetrics.cacheHitRate),
  };

  const score = computeScore(currentMetrics, previousMetrics);
  return {
    monthKey: month.monthKey,
    monthLabel: month.label,
    generatedAt: new Date().toISOString(),
    organization: {
      id: organization.id,
      name: organization.name,
      subscriptionTier: organization.subscription_tier,
      gstin: organization.gstin,
    },
    recipient: {
      ownerId: ownerProfile.id,
      name: ownerProfile.full_name || organization.name,
      email: ownerProfile.email || "",
    },
    score,
    status: deriveStatus(score),
    metrics: currentMetrics,
    comparison,
    highlights: buildHighlights(currentMetrics, comparison),
    actions: buildActions(currentMetrics),
    topDestinations,
  };
}

export function filterScorecardForTier(payload: OperatorScorecardPayload): OperatorScorecardPayload {
  const tier = payload.organization.subscriptionTier?.toLowerCase();
  const isFree = !tier || tier === "free" || tier === "trial";

  if (!isFree) {
    return payload;
  }

  return {
    ...payload,
    metrics: {
      ...payload.metrics,
      proposalsCreated: 0,
      proposalsApproved: 0,
      approvalRate: 0,
      linksSent: 0,
      paymentsCollected: 0,
      paymentConversionRate: 0,
      avgPaidValueInr: 0,
      reviewsReceived: 0,
      reviewResponseRate: null,
      averageRating: null,
      avgWhatsAppReplyMinutes: null,
      whatsappInboundCount: 0,
      whatsappOutboundCount: 0,
      cacheHitRate: null,
      cacheHits: 0,
      cacheMisses: 0,
    },
    comparison: {
      revenueDeltaPct: payload.comparison.revenueDeltaPct,
      proposalDeltaPct: null,
      paymentDeltaPct: null,
      approvalDeltaPct: null,
      reviewResponseDeltaPct: null,
      cacheHitDeltaPct: null,
    },
    highlights: ["Upgrade to see full performance insights and actionable recommendations."],
    actions: ["Unlock detailed analytics by upgrading your subscription."],
    topDestinations: [],
  };
}

export async function upsertOperatorScorecard(args: {
  organizationId: string;
  monthKey?: string;
  adminClient?: AdminClient;
  status?: "draft" | "ready" | "emailed" | "failed";
  emailedAt?: string | null;
  pdfGeneratedAt?: string | null;
  lastError?: string | null;
}): Promise<PersistedOperatorScorecard> {
  const admin = args.adminClient || createAdminClient();
  const payload = await buildOperatorScorecardPayload({
    organizationId: args.organizationId,
    monthKey: args.monthKey,
    adminClient: admin,
  });

  const { data, error } = await (admin as unknown as ScorecardUpsertClient)
    .from("operator_scorecards")
    .upsert(
      {
        organization_id: payload.organization.id,
        month_key: payload.monthKey,
        score: payload.score,
        status: args.status || "ready",
        payload: payload as unknown as Json,
        emailed_at: args.emailedAt ?? null,
        pdf_generated_at: args.pdfGeneratedAt ?? null,
        last_error: args.lastError ?? null,
      },
      { onConflict: "organization_id,month_key" },
    )
    .select(SCORECARD_SELECT)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to persist operator scorecard");
  }

  return {
    row: data as ScorecardRow,
    payload,
  };
}
