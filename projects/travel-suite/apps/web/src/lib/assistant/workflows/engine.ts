import "server-only";

/* ------------------------------------------------------------------
 * Workflow Engine -- state machine for guided multi-step workflows.
 *
 * Manages active workflow sessions in Redis. Each workflow session
 * tracks the current step index and collected field values.
 *
 * The engine does NOT call any LLM -- all prompts are template-based
 * making guided workflows zero-cost ($0.00 per interaction).
 *
 * Immutable patterns: workflow state is read -> transformed -> written.
 * ------------------------------------------------------------------ */

import { getCachedJson, setCachedJson, deleteCachedByPrefix } from "@/lib/cache/upstash";
import type { ActionContext, OrchestratorResponse } from "../types";
import { findAction } from "../actions/registry";
import type { WorkflowDefinition } from "./definitions";
import { parseNaturalDate } from "../date-parser";

// Types

export interface WorkflowState {
  readonly workflowId: string;
  readonly currentStepIndex: number;
  readonly collectedValues: Readonly<Record<string, string>>;
  readonly startedAt: string;
}

// Constants

const WORKFLOW_KEY_PREFIX = "assistant:workflow";
const WORKFLOW_TTL_SECONDS = 1800; // 30 minutes

// Key helpers

function buildWorkflowKey(orgId: string, userId: string): string {
  return `${WORKFLOW_KEY_PREFIX}:${orgId}:${userId}`;
}

// State management

export async function getActiveWorkflow(
  ctx: ActionContext,
): Promise<WorkflowState | null> {
  try {
    return await getCachedJson<WorkflowState>(
      buildWorkflowKey(ctx.organizationId, ctx.userId),
    );
  } catch {
    return null;
  }
}

export async function saveWorkflowState(
  ctx: ActionContext,
  state: WorkflowState,
): Promise<void> {
  try {
    await setCachedJson(
      buildWorkflowKey(ctx.organizationId, ctx.userId),
      state,
      WORKFLOW_TTL_SECONDS,
    );
  } catch (error) {
    console.error("Failed to save workflow state:", error);
  }
}

export async function clearWorkflowState(
  ctx: ActionContext,
): Promise<void> {
  try {
    await deleteCachedByPrefix(
      buildWorkflowKey(ctx.organizationId, ctx.userId),
    );
  } catch {
    // Silent failure -- best effort cleanup
  }
}

// Start a new workflow

export async function startWorkflow(
  ctx: ActionContext,
  workflow: WorkflowDefinition,
): Promise<OrchestratorResponse> {
  const state: WorkflowState = {
    workflowId: workflow.id,
    currentStepIndex: 0,
    collectedValues: {},
    startedAt: new Date().toISOString(),
  };

  await saveWorkflowState(ctx, state);

  const firstStep = workflow.steps[0];
  const intro = `Let's ${workflow.name.toLowerCase()}! I'll guide you through it step by step. Type "cancel" at any time to stop.\n\n**Step 1/${workflow.steps.length}:** ${firstStep.prompt}`;

  if (firstStep.options && firstStep.options.length > 0) {
    return {
      reply: `${intro}\n\nOptions: ${firstStep.options.join(", ")}`,
    };
  }

  return { reply: intro };
}

// Process the next user input in an active workflow

export async function processWorkflowStep(
  ctx: ActionContext,
  workflow: WorkflowDefinition,
  state: WorkflowState,
  userInput: string,
): Promise<OrchestratorResponse> {
  const trimmed = userInput.trim();

  // Check for cancel
  if (/^(cancel|quit|exit|stop|abort|nevermind)$/i.test(trimmed)) {
    await clearWorkflowState(ctx);
    return { reply: "Workflow cancelled. How else can I help?" };
  }

  const currentStep = workflow.steps[state.currentStepIndex];
  if (!currentStep) {
    await clearWorkflowState(ctx);
    return { reply: "Something went wrong with the workflow. Please try again." };
  }

  // Handle "skip" for optional fields
  if (!currentStep.required && /^skip$/i.test(trimmed)) {
    const updatedValues = { ...state.collectedValues, [currentStep.field]: "" };
    return advanceToNextStep(ctx, workflow, state, updatedValues);
  }

  // Natural language date parsing for date-type fields
  let resolvedInput = trimmed;
  if (currentStep.type === "date") {
    const parsedDate = parseNaturalDate(trimmed);
    if (parsedDate !== null) {
      resolvedInput = parsedDate;
    }
  }

  // Validate select options
  if (currentStep.type === "select" && currentStep.options) {
    const normalizedInput = trimmed.toLowerCase();
    const validOption = currentStep.options.find(
      (opt) => opt.toLowerCase() === normalizedInput,
    );
    if (!validOption) {
      return {
        reply: `Please choose one of: ${currentStep.options.join(", ")}`,
      };
    }
    const updatedValues = { ...state.collectedValues, [currentStep.field]: validOption };
    return advanceToNextStep(ctx, workflow, state, updatedValues);
  }

  // Validate using custom validator
  if (currentStep.validate) {
    const validationError = currentStep.validate(resolvedInput);
    if (validationError) {
      return { reply: `${validationError} Please try again.` };
    }
  }

  // Store the value and advance
  const updatedValues = { ...state.collectedValues, [currentStep.field]: resolvedInput };
  return advanceToNextStep(ctx, workflow, state, updatedValues);
}

// Advance to the next step or complete the workflow

async function advanceToNextStep(
  ctx: ActionContext,
  workflow: WorkflowDefinition,
  state: WorkflowState,
  updatedValues: Record<string, string>,
): Promise<OrchestratorResponse> {
  const nextIndex = state.currentStepIndex + 1;

  // More steps to go?
  if (nextIndex < workflow.steps.length) {
    const nextState: WorkflowState = {
      ...state,
      currentStepIndex: nextIndex,
      collectedValues: updatedValues,
    };
    await saveWorkflowState(ctx, nextState);

    const nextStep = workflow.steps[nextIndex];
    let prompt = `**Step ${nextIndex + 1}/${workflow.steps.length}:** ${nextStep.prompt}`;

    if (nextStep.options && nextStep.options.length > 0) {
      prompt += `\n\nOptions: ${nextStep.options.join(", ")}`;
    }

    return { reply: `Got it! ${prompt}` };
  }

  // All steps complete -- execute the action
  await clearWorkflowState(ctx);

  const params = workflow.buildParams(updatedValues);

  // Build summary of collected data
  const summaryLines = workflow.steps
    .filter((step) => updatedValues[step.field] && updatedValues[step.field] !== "")
    .map((step) => `- **${step.prompt.replace(/\?.*$/, "")}:** ${updatedValues[step.field]}`);

  const summary = `Here's what I've collected:\n\n${summaryLines.join("\n")}`;

  // Try to execute the action
  const action = findAction(workflow.actionName);
  if (!action) {
    return {
      reply: `${summary}\n\nI collected all the details but the action "${workflow.actionName}" isn't available yet. Please create this in the app manually.`,
    };
  }

  // If action requires confirmation, return as proposal
  if (action.requiresConfirmation) {
    return {
      reply: `${summary}\n\nShall I proceed with creating this?`,
      actionProposal: {
        actionName: workflow.actionName,
        params,
        confirmationMessage: `Create ${workflow.name.toLowerCase()} with the above details?`,
      },
    };
  }

  // Execute directly
  try {
    const result = await action.execute(ctx, params);
    if (result.success) {
      return {
        reply: `${summary}\n\n${workflow.successMessage}`,
        actionResult: result,
      };
    }
    return {
      reply: `${summary}\n\nSomething went wrong: ${result.message}`,
      actionResult: result,
    };
  } catch {
    return {
      reply: `${summary}\n\nFailed to complete the action. Please try again or create manually in the app.`,
    };
  }
}
