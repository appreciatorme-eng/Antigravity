/* ------------------------------------------------------------------
 * Write actions for trip mutations.
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

function parseDateOnly(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value.trim());
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

async function resolveClientByName(
  ctx: ActionContext,
  clientName: string,
): Promise<
  | { readonly clientId: string; readonly fullName: string }
  | { readonly error: string }
> {
  const { data, error } = await ctx.supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", ctx.organizationId)
    .eq("role", "client")
    .ilike("full_name", `%${clientName}%`)
    .limit(5);

  if (error) {
    return { error: `Failed to find client: ${error.message}` };
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return { error: `No client found matching "${clientName}".` };
  }

  if (rows.length > 1) {
    const names = rows.map((row) => row.full_name ?? row.id).join(", ");
    return { error: `Multiple clients matched "${clientName}": ${names}. Please be more specific.` };
  }

  return {
    clientId: rows[0].id,
    fullName: rows[0].full_name ?? clientName,
  };
}

// ---------------------------------------------------------------------------
// 1. create_trip
// ---------------------------------------------------------------------------

const createTrip: ActionDefinition = {
  name: "create_trip",
  description: "Create a new trip and itinerary for an existing client",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      client_name: {
        type: "string",
        description: "Client name for the trip",
      },
      destination: {
        type: "string",
        description: "Destination for the trip",
      },
      start_date: {
        type: "string",
        description: "Trip start date",
      },
      end_date: {
        type: "string",
        description: "Trip end date",
      },
      num_travelers: {
        type: "number",
        description: "Number of travelers",
      },
      notes: {
        type: "string",
        description: "Optional trip notes",
      },
    },
    required: ["client_name", "destination", "start_date", "end_date"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const clientName =
        typeof params.client_name === "string" ? params.client_name.trim() : "";
      const destination =
        typeof params.destination === "string" ? params.destination.trim() : "";
      const startDate = parseDateOnly(params.start_date);
      const endDate = parseDateOnly(params.end_date);
      const numTravelers =
        typeof params.num_travelers === "number" && Number.isFinite(params.num_travelers)
          ? Math.max(1, Math.round(params.num_travelers))
          : 1;
      const notes =
        typeof params.notes === "string" ? params.notes.trim() : "";

      if (!clientName) {
        return { success: false, message: "client_name is required." };
      }

      if (!destination) {
        return { success: false, message: "destination is required." };
      }

      if (!startDate || !endDate) {
        return {
          success: false,
          message: "start_date and end_date must be valid dates.",
        };
      }

      if (startDate > endDate) {
        return {
          success: false,
          message: "start_date must be before or equal to end_date.",
        };
      }

      const clientResolution = await resolveClientByName(ctx, clientName);
      if ("error" in clientResolution) {
        return { success: false, message: clientResolution.error };
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const durationDays = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1,
      );

      const { data: itineraryRow, error: itineraryError } = await ctx.supabase
        .from("itineraries")
        .insert({
          user_id: clientResolution.clientId,
          trip_title: `${destination} Trip`,
          destination,
          summary: notes,
          duration_days: durationDays,
          raw_data: {
            destination,
            notes,
            travelers: numTravelers,
            created_via: "assistant",
            days: [],
          },
        })
        .select("id")
        .single();

      if (itineraryError || !itineraryRow?.id) {
        return {
          success: false,
          message: `Failed to create itinerary: ${itineraryError?.message ?? "unknown error"}`,
        };
      }

      const { data: tripRow, error: tripError } = await ctx.supabase
        .from("trips")
        .insert({
          client_id: clientResolution.clientId,
          organization_id: ctx.organizationId,
          start_date: startDate,
          end_date: endDate,
          status: "pending",
          itinerary_id: itineraryRow.id,
          pax_count: numTravelers,
        })
        .select("id")
        .single();

      if (tripError || !tripRow?.id) {
        return {
          success: false,
          message: `Failed to create trip: ${tripError?.message ?? "unknown error"}`,
        };
      }

      return {
        success: true,
        data: {
          tripId: tripRow.id,
          itineraryId: itineraryRow.id,
          clientId: clientResolution.clientId,
          clientName: clientResolution.fullName,
          destination,
          startDate,
          endDate,
          numTravelers,
        },
        message:
          `Trip created for "${clientResolution.fullName}" to ${destination} (${startDate} to ${endDate}).`,
        affectedEntities: [
          { type: "trip", id: tripRow.id },
          { type: "client", id: clientResolution.clientId },
        ],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error creating trip: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 2. update_trip_status
// ---------------------------------------------------------------------------

const updateTripStatus: ActionDefinition = {
  name: "update_trip_status",
  description:
    "Update the status of a trip (e.g., confirmed, in_progress, completed, cancelled)",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      trip_id: {
        type: "string",
        description: "The UUID of the trip to update",
      },
      status: {
        type: "string",
        description: "The new trip status",
        enum: ["planned", "confirmed", "in_progress", "completed", "cancelled"],
      },
    },
    required: ["trip_id", "status"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const tripId = typeof params.trip_id === "string" ? params.trip_id.trim() : "";
      const status = typeof params.status === "string" ? params.status.trim() : "";

      if (!tripId) {
        return { success: false, message: "trip_id is required." };
      }

      if (!status) {
        return { success: false, message: "status is required." };
      }

      const validStatuses = [
        "planned",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ] as const;

      if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
        return {
          success: false,
          message: `Invalid status "${status}". Must be one of: ${validStatuses.join(", ")}.`,
        };
      }

      // Verify the trip exists and belongs to this organisation
      const { data: existing, error: fetchError } = await ctx.supabase
        .from("trips")
        .select("id, status")
        .eq("id", tripId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (fetchError) {
        return {
          success: false,
          message: `Failed to verify trip: ${fetchError.message}`,
        };
      }

      if (!existing) {
        return {
          success: false,
          message: "Trip not found or access denied.",
        };
      }

      const oldStatus = existing.status ?? "unknown";

      // Update the trip status
      const { error: updateError } = await ctx.supabase
        .from("trips")
        .update({ status })
        .eq("id", tripId)
        .eq("organization_id", ctx.organizationId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to update trip status: ${updateError.message}`,
        };
      }

      return {
        success: true,
        data: { tripId, oldStatus, newStatus: status },
        message: `Trip status updated from "${oldStatus}" to "${status}".`,
        affectedEntities: [{ type: "trip", id: tripId }],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error updating trip status: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 3. assign_driver_to_trip
// ---------------------------------------------------------------------------

const assignDriverToTrip: ActionDefinition = {
  name: "assign_driver_to_trip",
  description: "Assign a driver to a trip",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      trip_id: {
        type: "string",
        description: "The UUID of the trip",
      },
      driver_id: {
        type: "string",
        description: "The UUID of the driver to assign",
      },
    },
    required: ["trip_id", "driver_id"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const tripId = typeof params.trip_id === "string" ? params.trip_id.trim() : "";
      const driverId = typeof params.driver_id === "string" ? params.driver_id.trim() : "";

      if (!tripId) {
        return { success: false, message: "trip_id is required." };
      }

      if (!driverId) {
        return { success: false, message: "driver_id is required." };
      }

      // Verify the trip belongs to this organisation
      const { data: trip, error: tripError } = await ctx.supabase
        .from("trips")
        .select("id, status, start_date, end_date")
        .eq("id", tripId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (tripError) {
        return {
          success: false,
          message: `Failed to verify trip: ${tripError.message}`,
        };
      }

      if (!trip) {
        return {
          success: false,
          message: "Trip not found or access denied.",
        };
      }

      // Verify the driver is a profile with role='driver' in the same organisation
      const { data: driver, error: driverError } = await ctx.supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", driverId)
        .eq("role", "driver")
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (driverError) {
        return {
          success: false,
          message: `Failed to verify driver: ${driverError.message}`,
        };
      }

      if (!driver) {
        return {
          success: false,
          message:
            "Driver not found. They may not exist, may not have the driver role, or may belong to a different organization.",
        };
      }

      // Update the trip with the driver assignment
      const { error: updateError } = await ctx.supabase
        .from("trips")
        .update({ driver_id: driverId })
        .eq("id", tripId)
        .eq("organization_id", ctx.organizationId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to assign driver: ${updateError.message}`,
        };
      }

      const driverName = driver.full_name ?? "Unnamed driver";
      const dates =
        trip.start_date && trip.end_date
          ? ` (${trip.start_date} to ${trip.end_date})`
          : "";

      return {
        success: true,
        data: {
          tripId,
          driverId,
          driverName,
          tripStatus: trip.status,
          startDate: trip.start_date,
          endDate: trip.end_date,
        },
        message: `Driver "${driverName}" has been assigned to trip${dates}.`,
        affectedEntities: [
          { type: "trip", id: tripId },
          { type: "driver", id: driverId },
        ],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error assigning driver to trip: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const tripWriteActions: readonly ActionDefinition[] = [
  createTrip,
  updateTripStatus,
  assignDriverToTrip,
];
