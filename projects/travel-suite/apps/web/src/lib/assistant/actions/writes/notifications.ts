/* ------------------------------------------------------------------
 * Notification write actions for the TripBuilt assistant.
 *
 * Actions: send_whatsapp_message, schedule_followup
 *
 * All queries are scoped to `organization_id` from the ActionContext.
 * Every handler is wrapped in try/catch and returns a structured
 * ActionResult. Immutable patterns used throughout.
 *
 * Notifications are queued via the `notification_queue` table,
 * matching the existing notification pipeline pattern.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify a client belongs to the caller's organisation and return their
 * profile details. Returns null if the client is not found.
 */
async function verifyClientAndGetProfile(
  ctx: Readonly<{ supabase: ActionContext["supabase"]; organizationId: string }>,
  clientId: string,
): Promise<{
  readonly id: string;
  readonly fullName: string;
  readonly phone: string | null;
  readonly phoneWhatsapp: string | null;
} | null> {
  const { data, error } = await ctx.supabase
    .from("clients")
    .select(
      "id, profiles!clients_id_fkey(full_name, phone, phone_whatsapp)",
    )
    .eq("id", clientId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as {
    readonly id: string;
    readonly profiles: {
      readonly full_name: string | null;
      readonly phone: string | null;
      readonly phone_whatsapp: string | null;
    } | null;
  };

  return {
    id: row.id,
    fullName: row.profiles?.full_name ?? "Unknown client",
    phone: row.profiles?.phone ?? null,
    phoneWhatsapp: row.profiles?.phone_whatsapp ?? null,
  };
}

// ---------------------------------------------------------------------------
// 1. send_whatsapp_message
// ---------------------------------------------------------------------------

const sendWhatsappMessage: ActionDefinition = {
  name: "send_whatsapp_message",
  description: "Send a WhatsApp message to a client",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "The UUID of the client to message",
      },
      message: {
        type: "string",
        description: "The message content to send via WhatsApp",
      },
    },
    required: ["client_id", "message"],
  },

  async execute(
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    try {
      const clientId =
        typeof params.client_id === "string" ? params.client_id : undefined;
      const messageText =
        typeof params.message === "string" ? params.message.trim() : undefined;

      if (clientId === undefined) {
        return {
          success: false,
          message: "client_id is required.",
        };
      }

      if (messageText === undefined || messageText.length === 0) {
        return {
          success: false,
          message: "message is required and cannot be empty.",
        };
      }

      // Verify client belongs to org and get phone details
      const client = await verifyClientAndGetProfile(ctx, clientId);

      if (!client) {
        return {
          success: false,
          message:
            "Client not found. They may not exist or may belong to a different organization.",
        };
      }

      // Prefer WhatsApp number, fall back to regular phone
      const whatsappPhone = client.phoneWhatsapp ?? client.phone;

      if (!whatsappPhone) {
        return {
          success: false,
          message: `Cannot send WhatsApp message to ${client.fullName}: no phone number on file. Please add a phone number to their profile first.`,
        };
      }

      // Queue the notification rather than sending directly
      const { error: insertError } = await ctx.supabase
        .from("notification_queue")
        .insert({
          notification_type: "assistant_whatsapp",
          channel_preference: "whatsapp",
          user_id: clientId,
          recipient_phone: whatsappPhone,
          scheduled_for: new Date().toISOString(),
          payload: {
            message: messageText,
            sent_by: ctx.userId,
            client_name: client.fullName,
          },
        });

      if (insertError) {
        return {
          success: false,
          message: `Failed to queue WhatsApp message: ${insertError.message}`,
        };
      }

      return {
        success: true,
        data: {
          clientId: client.id,
          clientName: client.fullName,
          phone: whatsappPhone,
          messagePreview:
            messageText.length > 100
              ? `${messageText.slice(0, 100)}...`
              : messageText,
        },
        message: `WhatsApp message queued for ${client.fullName} (${whatsappPhone}). It will be delivered shortly.`,
        affectedEntities: [{ type: "client", id: client.id }],
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error sending WhatsApp message";
      return {
        success: false,
        message: `Error sending WhatsApp message: ${message}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 2. schedule_followup
// ---------------------------------------------------------------------------

const scheduleFollowup: ActionDefinition = {
  name: "schedule_followup",
  description:
    "Schedule a follow-up reminder for a client at a specific date/time",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "The UUID of the client to follow up with",
      },
      followup_date: {
        type: "string",
        description:
          "ISO 8601 date/time for when the follow-up reminder should fire",
      },
      note: {
        type: "string",
        description: "What the follow-up is about",
      },
    },
    required: ["client_id", "followup_date", "note"],
  },

  async execute(
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    try {
      const clientId =
        typeof params.client_id === "string" ? params.client_id : undefined;
      const followupDate =
        typeof params.followup_date === "string"
          ? params.followup_date
          : undefined;
      const note =
        typeof params.note === "string" ? params.note.trim() : undefined;

      if (clientId === undefined) {
        return {
          success: false,
          message: "client_id is required.",
        };
      }

      if (followupDate === undefined) {
        return {
          success: false,
          message: "followup_date is required (ISO 8601 format).",
        };
      }

      // Validate the date string
      const parsedDate = new Date(followupDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return {
          success: false,
          message: `Invalid date format: "${followupDate}". Please provide a valid ISO 8601 date.`,
        };
      }

      if (note === undefined || note.length === 0) {
        return {
          success: false,
          message: "note is required and cannot be empty.",
        };
      }

      // Verify client belongs to org
      const client = await verifyClientAndGetProfile(ctx, clientId);

      if (!client) {
        return {
          success: false,
          message:
            "Client not found. They may not exist or may belong to a different organization.",
        };
      }

      // Queue a follow-up reminder notification for the operator (not the client)
      const { error: insertError } = await ctx.supabase
        .from("notification_queue")
        .insert({
          notification_type: "follow_up_reminder",
          user_id: ctx.userId,
          scheduled_for: parsedDate.toISOString(),
          payload: {
            client_id: clientId,
            client_name: client.fullName,
            note,
            scheduled_by: ctx.userId,
          },
        });

      if (insertError) {
        return {
          success: false,
          message: `Failed to schedule follow-up: ${insertError.message}`,
        };
      }

      // Safe: clientId was verified as belonging to ctx.organizationId via verifyClientAndGetProfile above
      const { error: updateError } = await ctx.supabase
        .from("profiles")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", clientId);

      if (updateError) {
        // The follow-up was scheduled but the contact timestamp could not be updated
        // -- still report success since the primary action succeeded.
        const formattedDate = parsedDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        return {
          success: true,
          data: {
            clientId: client.id,
            clientName: client.fullName,
            scheduledFor: parsedDate.toISOString(),
            note,
            warning:
              "Follow-up was scheduled but the last-contacted timestamp could not be updated.",
          },
          message: `Follow-up scheduled for ${client.fullName} on ${formattedDate}: "${note}". Note: last-contacted date could not be updated.`,
          affectedEntities: [{ type: "client", id: client.id }],
        };
      }

      const formattedDate = parsedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      return {
        success: true,
        data: {
          clientId: client.id,
          clientName: client.fullName,
          scheduledFor: parsedDate.toISOString(),
          note,
        },
        message: `Follow-up reminder scheduled for ${client.fullName} on ${formattedDate}: "${note}".`,
        affectedEntities: [{ type: "client", id: client.id }],
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error scheduling follow-up";
      return {
        success: false,
        message: `Error scheduling follow-up: ${message}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export const notificationWriteActions: readonly ActionDefinition[] = [
  sendWhatsappMessage,
  scheduleFollowup,
];
