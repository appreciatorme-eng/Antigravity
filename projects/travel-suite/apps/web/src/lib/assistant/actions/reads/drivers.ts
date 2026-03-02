/* ------------------------------------------------------------------
 * Driver read actions for the GoBuddy assistant.
 *
 * Drivers are profiles with `role = 'driver'`. Their vehicle and
 * licence metadata lives in the JSON `driver_info` column.
 *
 * Every query is scoped to the caller's organisation.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely extract a readable vehicle summary from the driver_info JSON. */
function formatDriverInfo(driverInfo: unknown): string {
  if (driverInfo === null || driverInfo === undefined) {
    return "No vehicle info on file";
  }

  if (typeof driverInfo !== "object") {
    return "No vehicle info on file";
  }

  const info = driverInfo as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof info.vehicle_make === "string") {
    parts.push(info.vehicle_make);
  }
  if (typeof info.vehicle_model === "string") {
    parts.push(info.vehicle_model);
  }
  if (typeof info.vehicle_year === "string" || typeof info.vehicle_year === "number") {
    parts.push(`(${String(info.vehicle_year)})`);
  }
  if (typeof info.license_plate === "string") {
    parts.push(`- plate ${info.license_plate}`);
  }

  return parts.length > 0 ? parts.join(" ") : "No vehicle info on file";
}

// ---------------------------------------------------------------------------
// search_drivers
// ---------------------------------------------------------------------------

const searchDrivers: ActionDefinition = {
  name: "search_drivers",
  description: "Search for drivers by name or check driver list",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Driver name to search for",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default 10)",
      },
    },
  },

  async execute(
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    try {
      const query = typeof params.query === "string" ? params.query : undefined;
      const limit =
        typeof params.limit === "number" && params.limit > 0
          ? params.limit
          : 10;

      let request = ctx.supabase
        .from("profiles")
        .select("id, full_name, phone, phone_whatsapp, email, driver_info")
        .eq("role", "driver")
        .eq("organization_id", ctx.organizationId)
        .limit(limit);

      if (query !== undefined) {
        request = request.ilike("full_name", `%${query}%`);
      }

      const { data, error } = await request;

      if (error) {
        return {
          success: false,
          message: `Failed to search drivers: ${error.message}`,
        };
      }

      if (!data || data.length === 0) {
        const qualifier = query !== undefined ? ` matching "${query}"` : "";
        return {
          success: true,
          data: [],
          message: `No drivers found${qualifier}.`,
        };
      }

      const drivers = data.map((row) => ({
        id: row.id,
        name: row.full_name ?? "Unnamed driver",
        phone: row.phone ?? "N/A",
        phoneWhatsapp: row.phone_whatsapp ?? "N/A",
        email: row.email ?? "N/A",
        vehicle: formatDriverInfo(row.driver_info),
      }));

      const lines = drivers.map(
        (d) =>
          `- ${d.name} | Phone: ${d.phone} | WhatsApp: ${d.phoneWhatsapp} | Vehicle: ${d.vehicle}`,
      );

      return {
        success: true,
        data: drivers,
        message: `Found ${drivers.length} driver(s):\n${lines.join("\n")}`,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error searching drivers";
      return { success: false, message: `Error searching drivers: ${message}` };
    }
  },
};

// ---------------------------------------------------------------------------
// get_driver_availability
// ---------------------------------------------------------------------------

const getDriverAvailability: ActionDefinition = {
  name: "get_driver_availability",
  description:
    "Check which drivers are available (not assigned to trips) for a given date range",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      date_from: {
        type: "string",
        description: "Start date in ISO format (YYYY-MM-DD)",
      },
      date_to: {
        type: "string",
        description: "End date in ISO format (YYYY-MM-DD)",
      },
    },
    required: ["date_from", "date_to"],
  },

  async execute(
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    try {
      const dateFrom =
        typeof params.date_from === "string" ? params.date_from : undefined;
      const dateTo =
        typeof params.date_to === "string" ? params.date_to : undefined;

      if (dateFrom === undefined || dateTo === undefined) {
        return {
          success: false,
          message:
            "Both date_from and date_to are required (ISO format, e.g. 2026-03-15).",
        };
      }

      // 1. Fetch all drivers for this organisation
      const { data: allDrivers, error: driversError } = await ctx.supabase
        .from("profiles")
        .select("id, full_name, phone, driver_info")
        .eq("role", "driver")
        .eq("organization_id", ctx.organizationId);

      if (driversError) {
        return {
          success: false,
          message: `Failed to fetch drivers: ${driversError.message}`,
        };
      }

      if (!allDrivers || allDrivers.length === 0) {
        return {
          success: true,
          data: { available: [], busy: [] },
          message: "No drivers are registered for this organisation.",
        };
      }

      // 2. Find trips overlapping the requested date range that have a driver
      //    Overlap condition: trip.start_date <= date_to AND trip.end_date >= date_from
      const { data: overlappingTrips, error: tripsError } = await ctx.supabase
        .from("trips")
        .select("id, driver_id, start_date, end_date")
        .eq("organization_id", ctx.organizationId)
        .not("driver_id", "is", null)
        .lte("start_date", dateTo)
        .gte("end_date", dateFrom);

      if (tripsError) {
        return {
          success: false,
          message: `Failed to check trip assignments: ${tripsError.message}`,
        };
      }

      // 3. Build a set of busy driver IDs
      const busyDriverIds = new Set<string>(
        (overlappingTrips ?? [])
          .map((t) => t.driver_id)
          .filter((id): id is string => id !== null),
      );

      // 4. Partition drivers into available vs busy
      const available: Array<{
        readonly id: string;
        readonly name: string;
        readonly vehicle: string;
      }> = [];
      const busy: Array<{
        readonly id: string;
        readonly name: string;
        readonly vehicle: string;
      }> = [];

      for (const driver of allDrivers) {
        const entry = {
          id: driver.id,
          name: driver.full_name ?? "Unnamed driver",
          vehicle: formatDriverInfo(driver.driver_info),
        };

        if (busyDriverIds.has(driver.id)) {
          busy.push(entry);
        } else {
          available.push(entry);
        }
      }

      const availableLines = available.map(
        (d) => `  - ${d.name} | Vehicle: ${d.vehicle}`,
      );
      const busyLines = busy.map(
        (d) => `  - ${d.name} | Vehicle: ${d.vehicle}`,
      );

      const messageParts = [
        `Driver availability from ${dateFrom} to ${dateTo}:`,
        `\nAvailable (${available.length}):`,
        available.length > 0 ? availableLines.join("\n") : "  None",
        `\nBusy (${busy.length}):`,
        busy.length > 0 ? busyLines.join("\n") : "  None",
      ];

      return {
        success: true,
        data: { available, busy },
        message: messageParts.join("\n"),
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unknown error checking driver availability";
      return {
        success: false,
        message: `Error checking driver availability: ${message}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export const driverActions: readonly ActionDefinition[] = [
  searchDrivers,
  getDriverAvailability,
];
