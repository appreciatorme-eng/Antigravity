import "server-only";

/* ------------------------------------------------------------------
 * Preferences Manager -- persistent per-user assistant preferences.
 *
 * Stores operator preferences (default currency, preferred driver,
 * notification style, etc.) in the `assistant_preferences` table.
 *
 * Each preference is a key-value pair scoped to (organization, user).
 *
 * NOTE: `assistant_preferences` is not yet in the generated Database
 * types. We cast via `(ctx.supabase as any)` until types are regenerated.
 * ------------------------------------------------------------------ */

import { safeErrorMessage } from "@/lib/security/safe-error";
import type { ActionContext } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single preference entry. */
export interface PreferenceEntry {
  readonly key: string;
  readonly value: unknown;
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prefsTable(ctx: ActionContext) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ctx.supabase as any).from("assistant_preferences");
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Get all preferences for the current user. */
export async function getAllPreferences(
  ctx: ActionContext,
): Promise<readonly PreferenceEntry[]> {
  try {
    const { data, error } = await prefsTable(ctx)
      .select("preference_key, preference_value, updated_at")
      .eq("organization_id", ctx.organizationId)
      .eq("user_id", ctx.userId)
      .order("preference_key", { ascending: true });

    if (error || !data) {
      return [];
    }

    return (data as Array<{ preference_key: string; preference_value: unknown; updated_at: string }>).map(
      (row) => ({
        key: row.preference_key,
        value: row.preference_value,
        updatedAt: row.updated_at,
      }),
    );
  } catch {
    return [];
  }
}

/** Get a single preference by key. */
export async function getPreference(
  ctx: ActionContext,
  key: string,
): Promise<unknown | null> {
  try {
    const { data, error } = await prefsTable(ctx)
      .select("preference_value")
      .eq("organization_id", ctx.organizationId)
      .eq("user_id", ctx.userId)
      .eq("preference_key", key)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return (data as { preference_value: unknown }).preference_value;
  } catch {
    return null;
  }
}

/** Set (upsert) a preference. */
export async function setPreference(
  ctx: ActionContext,
  key: string,
  value: unknown,
): Promise<{ readonly success: boolean; readonly error?: string }> {
  try {
    const { error } = await prefsTable(ctx)
      .upsert(
        {
          organization_id: ctx.organizationId,
          user_id: ctx.userId,
          preference_key: key,
          preference_value: value,
        },
        { onConflict: "organization_id,user_id,preference_key" },
      );

    if (error) {
      console.error("[assistant/preferences] setPreference error:", error.message);
      return { success: false, error: safeErrorMessage(error, "Failed to save preference") };
    }

    return { success: true };
  } catch (err) {
    console.error("[assistant/preferences] setPreference unhandled:", err);
    return {
      success: false,
      error: safeErrorMessage(err, "Failed to save preference"),
    };
  }
}

/** Delete a preference by key. */
export async function deletePreference(
  ctx: ActionContext,
  key: string,
): Promise<{ readonly success: boolean; readonly error?: string }> {
  try {
    const { error } = await prefsTable(ctx)
      .delete()
      .eq("organization_id", ctx.organizationId)
      .eq("user_id", ctx.userId)
      .eq("preference_key", key);

    if (error) {
      console.error("[assistant/preferences] deletePreference error:", error.message);
      return { success: false, error: safeErrorMessage(error, "Failed to delete preference") };
    }

    return { success: true };
  } catch (err) {
    console.error("[assistant/preferences] deletePreference unhandled:", err);
    return {
      success: false,
      error: safeErrorMessage(err, "Failed to delete preference"),
    };
  }
}

/** Build a formatted preferences block for the system prompt. */
export async function buildPreferencesBlock(
  ctx: ActionContext,
): Promise<string> {
  const prefs = await getAllPreferences(ctx);

  if (prefs.length === 0) {
    return "";
  }

  const entries = prefs
    .map((p) => `- ${p.key}: ${typeof p.value === "string" ? p.value : JSON.stringify(p.value)}`)
    .join("\n");

  return `\n\n## Your Preferences\n${entries}`;
}
