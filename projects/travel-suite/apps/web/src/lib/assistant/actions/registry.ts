/* ------------------------------------------------------------------
 * Central action registry -- collects all action definitions and
 * exposes lookup helpers for the orchestrator.
 *
 * This is a pure module with no side effects beyond the module-level
 * initialization of the collections.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, OpenAITool } from "../types";
import { toOpenAITool } from "../types";
import { dashboardActions } from "./reads/dashboard";
import { tripActions } from "./reads/trips";
import { clientActions } from "./reads/clients";
import { invoiceActions } from "./reads/invoices";
import { driverActions } from "./reads/drivers";
import { proposalActions } from "./reads/proposals";
import { tripWriteActions } from "./writes/trips";
import { clientWriteActions } from "./writes/clients";
import { invoiceWriteActions } from "./writes/invoices";
import { proposalWriteActions } from "./writes/proposals";
import { notificationWriteActions } from "./writes/notifications";
import { preferenceReadActions } from "./reads/preferences";
import { preferenceWriteActions } from "./writes/preferences";

// ---------------------------------------------------------------------------
// Combined action list
// ---------------------------------------------------------------------------

const allActions: readonly ActionDefinition[] = [
  ...dashboardActions,
  ...tripActions,
  ...clientActions,
  ...invoiceActions,
  ...driverActions,
  ...proposalActions,
  ...tripWriteActions,
  ...clientWriteActions,
  ...invoiceWriteActions,
  ...proposalWriteActions,
  ...notificationWriteActions,
  ...preferenceReadActions,
  ...preferenceWriteActions,
];

// ---------------------------------------------------------------------------
// O(1) lookup map
// ---------------------------------------------------------------------------

const actionMap = new Map<string, ActionDefinition>(
  allActions.map((action) => [action.name, action]),
);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get all registered action definitions. */
export function getAllActions(): readonly ActionDefinition[] {
  return allActions;
}

/** Get the OpenAI tool schemas for all registered actions. */
export function getActionSchemas(): readonly OpenAITool[] {
  return allActions.map(toOpenAITool);
}

/** Find an action by name. Returns undefined if not found. */
export function findAction(name: string): ActionDefinition | undefined {
  return actionMap.get(name);
}

/** Get all read-only action schemas (for restricted access tiers). */
export function getReadOnlySchemas(): readonly OpenAITool[] {
  return allActions
    .filter((action) => action.category === "read")
    .map(toOpenAITool);
}

/** Get the total count of registered actions. */
export function getActionCount(): number {
  return allActions.length;
}
