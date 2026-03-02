/* ------------------------------------------------------------------
 * Read actions for assistant preferences.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";
import { getAllPreferences, getPreference } from "../../preferences";

// ---------------------------------------------------------------------------
// get_my_preferences
// ---------------------------------------------------------------------------

async function executeGetMyPreferences(
  ctx: ActionContext,
): Promise<ActionResult> {
  const prefs = await getAllPreferences(ctx);

  if (prefs.length === 0) {
    return {
      success: true,
      message: "You haven't set any preferences yet. I can remember things like your default currency, preferred drivers, or notification preferences.",
      data: [],
    };
  }

  const formatted = prefs
    .map((p) => `- **${p.key}**: ${typeof p.value === "string" ? p.value : JSON.stringify(p.value)}`)
    .join("\n");

  return {
    success: true,
    message: `Here are your saved preferences:\n${formatted}`,
    data: prefs,
  };
}

const getMyPreferences: ActionDefinition = {
  name: "get_my_preferences",
  description: "Get all saved preferences for the current user (default currency, preferred driver, notification style, etc.)",
  category: "read",
  parameters: {
    type: "object",
    properties: {},
  },
  requiresConfirmation: false,
  execute: (ctx) => executeGetMyPreferences(ctx),
};

// ---------------------------------------------------------------------------
// get_preference
// ---------------------------------------------------------------------------

async function executeGetPreference(
  ctx: ActionContext,
  params: Record<string, unknown>,
): Promise<ActionResult> {
  const key = typeof params.key === "string" ? params.key.trim() : "";

  if (!key) {
    return { success: false, message: "Please specify which preference to look up." };
  }

  const value = await getPreference(ctx, key);

  if (value === null) {
    return {
      success: true,
      message: `No preference found for "${key}". Would you like me to set one?`,
    };
  }

  return {
    success: true,
    message: `Your "${key}" preference is set to: ${typeof value === "string" ? value : JSON.stringify(value)}`,
    data: { key, value },
  };
}

const getPreferenceDef: ActionDefinition = {
  name: "get_preference",
  description: "Get a specific saved preference by key (e.g., 'default_currency', 'preferred_driver')",
  category: "read",
  parameters: {
    type: "object",
    properties: {
      key: {
        type: "string",
        description: "The preference key to look up",
      },
    },
    required: ["key"],
  },
  requiresConfirmation: false,
  execute: (ctx, params) => executeGetPreference(ctx, params),
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const preferenceReadActions: readonly ActionDefinition[] = [
  getMyPreferences,
  getPreferenceDef,
];
