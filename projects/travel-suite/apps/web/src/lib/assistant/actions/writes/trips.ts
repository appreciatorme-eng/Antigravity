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
// 1. update_trip_status
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
// 2. assign_driver_to_trip
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
  updateTripStatus,
  assignDriverToTrip,
];
