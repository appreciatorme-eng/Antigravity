import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp.server";
import { sendViaGmail } from "@/lib/email/gmail-send";
import { logError, logEvent } from "@/lib/observability/logger";
import type {
  AutomationTemplate,
  TriggerConfig,
  StopCondition,
} from "./templates";

// ─── Result Types ───────────────────────────────────────────────────────────

export interface ExecutionResult {
  success: boolean;
  action: "sent" | "skipped" | "failed";
  messageId?: string;
  channel?: "whatsapp" | "email" | "both";
  error?: string;
  skipReason?: string;
}

export interface EntityData {
  id: string;
  organizationId: string;
  entityType: "proposal" | "payment" | "trip" | "booking";
  [key: string]: unknown;
}

// ─── Stop Condition Evaluator ──────────────────────────────────────────────

/**
 * Evaluate a single stop condition against entity data.
 * Returns true if the condition is met (meaning we should STOP execution).
 */
function evaluateStopCondition(
  condition: StopCondition,
  entityData: Record<string, unknown>
): boolean {
  const fieldValue = entityData[condition.field];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;

    case "not_equals":
      return fieldValue !== condition.value;

    case "exists":
      return condition.value ? fieldValue != null : fieldValue == null;

    case "greater_than":
      if (typeof fieldValue !== "number" || typeof condition.value !== "number") {
        return false;
      }
      return fieldValue > condition.value;

    case "less_than":
      if (typeof fieldValue !== "number" || typeof condition.value !== "number") {
        return false;
      }
      return fieldValue < condition.value;

    default:
      return false;
  }
}

/**
 * Check if any stop conditions are met for this entity.
 * Returns { shouldStop: true, reason } if we should stop, otherwise { shouldStop: false }.
 */
function checkStopConditions(
  stopConditions: readonly StopCondition[],
  entityData: Record<string, unknown>
): { shouldStop: boolean; reason?: string } {
  for (const condition of stopConditions) {
    if (evaluateStopCondition(condition, entityData)) {
      return {
        shouldStop: true,
        reason: condition.description,
      };
    }
  }

  return { shouldStop: false };
}

// ─── Trigger Condition Checker ─────────────────────────────────────────────

/**
 * Check if the trigger condition is met for this entity.
 * Returns true if the automation should execute.
 */
async function checkTriggerCondition(
  trigger: TriggerConfig,
  entityData: Record<string, unknown>
): Promise<boolean> {
  const now = new Date();

  switch (trigger.trigger_event) {
    case "created": {
      const createdAt = entityData.created_at as string | undefined;
      if (!createdAt) return false;

      const createdDate = new Date(createdAt);
      const hoursSinceCreation =
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

      // Check if delay has passed
      if (hoursSinceCreation < trigger.delay_hours) return false;

      // Check status filter if provided
      if (trigger.status_filter && trigger.status_filter.length > 0) {
        const status = entityData.status as string | undefined;
        if (!status || !trigger.status_filter.includes(status)) return false;
      }

      return true;
    }

    case "updated": {
      const updatedAt = entityData.updated_at as string | undefined;
      if (!updatedAt) return false;

      const updatedDate = new Date(updatedAt);
      const hoursSinceUpdate =
        (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < trigger.delay_hours) return false;

      if (trigger.status_filter && trigger.status_filter.length > 0) {
        const status = entityData.status as string | undefined;
        if (!status || !trigger.status_filter.includes(status)) return false;
      }

      return true;
    }

    case "status_changed": {
      const updatedAt = entityData.updated_at as string | undefined;
      if (!updatedAt) return false;

      const updatedDate = new Date(updatedAt);
      const hoursSinceUpdate =
        (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < trigger.delay_hours) return false;

      if (trigger.status_filter && trigger.status_filter.length > 0) {
        const status = entityData.status as string | undefined;
        if (!status || !trigger.status_filter.includes(status)) return false;
      }

      return true;
    }

    case "date_approaching": {
      if (!trigger.date_field || !trigger.days_before) return false;

      const targetDate = entityData[trigger.date_field] as string | undefined;
      if (!targetDate) return false;

      const targetDateObj = new Date(targetDate);
      const daysUntil =
        (targetDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      // Check if we're within the trigger window (e.g., 3 days before)
      // Allow a small window (±6 hours) to account for cron schedule
      const targetDaysBefore = trigger.days_before;
      const withinWindow =
        daysUntil <= targetDaysBefore && daysUntil >= targetDaysBefore - 0.25;

      if (!withinWindow) return false;

      if (trigger.status_filter && trigger.status_filter.length > 0) {
        const status = entityData.status as string | undefined;
        if (!status || !trigger.status_filter.includes(status)) return false;
      }

      return true;
    }

    default:
      return false;
  }
}

// ─── Message Template Substitution ─────────────────────────────────────────

/**
 * Substitute template variables with actual entity data.
 * Replaces {{variable_name}} with corresponding field values.
 */
function substituteTemplateVariables(
  template: string,
  entityData: Record<string, unknown>,
  variables: readonly string[]
): string {
  let result = template;

  for (const variable of variables) {
    const value = entityData[variable];
    const stringValue = value != null ? String(value) : "";
    const pattern = new RegExp(`{{${variable}}}`, "g");
    result = result.replace(pattern, stringValue);
  }

  return result;
}

// ─── Message Sender ────────────────────────────────────────────────────────

/**
 * Send a message via the specified channel (WhatsApp/email/both).
 */
async function sendMessage(
  channel: "whatsapp" | "email" | "both",
  recipientPhone: string | undefined,
  recipientEmail: string | undefined,
  messageContent: string,
  orgId?: string,
): Promise<ExecutionResult> {
  const results: ExecutionResult[] = [];

  // Send via WhatsApp
  if ((channel === "whatsapp" || channel === "both") && recipientPhone) {
    const whatsappResult = await sendWhatsAppText(recipientPhone, messageContent);

    if (whatsappResult.success) {
      results.push({
        success: true,
        action: "sent",
        channel: "whatsapp",
        messageId: whatsappResult.messageId,
      });
    } else {
      results.push({
        success: false,
        action: "failed",
        channel: "whatsapp",
        error: whatsappResult.error || "WhatsApp send failed",
      });
    }
  }

  // Send via email
  if ((channel === "email" || channel === "both") && recipientEmail && orgId) {
    const htmlBody = `<div style="font-family:sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap">${messageContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
    const emailMsgId = await sendViaGmail(orgId, recipientEmail, "Notification from TripBuilt", htmlBody);

    if (emailMsgId) {
      results.push({
        success: true,
        action: "sent",
        channel: "email",
        messageId: emailMsgId,
      });
    } else {
      results.push({
        success: false,
        action: "failed",
        channel: "email",
        error: "Gmail not connected or send failed",
      });
    }
  }

  // If no valid recipient, skip
  if (results.length === 0) {
    return {
      success: false,
      action: "skipped",
      skipReason: "No valid recipient (phone or email)",
    };
  }

  // Return the first successful result, or the first result if all failed
  const successfulResult = results.find((r) => r.success);
  return successfulResult || results[0];
}

// ─── Main Executor ─────────────────────────────────────────────────────────

/**
 * Execute an automation rule for a specific entity.
 *
 * Steps:
 * 1. Fetch entity data from the database
 * 2. Check if trigger conditions are met
 * 3. Check if any stop conditions are met
 * 4. Substitute template variables
 * 5. Send message via WhatsApp/email
 * 6. Log execution result to automation_logs
 *
 * @param ruleId - The automation rule ID
 * @param template - The automation template configuration
 * @param entityId - The target entity ID (proposal/payment/trip/booking)
 * @param organizationId - The organization ID
 * @returns ExecutionResult indicating success/failure/skip
 */
export async function executeAutomationRule(
  ruleId: string,
  template: AutomationTemplate,
  entityId: string,
  organizationId: string
): Promise<ExecutionResult> {
  const admin = createAdminClient();
  const startTime = Date.now();

  try {
    // ─── Step 1: Fetch Entity Data ─────────────────────────────────────────

    const tableName = `${template.trigger_config.entity_type}s`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entityData, error: fetchError } = await (admin as any)
      .from(tableName)
      .select("*")
      .eq("id", entityId)
      .eq("organization_id", organizationId)
      .single();

    if (fetchError || !entityData) {
      const error = `Failed to fetch entity: ${fetchError?.message || "not found"}`;
      logError(`[automation-executor] ${error}`, fetchError);

      await logExecution(admin, {
        ruleId,
        ruleType: template.id,
        organizationId,
        entityType: template.trigger_config.entity_type,
        entityId,
        status: "failed",
        channel: template.action_config.channel,
        error,
      });

      return {
        success: false,
        action: "failed",
        error,
      };
    }

    // ─── Step 2: Check Trigger Conditions ──────────────────────────────────

    const triggerMet = await checkTriggerCondition(
      template.trigger_config,
      entityData
    );

    if (!triggerMet) {
      await logExecution(admin, {
        ruleId,
        ruleType: template.id,
        organizationId,
        entityType: template.trigger_config.entity_type,
        entityId,
        status: "skipped",
        channel: template.action_config.channel,
        skipReason: "Trigger conditions not met",
      });

      return {
        success: true,
        action: "skipped",
        skipReason: "Trigger conditions not met",
      };
    }

    // ─── Step 3: Check Stop Conditions ─────────────────────────────────────

    const stopCheck = checkStopConditions(template.stop_conditions, entityData);

    if (stopCheck.shouldStop) {
      await logExecution(admin, {
        ruleId,
        ruleType: template.id,
        organizationId,
        entityType: template.trigger_config.entity_type,
        entityId,
        status: "skipped",
        channel: template.action_config.channel,
        skipReason: stopCheck.reason || "Stop condition met",
      });

      return {
        success: true,
        action: "skipped",
        skipReason: stopCheck.reason || "Stop condition met",
      };
    }

    // ─── Step 4: Check for Previous Execution ──────────────────────────────

    // Prevent duplicate sends - check if we already sent a message for this entity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingLog } = await (admin as any)
      .from("automation_logs")
      .select("id, status")
      .eq("rule_id", ruleId)
      .eq("target_entity_id", entityId)
      .eq("status", "sent")
      .single();

    if (existingLog) {
      await logExecution(admin, {
        ruleId,
        ruleType: template.id,
        organizationId,
        entityType: template.trigger_config.entity_type,
        entityId,
        status: "skipped",
        channel: template.action_config.channel,
        skipReason: "Already sent for this entity",
      });

      return {
        success: true,
        action: "skipped",
        skipReason: "Already sent for this entity",
      };
    }

    // ─── Step 5: Substitute Template Variables ─────────────────────────────

    const messageContent = substituteTemplateVariables(
      template.action_config.message_template,
      entityData,
      template.action_config.message_variables
    );

    // ─── Step 6: Extract Recipient Info ────────────────────────────────────

    // Different entity types may have different field names for phone/email
    const recipientPhone =
      (entityData.client_phone as string | undefined) ||
      (entityData.customer_phone as string | undefined) ||
      (entityData.traveler_phone as string | undefined) ||
      (entityData.phone as string | undefined);

    const recipientEmail =
      (entityData.client_email as string | undefined) ||
      (entityData.customer_email as string | undefined) ||
      (entityData.traveler_email as string | undefined) ||
      (entityData.email as string | undefined);

    // ─── Step 7: Send Message ──────────────────────────────────────────────

    const sendResult = await sendMessage(
      template.action_config.channel,
      recipientPhone,
      recipientEmail,
      messageContent,
      organizationId,
    );

    // ─── Step 8: Log Execution ─────────────────────────────────────────────

    await logExecution(admin, {
      ruleId,
      ruleType: template.id,
      organizationId,
      entityType: template.trigger_config.entity_type,
      entityId,
      status: sendResult.action,
      channel: template.action_config.channel,
      messageContent,
      messageId: sendResult.messageId,
      error: sendResult.error,
      skipReason: sendResult.skipReason,
    });

    const duration = Date.now() - startTime;
    logEvent("info", "[automation-executor] Rule executed", {
      ruleId,
      ruleType: template.id,
      entityId,
      action: sendResult.action,
      duration,
    });

    return sendResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError("[automation-executor] Execution failed", error);

    await logExecution(admin, {
      ruleId,
      ruleType: template.id,
      organizationId,
      entityType: template.trigger_config.entity_type,
      entityId,
      status: "failed",
      channel: template.action_config.channel,
      error: errorMessage,
    });

    return {
      success: false,
      action: "failed",
      error: errorMessage,
    };
  }
}

// ─── Logging Helper ────────────────────────────────────────────────────────

interface LogExecutionParams {
  ruleId: string;
  ruleType: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  status: "pending" | "sent" | "failed" | "skipped";
  channel: "whatsapp" | "email" | "both";
  messageContent?: string;
  messageId?: string;
  error?: string;
  skipReason?: string;
}

async function logExecution(
  admin: ReturnType<typeof createAdminClient>,
  params: LogExecutionParams
): Promise<void> {
  try {
    const logData = {
      organization_id: params.organizationId,
      rule_id: params.ruleId,
      rule_type: params.ruleType,
      status: params.status,
      target_entity_type: params.entityType,
      target_entity_id: params.entityId,
      message_channel: params.channel,
      message_content: params.messageContent,
      error_message:
        params.error || (params.skipReason ? `Skipped: ${params.skipReason}` : null),
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from("automation_logs").insert(logData);

    if (error) {
      logError("[automation-executor] Failed to log execution", error);
    }
  } catch (error) {
    logError("[automation-executor] Exception while logging execution", error);
  }
}
