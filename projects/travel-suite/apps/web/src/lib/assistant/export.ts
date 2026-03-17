import "server-only";

/* ------------------------------------------------------------------
 * Data Export -- converts assistant query results to CSV format.
 *
 * Zero LLM cost. Pure data transformation from action results into
 * downloadable CSV strings. Handles common data types: trips,
 * invoices, clients, and generic tabular data.
 *
 * All functions are pure -- no I/O, no side effects, no mutations.
 * ------------------------------------------------------------------ */

// Types

export interface ExportColumn {
  readonly header: string;
  readonly key: string;
}

export interface ExportResult {
  readonly csv: string;
  readonly filename: string;
  readonly rowCount: number;
}

// CSV helpers

/** Escape a value for CSV (wrap in quotes if it contains commas, quotes, or newlines). */
function escapeCSV(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Convert an array of objects to a CSV string. */
function toCSV(
  columns: readonly ExportColumn[],
  rows: readonly Record<string, unknown>[],
): string {
  const header = columns.map((c) => escapeCSV(c.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((c) => escapeCSV(row[c.key])).join(","),
  );
  return [header, ...dataLines].join("\n");
}

// Export schemas for common data types

const TRIP_COLUMNS: readonly ExportColumn[] = [
  { header: "Trip ID", key: "id" },
  { header: "Client", key: "clientName" },
  { header: "Destination", key: "destination" },
  { header: "Start Date", key: "startDate" },
  { header: "End Date", key: "endDate" },
  { header: "Status", key: "status" },
  { header: "Driver", key: "driverName" },
];

const INVOICE_COLUMNS: readonly ExportColumn[] = [
  { header: "Invoice #", key: "invoiceNumber" },
  { header: "Client", key: "clientName" },
  { header: "Amount", key: "totalAmount" },
  { header: "Balance", key: "balanceAmount" },
  { header: "Currency", key: "currency" },
  { header: "Due Date", key: "dueDate" },
  { header: "Status", key: "status" },
];

const CLIENT_COLUMNS: readonly ExportColumn[] = [
  { header: "Name", key: "name" },
  { header: "Email", key: "email" },
  { header: "Phone", key: "phone" },
  { header: "Stage", key: "lifecycleStage" },
  { header: "Last Contacted", key: "lastContactedAt" },
];

const DRIVER_COLUMNS: readonly ExportColumn[] = [
  { header: "Name", key: "name" },
  { header: "Phone", key: "phone" },
  { header: "Status", key: "status" },
  { header: "License", key: "licenseNumber" },
];

const PROPOSAL_COLUMNS: readonly ExportColumn[] = [
  { header: "Proposal ID", key: "id" },
  { header: "Client", key: "clientName" },
  { header: "Title", key: "title" },
  { header: "Amount", key: "amount" },
  { header: "Status", key: "status" },
  { header: "Created", key: "createdAt" },
];

// Column mapping by action name

const COLUMN_MAP: Readonly<Record<string, readonly ExportColumn[]>> = {
  search_trips: TRIP_COLUMNS,
  get_trip_details: TRIP_COLUMNS,
  get_today_summary: TRIP_COLUMNS,
  get_overdue_invoices: INVOICE_COLUMNS,
  search_clients: CLIENT_COLUMNS,
  get_client_details: CLIENT_COLUMNS,
  search_drivers: DRIVER_COLUMNS,
  search_proposals: PROPOSAL_COLUMNS,
  generate_report: [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" },
  ],
};

// Main export function

/**
 * Generate a CSV export from assistant action result data.
 *
 * Returns null if the data cannot be exported (not an array or no matching schema).
 */
export function generateCSVExport(
  actionName: string | null,
  data: unknown,
): ExportResult | null {
  if (!data || !Array.isArray(data)) {
    // Try to extract array from nested data
    if (data && typeof data === "object" && !Array.isArray(data)) {
      // Look for array values in the data object
      const dataObj = data as Record<string, unknown>;
      for (const value of Object.values(dataObj)) {
        if (Array.isArray(value) && value.length > 0) {
          return generateCSVExport(actionName, value);
        }
      }
    }
    return null;
  }

  if (data.length === 0) {
    return null;
  }

  // Find matching columns or generate from data keys
  const columns = actionName ? (COLUMN_MAP[actionName] ?? null) : null;
  const effectiveColumns =
    columns ?? inferColumns(data[0] as Record<string, unknown>);

  const rows = data as readonly Record<string, unknown>[];
  const csv = toCSV(effectiveColumns, rows);

  const timestamp = new Date().toISOString().slice(0, 10);
  const prefix = actionName ? actionName.replace(/_/g, "-") : "export";
  const filename = `tripbuilt-${prefix}-${timestamp}.csv`;

  return {
    csv,
    filename,
    rowCount: rows.length,
  };
}

/** Infer columns from the first row's keys. */
function inferColumns(row: Record<string, unknown>): readonly ExportColumn[] {
  return Object.keys(row)
    .filter((key) => typeof row[key] !== "object" || row[key] === null)
    .map((key) => ({
      header: key
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]/g, " ")
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase()),
      key,
    }));
}
