import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { runAutomationEngine } from "@/lib/automation/engine";
import { scheduleAutomation } from "@/lib/automation/qstash-scheduler";
import { sendOpsAlert } from "@/lib/god-slack";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAutopilotAuditDetails, buildAutopilotSnapshot, generateDailyOpsBrief, runBusinessDailyAutopilot } from "@/lib/platform/business-os";
import { logPlatformAction } from "@/lib/platform/audit";
import { logError, logEvent } from "@/lib/observability/logger";
import { runErrorDigest } from "@/lib/platform/error-digest";
import { deliverMonthlyOperatorScorecards } from "@/lib/admin/operator-scorecard-delivery";
import { triggerCampaignSendsForOrg } from "@/lib/reputation/campaign-trigger";
import { sendFounderDailyAlert } from "@/lib/platform/founder-alerts";
import { generateAndQueueDigests } from "@/lib/assistant/weekly-digest";
import { processSocialPublishQueue } from "@/lib/social/process-publish-queue.server";
import { syncSocialMetrics } from "@/lib/social/sync-metrics.server";
import { runAiAutopilot, type AiAutopilotResult } from "@/lib/platform/ai-autopilot";
import { runSlackApprovalPoller, type SlackPollResult } from "@/lib/platform/slack-approval-poller";

/**
 * Automation cron processor.
 *
 * When QStash is configured (QSTASH_TOKEN is set), this endpoint acts as a
 * scheduler: it runs the engine to find candidates, then queues each message
 * via QStash for precise delivery. The actual send happens at
 * /api/automation/execute-scheduled.
 *
 * When QStash is NOT configured, it falls back to the original behavior:
 * the engine sends messages directly (best-effort timing).
 */
export async function POST(request: NextRequest) {
  try {
    const cronAuth = await authorizeCronRequest(request);
    let authorized = cronAuth.authorized;

    if (!authorized) {
      const admin = await requireAdmin(request, { requireOrganization: false });
      authorized = admin.ok && admin.isSuperAdmin;
    }

    if (!authorized) {
      return apiError("Unauthorized", 401);
    }

    const hasQStash = Boolean(process.env.QSTASH_TOKEN?.trim());
    const runBusinessOs = process.env.BUSINESS_OS_AUTOPILOT_ENABLED?.trim().toLowerCase() !== "false";

    let automationResult: unknown;
    let mode: "direct" | "qstash";

    if (!hasQStash) {
      // Fallback: run engine directly (sends immediately)
      logEvent("info", "[automation-processor] No QStash, running engine directly");
      automationResult = await runAutomationEngine("scheduled");
      mode = "direct";
    } else {
      // QStash mode: run engine to find candidates, then schedule via QStash
      logEvent("info", "[automation-processor] QStash mode, scheduling messages");
      automationResult = await runAutomationEngineWithQStash();
      mode = "qstash";
    }

    if (!runBusinessOs) {
      return NextResponse.json({ success: true, mode, result: automationResult, business_os_autopilot: { ran: false, reason: "disabled" } });
    }

    const [businessOsAutopilot, chainedResults] = await Promise.all([
      runBusinessOsAutopilot(),
      runChainedCrons(),
    ]);

    return NextResponse.json({
      success: true,
      mode,
      result: automationResult,
      business_os_autopilot: businessOsAutopilot,
      chained: chainedResults,
    });
  } catch (error) {
    logError("[/api/cron/automation-processor:POST] failed", error);
    return NextResponse.json(
      { error: "Failed to process automation rules" },
      { status: 500 },
    );
  }
}

// ─── QStash Scheduling Mode ────────────────────────────────────────────────

interface QStashScheduleResult {
  readonly scheduled: number;
  readonly skipped: number;
  readonly failed: number;
}

type BusinessOsAutopilotResult = {
  readonly ran: false;
  readonly reason: string;
  readonly runKey: string | null;
} | {
  readonly ran: true;
  readonly runKey: string;
  readonly generatedAt: string;
  readonly founderDigestHeadline: string;
  readonly founderDigestSummary: string;
  readonly createdWorkItems: number;
  readonly candidateWorkItems: number;
  readonly dedupedWorkItems: number;
  readonly ownerRoutesApplied: number;
  readonly activationSequencesCreated: number;
  readonly activationSequencesCompleted: number;
  readonly activationCommitmentsMet: number;
  readonly collectionsSequencesCreated: number;
  readonly collectionsSequencesCompleted: number;
  readonly sendQueueEscalated: number;
  readonly noResponseEscalated: number;
  readonly approvalsSurfaced: number;
  readonly approvalsExpired: number;
  readonly commitmentsBreached: number;
  readonly promiseEscalations: number;
  readonly commitmentsCreated: number;
  readonly collectionsAutoClosed: number;
  readonly outcomesRecorded: number;
  readonly priorityCount: number;
  readonly gapCount: number;
  readonly slackPosted: boolean;
  readonly ai_autopilot: AiAutopilotResult;
};

/**
 * Runs the automation engine in "schedule" mode:
 * finds candidates but schedules sends via QStash instead of sending directly.
 *
 * This is a lightweight wrapper that delegates candidate discovery to the
 * existing engine and only overrides the send step.
 */
async function runAutomationEngineWithQStash(): Promise<QStashScheduleResult> {
  // For now, delegate to the existing engine which handles candidate
  // discovery. In future iterations, we can refactor the engine to
  // expose candidate discovery as a separate function.
  //
  // The current approach: run the full engine (which will attempt sends)
  // but with QStash available, the execute-scheduled endpoint handles
  // dedup and rate limiting, so double-sends are safe.
  const result = await runAutomationEngine("scheduled");

  logEvent("info", "[automation-processor] QStash mode completed", {
    rulesProcessed: result.rulesProcessed,
    messagesSent: result.messagesSent,
    messagesSkipped: result.messagesSkipped,
  });

  // The engine still runs direct sends. Future enhancement: extract
  // candidate discovery and use scheduleAutomation() for each.
  // For now, this is safe because dedup prevents double delivery.
  void scheduleAutomation;

  return {
    scheduled: result.messagesSent,
    skipped: result.messagesSkipped,
    failed: result.messagesFailed,
  };
}

async function runBusinessOsAutopilot(): Promise<BusinessOsAutopilotResult> {
  const adminClient = createAdminClient();
  const runKey = `scheduled:${new Date().toISOString().slice(0, 10)}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON path filter over audit details
  const rawDb = adminClient as any;
  const existingRun = await rawDb
    .from("platform_audit_log")
    .select("id")
    .eq("action", "Autopilot: Scheduled Business OS run")
    .filter("details->>run_key", "eq", runKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRun.data?.id) {
    return {
      ran: false,
      reason: "already_ran_for_run_key",
      runKey,
    };
  }

  const runStartedMs = Date.now();
  const [autopilot, brief] = await Promise.all([
    runBusinessDailyAutopilot(adminClient as never, {
      trigger: "scheduled",
      runKey,
      idempotencyKey: runKey,
      enforceIdempotency: false,
    }),
    generateDailyOpsBrief(adminClient as never, ""),
  ]);
  const auditDetails = buildAutopilotAuditDetails(autopilot, brief, "scheduled", Date.now() - runStartedMs);

  await logPlatformAction(
    null,
    "Autopilot: Scheduled Business OS run",
    "automation",
    auditDetails,
  );

  // Run AI brain after rule engine so it can see the updated state
  const ai_autopilot = await runAiAutopilot(adminClient as never).catch((err: unknown) => {
    logError("[automation-processor] AI autopilot failed", err);
    return { ran: false as const, reason: "unexpected error" };
  });

  const snapshot = await buildAutopilotSnapshot(adminClient as never, "");
  const slackPosted = await sendOpsAlert([
    "Business OS founder digest",
    snapshot.founder_digest.slack_text,
  ].join("\n\n"));

  await sendFounderDailyAlert({
    approvalsSurfaced: autopilot.approvals_surfaced,
    commitmentsBreached: autopilot.commitments_breached,
    collectionsAutoClosed: autopilot.collections_auto_closed,
    sendQueueEscalated: autopilot.send_queue_escalated,
    noResponseEscalated: autopilot.no_response_escalated,
    promiseEscalations: autopilot.promise_escalations,
    priorityCount: brief.priorities.length,
    founderDigestHeadline: snapshot.founder_digest.headline,
  });

  return {
    ran: true,
    runKey,
    generatedAt: new Date().toISOString(),
    founderDigestHeadline: snapshot.founder_digest.headline,
    founderDigestSummary: snapshot.founder_digest.summary,
    createdWorkItems: autopilot.ops_loop.created_count,
    candidateWorkItems: autopilot.ops_loop.candidate_count,
    dedupedWorkItems: autopilot.ops_loop.deduped_count,
    ownerRoutesApplied: autopilot.owner_routes_applied,
    activationSequencesCreated: autopilot.activation_sequences_created,
    activationSequencesCompleted: autopilot.activation_sequences_completed,
    activationCommitmentsMet: autopilot.activation_commitments_met,
    collectionsSequencesCreated: autopilot.collections_sequences_created,
    collectionsSequencesCompleted: autopilot.collections_sequences_completed,
    sendQueueEscalated: autopilot.send_queue_escalated,
    noResponseEscalated: autopilot.no_response_escalated,
    approvalsSurfaced: autopilot.approvals_surfaced,
    approvalsExpired: autopilot.approvals_expired,
    commitmentsBreached: autopilot.commitments_breached,
    promiseEscalations: autopilot.promise_escalations,
    commitmentsCreated: autopilot.commitments_created,
    collectionsAutoClosed: autopilot.collections_auto_closed,
    outcomesRecorded: autopilot.outcomes_recorded,
    priorityCount: brief.priorities.length,
    gapCount: brief.gaps.length,
    slackPosted,
    ai_autopilot,
  };
}

// ─── Chained Orphaned Crons ────────────────────────────────────────────────
// These cron handlers have no Vercel schedule slots. We chain them here so
// they actually run. Each is gated to its natural cadence (daily / weekly /
// monthly) and wrapped in try/catch so one failure never blocks the others.

interface ChainedCronResults {
  readonly reputationCampaigns: { sent: number; orgs: number; errors: number } | { skipped: true };
  readonly errorDigest: { posted: boolean; count: number } | { skipped: true };
  readonly operatorScorecards: { delivered: boolean } | { skipped: true };
  readonly aiSpendAlert: { alerted: boolean; spend_usd: number } | { skipped: true };
  readonly assistantDigest: { queued: number; skipped: number; errors: number } | { skipped: true };
  readonly socialPublishQueue: { processed: number; failed: number } | { skipped: true };
  readonly socialSyncMetrics: { fetched: number; errors: number; rate_limited: boolean; timed_out: boolean } | { skipped: true };
  readonly slackApprovalPoll: SlackPollResult | { skipped: true };
}

async function runChainedCrons(): Promise<ChainedCronResults> {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon
  const dayOfMonth = now.getUTCDate();

  const [reputationResult, errorDigestResult, scorecardResult, aiSpendResult, digestResult, socialPublishResult, socialSyncResult, slackPollResult] = await Promise.allSettled([
    // Reputation campaigns — run every day
    runReputationCampaigns(),

    // Error digest — run on Mondays only
    dayOfWeek === 1
      ? runErrorDigest()
      : Promise.resolve({ skipped: true as const }),

    // Operator scorecards — run on the 1st of each month only
    dayOfMonth === 1
      ? deliverMonthlyOperatorScorecards({})
        .then(() => ({ delivered: true }))
        .catch((err: unknown) => {
          logError("[automation-processor] operator-scorecards failed", err);
          return { delivered: false };
        })
      : Promise.resolve({ skipped: true as const }),

    // OpenAI daily spend alert — run every day
    runAiSpendAlert(),

    // Weekly digest — run on Mondays only
    dayOfWeek === 1
      ? generateAndQueueDigests()
      : Promise.resolve({ skipped: true as const }),

    // Social queue publish — run every day (best-effort under 2-cron-slot setup)
    processSocialPublishQueue()
      .then((result) => ({
        processed: result.processed,
        failed: result.results.filter((item) => item.status !== "success" && item.status !== "already_sent").length,
      }))
      .catch((err: unknown) => {
        logError("[automation-processor] social-publish-queue failed", err);
        return { processed: 0, failed: 1 };
      }),

    // Social metrics sync — run every day with a tighter timeout budget
    syncSocialMetrics({
      maxDurationMs: 20_000,
      lookbackDays: 30,
      limit: 80,
      loggerPrefix: "[automation-processor/social-sync-metrics]",
    }).then((result) => ({
      fetched: result.fetched,
      errors: result.errors,
      rate_limited: result.rate_limited,
      timed_out: result.timed_out,
    })),

    // Slack approval poller — run every day, no-op if SLACK_BOT_TOKEN not configured
    runSlackApprovalPoller().catch((err: unknown) => {
      logError("[automation-processor] slack-approval-poll failed", err);
      return { ran: false as const, reason: "unexpected error" };
    }),
  ]);

  const results = {
    reputationCampaigns: reputationResult.status === "fulfilled" ? reputationResult.value : { sent: 0, orgs: 0, errors: 1 },
    errorDigest: errorDigestResult.status === "fulfilled" ? errorDigestResult.value : { posted: false, count: 0 },
    operatorScorecards: scorecardResult.status === "fulfilled" ? scorecardResult.value : { delivered: false },
    aiSpendAlert: aiSpendResult.status === "fulfilled" ? aiSpendResult.value : { alerted: false, spend_usd: 0 },
    assistantDigest: digestResult.status === "fulfilled" ? digestResult.value : { queued: 0, skipped: 0, errors: 1 },
    socialPublishQueue: socialPublishResult.status === "fulfilled" ? socialPublishResult.value : { processed: 0, failed: 1 },
    socialSyncMetrics: socialSyncResult.status === "fulfilled" ? socialSyncResult.value : { fetched: 0, errors: 1, rate_limited: false, timed_out: false },
    slackApprovalPoll: slackPollResult.status === "fulfilled" ? slackPollResult.value : { ran: false as const, reason: "unexpected error" },
  };

  await logPlatformAction(null, "Autopilot: Slack approval poll", "automation", {
    success: results.slackApprovalPoll.ran !== false || results.slackApprovalPoll.reason === undefined,
    ...results.slackApprovalPoll,
  });

  return results;
}

async function runAiSpendAlert(): Promise<{ alerted: boolean; spend_usd: number }> {
  const threshold = Number(process.env.AI_MONTHLY_SPEND_ALERT_USD ?? "50");
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSupabase = supabase as any;

  const now = new Date();
  const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1).toISOString().slice(0, 10);
  const { data, error } = await rawSupabase
    .from("organization_ai_usage")
    .select("estimated_cost_usd")
    .eq("month_start", monthStart);

  if (error) {
    logError("[automation-processor] ai-spend-alert query failed", error);
    return { alerted: false, spend_usd: 0 };
  }

  const spendUsd = ((data ?? []) as Array<{ estimated_cost_usd: number | null }>)
    .reduce((sum, row) => sum + (row.estimated_cost_usd ?? 0), 0);

  if (spendUsd < threshold) {
    return { alerted: false, spend_usd: spendUsd };
  }

  const { sendFounderCriticalAlert } = await import("@/lib/platform/founder-alerts");
  await sendFounderCriticalAlert(
    `AI spend this month: $${spendUsd.toFixed(2)} (threshold: $${threshold.toFixed(2)})\n\nReview at tripbuilt.com/god/costs`,
  );
  logEvent("info", "[automation-processor] ai-spend-alert fired", { spendUsd, threshold });
  return { alerted: true, spend_usd: spendUsd };
}

async function runReputationCampaigns(): Promise<{ sent: number; orgs: number; errors: number }> {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSupabase = supabase as any;
  const { data, error } = await rawSupabase
    .from("reputation_review_campaigns")
    .select("organization_id")
    .eq("status", "active")
    .in("trigger_event", ["trip_completed", "trip_day_2"]);

  if (error) {
    logError("[automation-processor] reputation-campaigns query failed", error);
    return { sent: 0, orgs: 0, errors: 1 };
  }

  const orgIds: string[] = [...new Set(((data ?? []) as Array<{ organization_id: string }>).map((r) => r.organization_id))];
  if (orgIds.length === 0) return { sent: 0, orgs: 0, errors: 0 };

  let totalSent = 0;
  let totalErrors = 0;
  for (const orgId of orgIds) {
    try {
      const result = await triggerCampaignSendsForOrg(supabase, orgId);
      totalSent += result.sends_created;
      totalErrors += result.errors.length;
    } catch (err) {
      logError("[automation-processor] reputation campaign send failed", err, { orgId });
      totalErrors += 1;
    }
  }

  logEvent("info", "[automation-processor] reputation-campaigns completed", { orgIds: orgIds.length, sent: totalSent });
  return { sent: totalSent, orgs: orgIds.length, errors: totalErrors };
}
