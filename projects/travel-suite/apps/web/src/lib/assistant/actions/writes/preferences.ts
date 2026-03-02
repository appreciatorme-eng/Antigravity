/* ------------------------------------------------------------------
 * Write actions for assistant preferences.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";
import { setPreference, deletePreference } from "../../preferences";

// ---------------------------------------------------------------------------
// Known preference keys (for validation and suggestions)
// ---------------------------------------------------------------------------

const KNOWN_KEYS = new Set([
  "default_currency",
  "preferred_driver",
  "notification_style",
  "date_format",
  "language",
  "default_trip_status",
  "invoice_reminder_days",
  "follow_up_interval_days",
]);

// ---------------------------------------------------------------------------
// set_preference
// ---------------------------------------------------------------------------

async function executeSetPreference(
  ctx: ActionContext,
  params: Record<string, unknown>,
): Promise<ActionResult> {
  const key = typeof params.key === "string" ? params.key.trim().toLowerCase().replace(/\s+/g, "_") : "";
  const value = params.value;

  if (!key) {
    return { success: false, message: "Please specify a preference key." };
  }

  if (value === undefined || value === null) {
    return { success: false, message: "Please specify a value for the preference." };
  }

  // Key length validation
  if (key.length > 100) {
    return { success: false, message: "Preference key is too long (max 100 characters)." };
  }

  const result = await setPreference(ctx, key, value);

  if (!result.success) {
    return {
      success: false,
      message: `Failed to save preference: ${result.error}`,
    };
  }

  const suggestion = !KNOWN_KEYS.has(key)
    ? ` (Tip: common keys include: ${[...KNOWN_KEYS].slice(0, 4).join(", ")})`
    : "";

  return {
    success: true,
    message: `Saved! Your "${key}" preference is now set to: ${typeof value === "string" ? value : JSON.stringify(value)}${suggestion}`,
    data: { key, value },
    affectedEntities: [{ type: "preference", id: key }],
  };
}

const setPreferenceDef: ActionDefinition = {
  name: "set_preference",
  description: "Save a preference for the current user (e.g., default currency, preferred driver, notification style). The assistant will remember this for future conversations.",
  category: "write",
  parameters: {
    type: "object",
    properties: {
      key: {
        type: "string",
        description: "The preference key (e.g., 'default_currency', 'preferred_driver', 'notification_style')",
      },
      value: {
        description: "The preference value (string, number, or object)",
      },
    },
    required: ["key", "value"],
  },
  requiresConfirmation: false, // Preferences are low-risk, no confirmation needed
  execute: (ctx, params) => executeSetPreference(ctx, params),
};

// ---------------------------------------------------------------------------
// delete_preference
// ---------------------------------------------------------------------------

async function executeDeletePreference(
  ctx: ActionContext,
  params: Record<string, unknown>,
): Promise<ActionResult> {
  const key = typeof params.key === "string" ? params.key.trim() : "";

  if (!key) {
    return { success: false, message: "Please specify which preference to delete." };
  }

  const result = await deletePreference(ctx, key);

  if (!result.success) {
    return {
      success: false,
      message: `Failed to delete preference: ${result.error}`,
    };
  }

  return {
    success: true,
    message: `Preference "${key}" has been removed.`,
    affectedEntities: [{ type: "preference", id: key }],
  };
}

const deletePreferenceDef: ActionDefinition = {
  name: "delete_preference",
  description: "Remove a saved preference by key",
  category: "write",
  parameters: {
    type: "object",
    properties: {
      key: {
        type: "string",
        description: "The preference key to delete",
      },
    },
    required: ["key"],
  },
  requiresConfirmation: false, // Low-risk deletion
  execute: (ctx, params) => executeDeletePreference(ctx, params),
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const preferenceWriteActions: readonly ActionDefinition[] = [
  setPreferenceDef,
  deletePreferenceDef,
];
