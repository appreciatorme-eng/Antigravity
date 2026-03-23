// Reusable CSV generation utility with proper escaping and Excel compatibility.

/** UTF-8 BOM for Excel to detect encoding automatically. */
const UTF8_BOM = "\uFEFF";

/**
 * Escape a single CSV field value.
 * Wraps in double-quotes when the value contains commas, quotes, or newlines.
 * Null/undefined values become empty strings.
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate a CSV string from headers and row data.
 *
 * @param headers - Column header names
 * @param rows    - Array of row arrays (each element maps to the corresponding header)
 * @returns       - Complete CSV string with UTF-8 BOM, header row, and data rows
 */
export function generateCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return UTF8_BOM + [headerLine, ...dataLines].join("\n") + "\n";
}

/**
 * Create a Response object for a CSV file download.
 */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
