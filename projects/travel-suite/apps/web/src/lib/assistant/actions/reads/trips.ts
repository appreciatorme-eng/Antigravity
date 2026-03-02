/* ------------------------------------------------------------------
 * Read actions for trip queries.
 *
 * Every query is scoped to `organization_id` from the ActionContext.
 * All handlers are wrapped in try/catch and return ActionResult.
 * Immutable patterns used throughout -- no mutation of input data.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clamp a numeric value between min and max (inclusive). */
const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Format an optional date string for human-readable output. */
const formatDate = (date: string | null): string =>
  date ?? "not set";

/** Build a human-readable trip summary line. */
const formatTripLine = (trip: {
  readonly id: string;
  readonly status: string | null;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly clientName: string | null;
}): string => {
  const client = trip.clientName ?? "Unknown client";
  const status = trip.status ?? "no status";
  const dates = `${formatDate(trip.start_date)} to ${formatDate(trip.end_date)}`;
  return `- ${client} | ${status} | ${dates} (ID: ${trip.id})`;
};

// ---------------------------------------------------------------------------
// 1. search_trips
// ---------------------------------------------------------------------------

const searchTrips: ActionDefinition = {
  name: "search_trips",
  description:
    "Search trips by client name, status, or date range",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Text to search in client names or trip notes",
      },
      status: {
        type: "string",
        enum: ["planned", "confirmed", "in_progress", "completed", "cancelled"],
        description: "Filter by trip status",
      },
      date_from: {
        type: "string",
        description: "ISO date -- trips starting from this date",
      },
      date_to: {
        type: "string",
        description: "ISO date -- trips ending before this date",
      },
      limit: {
        type: "number",
        description: "Max results (default 10, max 20)",
      },
    },
    required: [],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const query = typeof params.query === "string" ? params.query.trim() : "";
      const status = typeof params.status === "string" ? params.status : null;
      const dateFrom = typeof params.date_from === "string" ? params.date_from : null;
      const dateTo = typeof params.date_to === "string" ? params.date_to : null;
      const limit = clamp(
        typeof params.limit === "number" ? params.limit : 10,
        1,
        20,
      );

      // If a text query is provided, first find matching client profile IDs
      // (Supabase does not support ilike on joined columns in PostgREST).
      let clientIds: readonly string[] | null = null;

      if (query) {
        const { data: matchingProfiles, error: profileError } = await ctx.supabase
          .from("profiles")
          .select("id")
          .ilike("full_name", `%${query}%`)
          .limit(50);

        if (profileError) {
          return {
            success: false,
            message: `Failed to search client profiles: ${profileError.message}`,
          };
        }

        clientIds = (matchingProfiles ?? []).map((p) => p.id);

        // If query was provided but no profiles match, return empty
        if (clientIds.length === 0) {
          return {
            success: true,
            data: [],
            message: `No trips found matching "${query}".`,
          };
        }
      }

      // Build the trips query
      let tripsQuery = ctx.supabase
        .from("trips")
        .select(
          "id, status, start_date, end_date, notes, created_at, profiles!trips_client_id_fkey(full_name, email, phone)",
        )
        .eq("organization_id", ctx.organizationId);

      if (status) {
        tripsQuery = tripsQuery.eq("status", status);
      }

      if (dateFrom) {
        tripsQuery = tripsQuery.gte("start_date", dateFrom);
      }

      if (dateTo) {
        tripsQuery = tripsQuery.lte("end_date", dateTo);
      }

      if (clientIds) {
        tripsQuery = tripsQuery.in("client_id", [...clientIds]);
      }

      tripsQuery = tripsQuery
        .order("start_date", { ascending: false })
        .limit(limit);

      const { data, error } = await tripsQuery;

      if (error) {
        return {
          success: false,
          message: `Failed to search trips: ${error.message}`,
        };
      }

      const trips = (data ?? []).map((row) => {
        const profiles = row.profiles as
          | { full_name: string | null; email: string | null; phone: string | null }
          | null;

        return {
          id: row.id,
          status: row.status,
          start_date: row.start_date,
          end_date: row.end_date,
          notes: row.notes,
          created_at: row.created_at,
          clientName: profiles?.full_name ?? null,
          clientEmail: profiles?.email ?? null,
          clientPhone: profiles?.phone ?? null,
        };
      });

      if (trips.length === 0) {
        return {
          success: true,
          data: [],
          message: "No trips found matching the given criteria.",
        };
      }

      const lines = trips.map(formatTripLine);
      const message = `Found ${trips.length} trip(s):\n${lines.join("\n")}`;

      return { success: true, data: trips, message };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error searching trips: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 2. get_trip_details
// ---------------------------------------------------------------------------

const getTripDetails: ActionDefinition = {
  name: "get_trip_details",
  description:
    "Get full details of a specific trip including client info, driver, and itinerary",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      trip_id: {
        type: "string",
        description: "The trip UUID",
      },
    },
    required: ["trip_id"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const tripId = typeof params.trip_id === "string" ? params.trip_id : "";

      if (!tripId) {
        return { success: false, message: "trip_id is required." };
      }

      const { data, error } = await ctx.supabase
        .from("trips")
        .select(
          `id, status, start_date, end_date, notes, created_at, updated_at,
           profiles!trips_client_id_fkey(full_name, email, phone),
           driver:profiles!trips_driver_id_fkey(full_name, phone, driver_info),
           itineraries!trips_itinerary_id_fkey(trip_title, destination, duration_days, summary)`,
        )
        .eq("id", tripId)
        .maybeSingle();

      if (error) {
        return {
          success: false,
          message: `Failed to fetch trip details: ${error.message}`,
        };
      }

      if (!data) {
        return {
          success: false,
          message: `Trip with ID "${tripId}" not found.`,
        };
      }

      // Security: verify the trip belongs to the caller's organisation
      // We need to re-query with organization_id filter to enforce this
      const { data: orgCheck, error: orgError } = await ctx.supabase
        .from("trips")
        .select("id")
        .eq("id", tripId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (orgError || !orgCheck) {
        return {
          success: false,
          message: "Trip not found or access denied.",
        };
      }

      const client = data.profiles as
        | { full_name: string | null; email: string | null; phone: string | null }
        | null;

      const driver = data.driver as
        | { full_name: string | null; phone: string | null; driver_info: unknown }
        | null;

      const itinerary = data.itineraries as
        | {
            trip_title: string;
            destination: string;
            duration_days: number | null;
            summary: string | null;
          }
        | null;

      const details = {
        id: data.id,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        client: client
          ? {
              name: client.full_name,
              email: client.email,
              phone: client.phone,
            }
          : null,
        driver: driver
          ? {
              name: driver.full_name,
              phone: driver.phone,
              driverInfo: driver.driver_info,
            }
          : null,
        itinerary: itinerary
          ? {
              title: itinerary.trip_title,
              destination: itinerary.destination,
              durationDays: itinerary.duration_days,
              summary: itinerary.summary,
            }
          : null,
      };

      const clientLine = client?.full_name
        ? `Client: ${client.full_name} (${client.email ?? "no email"}, ${client.phone ?? "no phone"})`
        : "Client: not assigned";

      const driverLine = driver?.full_name
        ? `Driver: ${driver.full_name} (${driver.phone ?? "no phone"})`
        : "Driver: not assigned";

      const itineraryLine = itinerary
        ? `Itinerary: "${itinerary.trip_title}" -- ${itinerary.destination}, ${itinerary.duration_days ?? "?"} days`
        : "Itinerary: none";

      const summaryLine = itinerary?.summary
        ? `Summary: ${itinerary.summary}`
        : "";

      const message = [
        `Trip ${data.id}`,
        `Status: ${data.status ?? "not set"}`,
        `Dates: ${formatDate(data.start_date)} to ${formatDate(data.end_date)}`,
        clientLine,
        driverLine,
        itineraryLine,
        summaryLine,
        data.notes ? `Notes: ${data.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      return { success: true, data: details, message };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error fetching trip details: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 3. get_trip_itinerary
// ---------------------------------------------------------------------------

const getTripItinerary: ActionDefinition = {
  name: "get_trip_itinerary",
  description: "Get the itinerary details for a specific trip",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      trip_id: {
        type: "string",
        description: "The trip UUID",
      },
    },
    required: ["trip_id"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const tripId = typeof params.trip_id === "string" ? params.trip_id : "";

      if (!tripId) {
        return { success: false, message: "trip_id is required." };
      }

      // First verify the trip belongs to the organisation and get itinerary_id
      const { data: trip, error: tripError } = await ctx.supabase
        .from("trips")
        .select("id, itinerary_id")
        .eq("id", tripId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (tripError) {
        return {
          success: false,
          message: `Failed to fetch trip: ${tripError.message}`,
        };
      }

      if (!trip) {
        return {
          success: false,
          message: "Trip not found or access denied.",
        };
      }

      if (!trip.itinerary_id) {
        return {
          success: true,
          data: null,
          message: "This trip does not have an itinerary attached.",
        };
      }

      const { data: itinerary, error: itinError } = await ctx.supabase
        .from("itineraries")
        .select(
          "id, trip_title, destination, duration_days, summary, budget, interests, raw_data",
        )
        .eq("id", trip.itinerary_id)
        .maybeSingle();

      if (itinError) {
        return {
          success: false,
          message: `Failed to fetch itinerary: ${itinError.message}`,
        };
      }

      if (!itinerary) {
        return {
          success: true,
          data: null,
          message: "The linked itinerary could not be found.",
        };
      }

      const details = {
        id: itinerary.id,
        title: itinerary.trip_title,
        destination: itinerary.destination,
        durationDays: itinerary.duration_days,
        summary: itinerary.summary,
        budget: itinerary.budget,
        interests: itinerary.interests,
        rawData: itinerary.raw_data,
      };

      // Format the itinerary as a readable plan
      const header = [
        `Itinerary: "${itinerary.trip_title}"`,
        `Destination: ${itinerary.destination}`,
        `Duration: ${itinerary.duration_days ?? "unknown"} days`,
        itinerary.budget ? `Budget: ${itinerary.budget}` : "",
        itinerary.interests && itinerary.interests.length > 0
          ? `Interests: ${itinerary.interests.join(", ")}`
          : "",
        itinerary.summary ? `\nSummary: ${itinerary.summary}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      // Attempt to format raw_data as day-by-day items if it is an array
      let dayByDay = "";
      const rawData = itinerary.raw_data;

      if (Array.isArray(rawData) && rawData.length > 0) {
        const dayLines = rawData.map((day, index) => {
          if (typeof day === "object" && day !== null) {
            const dayObj = day as Record<string, unknown>;
            const dayLabel =
              typeof dayObj.day === "string" || typeof dayObj.day === "number"
                ? `Day ${dayObj.day}`
                : `Day ${index + 1}`;
            const title =
              typeof dayObj.title === "string" ? ` -- ${dayObj.title}` : "";
            const description =
              typeof dayObj.description === "string"
                ? `\n  ${dayObj.description}`
                : "";
            return `${dayLabel}${title}${description}`;
          }
          return `Day ${index + 1}: ${String(day)}`;
        });
        dayByDay = `\n\nDay-by-day plan:\n${dayLines.join("\n")}`;
      }

      const message = `${header}${dayByDay}`;

      return { success: true, data: details, message };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error fetching trip itinerary: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const tripActions: readonly ActionDefinition[] = [
  searchTrips,
  getTripDetails,
  getTripItinerary,
];
