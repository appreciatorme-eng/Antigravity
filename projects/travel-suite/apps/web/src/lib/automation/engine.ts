import "server-only";

/* ------------------------------------------------------------------
 * Automation Engine -- orchestrates batch execution of automation rules.
 *
 * Fetches all enabled automation rules, identifies candidate entities
 * (proposals, payments, trips), and executes rules in batches.
 *
 * Designed for cron-driven batch processing within Vercel's 60s timeout.
 * Tracks execution stats in automation_executions table.
 *
 * Immutable patterns: read rules -> find candidates -> execute -> log results.
 * ------------------------------------------------------------------ */

import { createAdminClient } from "@/lib/supabase/admin";
import { logError, logEvent } from "@/lib/observability/logger";
import { executeAutomationRule } from "./rule-executor";
import { getTemplateById, type AutomationTemplate } from "./templates";
import type { ExecutionResult } from "./rule-executor";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AutomationRule {
  id: string;
  organization_id: string;
  rule_type: AutomationTemplate["id"];
  enabled: boolean;
  trigger_config: unknown;
  action_config: unknown;
  created_at: string;
  updated_at: string;
}

interface BatchExecutionResult {
  executionId: string;
  rulesProcessed: number;
  messagesSent: number;
  messagesFailed: number;
  messagesSkipped: number;
  durationMs: number;
  status: "completed" | "partial" | "failed";
  errors: string[];
}

interface EntityCandidate {
  id: string;
  organization_id: string;
  [key: string]: unknown;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const MAX_RULES_PER_BATCH = 50;
const MAX_ENTITIES_PER_RULE = 100;
const MAX_EXECUTION_TIME_MS = 50000; // 50 seconds (10s buffer for Vercel's 60s timeout)

// ─── Batch Execution Tracker ───────────────────────────────────────────────

/**
 * Create a new batch execution record to track this run.
 */
async function createExecutionRecord(
  executionType: "scheduled" | "manual" | "test" = "scheduled"
): Promise<string> {
  const admin = createAdminClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("automation_executions")
      .insert({
        execution_type: executionType,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      logError("[automation-engine] Failed to create execution record", error);
      throw new Error("Failed to create execution record");
    }

    return data.id;
  } catch (error) {
    logError("[automation-engine] Exception creating execution record", error);
    throw error;
  }
}

/**
 * Update the execution record with final stats.
 */
async function updateExecutionRecord(
  executionId: string,
  stats: {
    rulesProcessed: number;
    messagesSent: number;
    messagesFailed: number;
    messagesSkipped: number;
    durationMs: number;
    status: "completed" | "partial" | "failed";
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const admin = createAdminClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("automation_executions")
      .update({
        rules_processed: stats.rulesProcessed,
        messages_sent: stats.messagesSent,
        messages_failed: stats.messagesFailed,
        messages_skipped: stats.messagesSkipped,
        duration_ms: stats.durationMs,
        status: stats.status,
        error_message: stats.errorMessage || null,
        metadata: stats.metadata || {},
        completed_at: new Date().toISOString(),
      })
      .eq("id", executionId);

    if (error) {
      logError("[automation-engine] Failed to update execution record", error);
    }
  } catch (error) {
    logError("[automation-engine] Exception updating execution record", error);
  }
}

// ─── Candidate Entity Fetchers ─────────────────────────────────────────────

/**
 * Fetch candidate entities for a specific rule type.
 * Returns entities that might match the trigger conditions.
 */
async function fetchCandidateEntities(
  rule: AutomationRule,
  template: AutomationTemplate
): Promise<EntityCandidate[]> {
  const admin = createAdminClient();
  const entityType = template.trigger_config.entity_type;
  const tableName = `${entityType}s`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin as any)
      .from(tableName)
      .select("*")
      .eq("organization_id", rule.organization_id)
      .limit(MAX_ENTITIES_PER_RULE);

    // Apply status filter if specified
    if (template.trigger_config.status_filter && template.trigger_config.status_filter.length > 0) {
      query = query.in("status", template.trigger_config.status_filter);
    }

    // For date-based triggers, add date range filters
    if (template.trigger_config.trigger_event === "date_approaching") {
      const dateField = template.trigger_config.date_field;
      const daysBefore = template.trigger_config.days_before || 3;

      if (dateField) {
        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + daysBefore + 1);

        query = query
          .gte(dateField, now.toISOString())
          .lte(dateField, futureDate.toISOString());
      }
    }

    // For time-based triggers (created/updated), fetch recent entities
    if (
      template.trigger_config.trigger_event === "created" ||
      template.trigger_config.trigger_event === "updated" ||
      template.trigger_config.trigger_event === "status_changed"
    ) {
      const delayHours = template.trigger_config.delay_hours;
      const lookbackHours = delayHours + 24; // Add 24h buffer to catch delayed entities

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - lookbackHours);

      const dateField =
        template.trigger_config.trigger_event === "created" ? "created_at" : "updated_at";

      query = query.gte(dateField, cutoffDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      logError(`[automation-engine] Failed to fetch candidates for ${entityType}`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    logError(`[automation-engine] Exception fetching candidates for ${entityType}`, error);
    return [];
  }
}

// ─── Rule Processor ────────────────────────────────────────────────────────

/**
 * Process a single automation rule against its candidate entities.
 */
async function processAutomationRule(
  rule: AutomationRule,
  template: AutomationTemplate,
  startTime: number
): Promise<{
  sent: number;
  failed: number;
  skipped: number;
  timedOut: boolean;
}> {
  const stats = {
    sent: 0,
    failed: 0,
    skipped: 0,
    timedOut: false,
  };

  try {
    // Fetch candidate entities for this rule
    const candidates = await fetchCandidateEntities(rule, template);

    logEvent("info", `[automation-engine] Processing rule: ${rule.rule_type}`, {
      ruleId: rule.id,
      organizationId: rule.organization_id,
      candidateCount: candidates.length,
    });

    // Execute rule for each candidate entity
    for (const entity of candidates) {
      // Check timeout before processing each entity
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME_MS) {
        logEvent("warn", "[automation-engine] Approaching timeout, stopping early", {
          elapsed,
          maxTime: MAX_EXECUTION_TIME_MS,
        });
        stats.timedOut = true;
        break;
      }

      try {
        const result: ExecutionResult = await executeAutomationRule(
          rule.id,
          template,
          entity.id,
          rule.organization_id
        );

        // Track result stats
        if (result.action === "sent") {
          stats.sent++;
        } else if (result.action === "failed") {
          stats.failed++;
        } else if (result.action === "skipped") {
          stats.skipped++;
        }
      } catch (error) {
        logError(`[automation-engine] Failed to execute rule for entity ${entity.id}`, error);
        stats.failed++;
      }
    }
  } catch (error) {
    logError(`[automation-engine] Failed to process rule ${rule.id}`, error);
    stats.failed++;
  }

  return stats;
}

// ─── Main Engine ───────────────────────────────────────────────────────────

/**
 * Run the automation engine batch processor.
 *
 * Steps:
 * 1. Create execution tracking record
 * 2. Fetch all enabled automation rules
 * 3. For each rule, fetch candidate entities and execute
 * 4. Track execution stats
 * 5. Update execution record with results
 *
 * Designed for cron execution every 10 minutes.
 * Respects Vercel's 60s timeout by limiting batch size and checking elapsed time.
 *
 * @param executionType - Type of execution: scheduled (cron), manual, or test
 * @returns BatchExecutionResult with stats
 */
export async function runAutomationEngine(
  executionType: "scheduled" | "manual" | "test" = "scheduled"
): Promise<BatchExecutionResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  let executionId: string;
  try {
    executionId = await createExecutionRecord(executionType);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logError("[automation-engine] Failed to create execution record", error);
    throw new Error(`Failed to start automation engine: ${errorMsg}`);
  }

  logEvent("info", "[automation-engine] Starting batch execution", {
    executionId,
    executionType,
  });

  const stats = {
    rulesProcessed: 0,
    messagesSent: 0,
    messagesFailed: 0,
    messagesSkipped: 0,
  };

  try {
    // ─── Step 1: Fetch All Enabled Rules ───────────────────────────────────

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rules, error: rulesError } = await (admin as any)
      .from("automation_rules")
      .select("*")
      .eq("enabled", true)
      .limit(MAX_RULES_PER_BATCH);

    if (rulesError) {
      const errorMsg = `Failed to fetch enabled rules: ${rulesError.message}`;
      errors.push(errorMsg);
      logError("[automation-engine] " + errorMsg, rulesError);

      await updateExecutionRecord(executionId, {
        rulesProcessed: 0,
        messagesSent: 0,
        messagesFailed: 0,
        messagesSkipped: 0,
        durationMs: Date.now() - startTime,
        status: "failed",
        errorMessage: errorMsg,
      });

      return {
        executionId,
        rulesProcessed: 0,
        messagesSent: 0,
        messagesFailed: 0,
        messagesSkipped: 0,
        durationMs: Date.now() - startTime,
        status: "failed",
        errors,
      };
    }

    const enabledRules = (rules || []) as AutomationRule[];

    if (enabledRules.length === 0) {
      logEvent("info", "[automation-engine] No enabled rules found, skipping execution");

      await updateExecutionRecord(executionId, {
        rulesProcessed: 0,
        messagesSent: 0,
        messagesFailed: 0,
        messagesSkipped: 0,
        durationMs: Date.now() - startTime,
        status: "completed",
      });

      return {
        executionId,
        rulesProcessed: 0,
        messagesSent: 0,
        messagesFailed: 0,
        messagesSkipped: 0,
        durationMs: Date.now() - startTime,
        status: "completed",
        errors: [],
      };
    }

    logEvent("info", `[automation-engine] Found ${enabledRules.length} enabled rules`);

    // ─── Step 2: Process Each Rule ─────────────────────────────────────────

    let timedOut = false;

    for (const rule of enabledRules) {
      // Check timeout before processing each rule
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_TIME_MS) {
        logEvent("warn", "[automation-engine] Approaching timeout, stopping early", {
          elapsed,
          maxTime: MAX_EXECUTION_TIME_MS,
          rulesProcessed: stats.rulesProcessed,
          totalRules: enabledRules.length,
        });
        timedOut = true;
        break;
      }

      // Get the template for this rule type
      const template = getTemplateById(rule.rule_type);
      if (!template) {
        const errorMsg = `Unknown rule type: ${rule.rule_type}`;
        errors.push(errorMsg);
        logError(`[automation-engine] ${errorMsg}`, { ruleId: rule.id });
        stats.rulesProcessed++;
        continue;
      }

      // Process the rule
      try {
        const ruleStats = await processAutomationRule(rule, template, startTime);

        stats.messagesSent += ruleStats.sent;
        stats.messagesFailed += ruleStats.failed;
        stats.messagesSkipped += ruleStats.skipped;
        stats.rulesProcessed++;

        if (ruleStats.timedOut) {
          timedOut = true;
          break;
        }
      } catch (error) {
        const errorMsg = `Failed to process rule ${rule.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        errors.push(errorMsg);
        logError(`[automation-engine] ${errorMsg}`, error);
        stats.rulesProcessed++;
      }
    }

    // ─── Step 3: Determine Final Status ────────────────────────────────────

    const durationMs = Date.now() - startTime;
    let status: "completed" | "partial" | "failed";

    if (timedOut) {
      status = "partial";
    } else if (errors.length > 0) {
      status = stats.messagesSent > 0 ? "partial" : "failed";
    } else {
      status = "completed";
    }

    // ─── Step 4: Update Execution Record ───────────────────────────────────

    await updateExecutionRecord(executionId, {
      rulesProcessed: stats.rulesProcessed,
      messagesSent: stats.messagesSent,
      messagesFailed: stats.messagesFailed,
      messagesSkipped: stats.messagesSkipped,
      durationMs,
      status,
      errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
      metadata: {
        timedOut,
        totalRulesFound: enabledRules.length,
        executionType,
      },
    });

    logEvent("info", "[automation-engine] Batch execution completed", {
      executionId,
      durationMs,
      status,
      stats,
    });

    return {
      executionId,
      rulesProcessed: stats.rulesProcessed,
      messagesSent: stats.messagesSent,
      messagesFailed: stats.messagesFailed,
      messagesSkipped: stats.messagesSkipped,
      durationMs,
      status,
      errors,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    errors.push(errorMsg);

    logError("[automation-engine] Fatal error during batch execution", error);

    await updateExecutionRecord(executionId, {
      rulesProcessed: stats.rulesProcessed,
      messagesSent: stats.messagesSent,
      messagesFailed: stats.messagesFailed,
      messagesSkipped: stats.messagesSkipped,
      durationMs,
      status: "failed",
      errorMessage: errorMsg,
    });

    return {
      executionId,
      rulesProcessed: stats.rulesProcessed,
      messagesSent: stats.messagesSent,
      messagesFailed: stats.messagesFailed,
      messagesSkipped: stats.messagesSkipped,
      durationMs,
      status: "failed",
      errors,
    };
  }
}

/**
 * Process a specific automation rule by ID (for manual execution).
 *
 * @param ruleId - The automation rule ID to process
 * @returns BatchExecutionResult with stats for this single rule
 */
export async function runAutomationRuleById(
  ruleId: string
): Promise<BatchExecutionResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  let executionId: string;
  try {
    executionId = await createExecutionRecord("manual");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logError("[automation-engine] Failed to create execution record", error);
    throw new Error(`Failed to start automation engine: ${errorMsg}`);
  }

  logEvent("info", "[automation-engine] Starting manual rule execution", {
    executionId,
    ruleId,
  });

  const stats = {
    rulesProcessed: 0,
    messagesSent: 0,
    messagesFailed: 0,
    messagesSkipped: 0,
  };

  try {
    // Fetch the specific rule
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rule, error: ruleError } = await (admin as any)
      .from("automation_rules")
      .select("*")
      .eq("id", ruleId)
      .single();

    if (ruleError || !rule) {
      const errorMsg = `Rule not found: ${ruleId}`;
      errors.push(errorMsg);
      logError("[automation-engine] " + errorMsg, ruleError);

      await updateExecutionRecord(executionId, {
        rulesProcessed: 0,
        messagesSent: 0,
        messagesFailed: 0,
        messagesSkipped: 0,
        durationMs: Date.now() - startTime,
        status: "failed",
        errorMessage: errorMsg,
      });

      return {
        executionId,
        rulesProcessed: 0,
        messagesSent: 0,
        messagesFailed: 0,
        messagesSkipped: 0,
        durationMs: Date.now() - startTime,
        status: "failed",
        errors,
      };
    }

    // Get the template for this rule type
    const template = getTemplateById(rule.rule_type);
    if (!template) {
      const errorMsg = `Unknown rule type: ${rule.rule_type}`;
      errors.push(errorMsg);
      logError(`[automation-engine] ${errorMsg}`, { ruleId: rule.id });

      await updateExecutionRecord(executionId, {
        rulesProcessed: 1,
        messagesSent: 0,
        messagesFailed: 0,
        messagesSkipped: 0,
        durationMs: Date.now() - startTime,
        status: "failed",
        errorMessage: errorMsg,
      });

      return {
        executionId,
        rulesProcessed: 1,
        messagesSent: 0,
        messagesFailed: 0,
        messagesSkipped: 0,
        durationMs: Date.now() - startTime,
        status: "failed",
        errors,
      };
    }

    // Process the rule
    const ruleStats = await processAutomationRule(rule, template, startTime);

    stats.messagesSent = ruleStats.sent;
    stats.messagesFailed = ruleStats.failed;
    stats.messagesSkipped = ruleStats.skipped;
    stats.rulesProcessed = 1;

    const durationMs = Date.now() - startTime;
    const status = ruleStats.failed > 0 && ruleStats.sent === 0 ? "failed" : "completed";

    await updateExecutionRecord(executionId, {
      rulesProcessed: 1,
      messagesSent: stats.messagesSent,
      messagesFailed: stats.messagesFailed,
      messagesSkipped: stats.messagesSkipped,
      durationMs,
      status,
      metadata: {
        ruleId,
        executionType: "manual",
      },
    });

    logEvent("info", "[automation-engine] Manual rule execution completed", {
      executionId,
      ruleId,
      durationMs,
      status,
      stats,
    });

    return {
      executionId,
      rulesProcessed: 1,
      messagesSent: stats.messagesSent,
      messagesFailed: stats.messagesFailed,
      messagesSkipped: stats.messagesSkipped,
      durationMs,
      status,
      errors,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    errors.push(errorMsg);

    logError("[automation-engine] Fatal error during manual execution", error);

    await updateExecutionRecord(executionId, {
      rulesProcessed: stats.rulesProcessed,
      messagesSent: stats.messagesSent,
      messagesFailed: stats.messagesFailed,
      messagesSkipped: stats.messagesSkipped,
      durationMs,
      status: "failed",
      errorMessage: errorMsg,
    });

    return {
      executionId,
      rulesProcessed: stats.rulesProcessed,
      messagesSent: stats.messagesSent,
      messagesFailed: stats.messagesFailed,
      messagesSkipped: stats.messagesSkipped,
      durationMs,
      status: "failed",
      errors,
    };
  }
}
