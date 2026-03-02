/* ------------------------------------------------------------------
 * Write actions for client mutations.
 *
 * All actions require user confirmation before execution.
 * Every query is scoped to `organization_id` from the ActionContext.
 * All handlers are wrapped in try/catch and return ActionResult.
 * Immutable patterns used throughout -- no mutation of input data.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Today as YYYY-MM-DD for note timestamps. */
const todayISO = (): string => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// 1. update_client_stage
// ---------------------------------------------------------------------------

const updateClientStage: ActionDefinition = {
  name: "update_client_stage",
  description:
    "Update a client's lifecycle stage (e.g., new_lead, contacted, qualified, proposal_sent, payment_confirmed, trip_completed)",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "The UUID of the client",
      },
      stage: {
        type: "string",
        description: "The new lifecycle stage",
        enum: [
          "new_lead",
          "contacted",
          "qualified",
          "proposal_sent",
          "payment_confirmed",
          "trip_completed",
        ],
      },
    },
    required: ["client_id", "stage"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const clientId = typeof params.client_id === "string" ? params.client_id.trim() : "";
      const stage = typeof params.stage === "string" ? params.stage.trim() : "";

      if (!clientId) {
        return { success: false, message: "client_id is required." };
      }

      if (!stage) {
        return { success: false, message: "stage is required." };
      }

      const validStages = [
        "new_lead",
        "contacted",
        "qualified",
        "proposal_sent",
        "payment_confirmed",
        "trip_completed",
      ] as const;

      if (!validStages.includes(stage as (typeof validStages)[number])) {
        return {
          success: false,
          message: `Invalid stage "${stage}". Must be one of: ${validStages.join(", ")}.`,
        };
      }

      // Verify the client belongs to this organisation
      const { data: clientRow, error: clientError } = await ctx.supabase
        .from("clients")
        .select("id")
        .eq("id", clientId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (clientError) {
        return {
          success: false,
          message: `Failed to verify client: ${clientError.message}`,
        };
      }

      if (!clientRow) {
        return {
          success: false,
          message: "Client not found or access denied.",
        };
      }

      // Fetch current lifecycle_stage from profiles
      const { data: profile, error: profileError } = await ctx.supabase
        .from("profiles")
        .select("lifecycle_stage")
        .eq("id", clientId)
        .maybeSingle();

      if (profileError) {
        return {
          success: false,
          message: `Failed to fetch client profile: ${profileError.message}`,
        };
      }

      const oldStage = profile?.lifecycle_stage ?? "unknown";

      // Update the lifecycle stage
      const { error: updateError } = await ctx.supabase
        .from("profiles")
        .update({ lifecycle_stage: stage })
        .eq("id", clientId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to update lifecycle stage: ${updateError.message}`,
        };
      }

      return {
        success: true,
        data: { clientId, oldStage, newStage: stage },
        message: `Client lifecycle stage updated from "${oldStage}" to "${stage}".`,
        affectedEntities: [{ type: "client", id: clientId }],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error updating client stage: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 2. add_client_note
// ---------------------------------------------------------------------------

const addClientNote: ActionDefinition = {
  name: "add_client_note",
  description: "Add a note to a client's profile",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "The UUID of the client",
      },
      note: {
        type: "string",
        description: "The note text to add",
      },
    },
    required: ["client_id", "note"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const clientId = typeof params.client_id === "string" ? params.client_id.trim() : "";
      const note = typeof params.note === "string" ? params.note.trim() : "";

      if (!clientId) {
        return { success: false, message: "client_id is required." };
      }

      if (!note) {
        return { success: false, message: "note is required." };
      }

      // Verify the client belongs to this organisation
      const { data: clientRow, error: clientError } = await ctx.supabase
        .from("clients")
        .select("id")
        .eq("id", clientId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (clientError) {
        return {
          success: false,
          message: `Failed to verify client: ${clientError.message}`,
        };
      }

      if (!clientRow) {
        return {
          success: false,
          message: "Client not found or access denied.",
        };
      }

      // Get current notes from the profile
      const { data: profile, error: profileError } = await ctx.supabase
        .from("profiles")
        .select("notes")
        .eq("id", clientId)
        .maybeSingle();

      if (profileError) {
        return {
          success: false,
          message: `Failed to fetch client profile: ${profileError.message}`,
        };
      }

      const existingNotes = profile?.notes ?? "";
      const timestampedNote = `[${todayISO()}] ${note}`;

      // Append the new note -- if existing notes present, add newline separator
      const updatedNotes =
        existingNotes.length > 0
          ? `${existingNotes}\n${timestampedNote}`
          : timestampedNote;

      // Update the notes field
      const { error: updateError } = await ctx.supabase
        .from("profiles")
        .update({ notes: updatedNotes })
        .eq("id", clientId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to add note: ${updateError.message}`,
        };
      }

      return {
        success: true,
        data: { clientId, addedNote: timestampedNote },
        message: `Note added to client profile: "${timestampedNote}"`,
        affectedEntities: [{ type: "client", id: clientId }],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error adding client note: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 3. update_client_tags
// ---------------------------------------------------------------------------

const updateClientTags: ActionDefinition = {
  name: "update_client_tags",
  description:
    "Update a client's tag (e.g., VIP, corporate, budget, premium)",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "The UUID of the client",
      },
      tag: {
        type: "string",
        description: "The tag to set on the client (e.g., VIP, corporate, budget, premium)",
      },
    },
    required: ["client_id", "tag"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const clientId = typeof params.client_id === "string" ? params.client_id.trim() : "";
      const tag = typeof params.tag === "string" ? params.tag.trim() : "";

      if (!clientId) {
        return { success: false, message: "client_id is required." };
      }

      if (!tag) {
        return { success: false, message: "tag is required." };
      }

      // Verify the client belongs to this organisation
      const { data: clientRow, error: clientError } = await ctx.supabase
        .from("clients")
        .select("id")
        .eq("id", clientId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (clientError) {
        return {
          success: false,
          message: `Failed to verify client: ${clientError.message}`,
        };
      }

      if (!clientRow) {
        return {
          success: false,
          message: "Client not found or access denied.",
        };
      }

      // Fetch the current tag for the response message
      const { data: profile, error: profileError } = await ctx.supabase
        .from("profiles")
        .select("client_tag")
        .eq("id", clientId)
        .maybeSingle();

      if (profileError) {
        return {
          success: false,
          message: `Failed to fetch client profile: ${profileError.message}`,
        };
      }

      const oldTag = profile?.client_tag ?? "none";

      // Update the client_tag
      const { error: updateError } = await ctx.supabase
        .from("profiles")
        .update({ client_tag: tag })
        .eq("id", clientId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to update client tag: ${updateError.message}`,
        };
      }

      return {
        success: true,
        data: { clientId, oldTag, newTag: tag },
        message: `Client tag updated from "${oldTag}" to "${tag}".`,
        affectedEntities: [{ type: "client", id: clientId }],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error updating client tag: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const clientWriteActions: readonly ActionDefinition[] = [
  updateClientStage,
  addClientNote,
  updateClientTags,
];
