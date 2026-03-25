import "server-only";

/* ------------------------------------------------------------------
 * QStash Scheduling Helper
 *
 * Schedules automation messages via Upstash QStash for precise
 * time-based delivery. Gracefully degrades when QSTASH_TOKEN is
 * not configured.
 * ------------------------------------------------------------------ */

import { logError, logEvent } from "@/lib/observability/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScheduleParams {
  readonly orgId: string;
  readonly ruleType: string;
  readonly contactPhone: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly sendAt: Date;
}

interface QStashPublishResponse {
  readonly messageId: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const QSTASH_API_URL = `${process.env.QSTASH_URL || "https://qstash.upstash.io"}/v2/publish`;
const TARGET_URL = "https://www.tripbuilt.com/api/automation/execute-scheduled";

// ─── Main Export ────────────────────────────────────────────────────────────

/**
 * Schedule an automation message via QStash for future delivery.
 *
 * @returns QStash messageId on success, or null if skipped/failed
 */
export async function scheduleAutomation(
  params: ScheduleParams,
): Promise<string | null> {
  const token = process.env.QSTASH_TOKEN?.trim();

  if (!token) {
    logEvent("warn", "[qstash-scheduler] QSTASH_TOKEN not set, skipping schedule", {
      orgId: params.orgId,
      ruleType: params.ruleType,
    });
    return null;
  }

  const delaySeconds = Math.max(
    0,
    Math.floor((params.sendAt.getTime() - Date.now()) / 1000),
  );

  const body = {
    orgId: params.orgId,
    ruleType: params.ruleType,
    contactPhone: params.contactPhone,
    entityId: params.entityId,
    entityType: params.entityType,
  };

  try {
    const response = await fetch(QSTASH_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Upstash-Destination": TARGET_URL,
        ...(delaySeconds > 0
          ? { "Upstash-Delay": `${delaySeconds}s` }
          : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown");
      logError("[qstash-scheduler] QStash publish failed", new Error(errorText), {
        status: response.status,
        orgId: params.orgId,
        ruleType: params.ruleType,
      });
      return null;
    }

    const result = (await response.json()) as QStashPublishResponse;

    logEvent("info", "[qstash-scheduler] Scheduled automation message", {
      messageId: result.messageId,
      orgId: params.orgId,
      ruleType: params.ruleType,
      delaySeconds,
    });

    return result.messageId;
  } catch (error) {
    logError("[qstash-scheduler] Failed to schedule automation", error, {
      orgId: params.orgId,
      ruleType: params.ruleType,
    });
    return null;
  }
}
