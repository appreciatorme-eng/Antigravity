/* ------------------------------------------------------------------
 * Dynamic system-prompt builder for the GoBuddy operations assistant.
 *
 * Pure functions only -- no side effects, no mutations.
 * ------------------------------------------------------------------ */

import type { ContextSnapshot } from "../types";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Format a numeric amount with a currency prefix. */
export function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

/** Format an ISO date string into a short human-readable form, e.g. "Mar 2, 2026". */
export function formatDate(isoDate: string | null): string {
  if (isoDate === null) {
    return "N/A";
  }

  const date = new Date(isoDate);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Context block
// ---------------------------------------------------------------------------

/** Build a human-readable text block from a business context snapshot. */
export function buildContextBlock(snapshot: ContextSnapshot): string {
  const sections: string[] = [];

  // -- Header --
  sections.push(
    `## Today's Business Snapshot (as of ${snapshot.generatedAt})`,
  );

  // -- Trips --
  const tripCount = snapshot.todayTrips.length;
  sections.push(`\n### Active Trips Today: ${tripCount}`);

  if (tripCount > 0) {
    const tripLines = snapshot.todayTrips.map(
      (t) =>
        `- ${t.clientName ?? "Unknown client"} (${t.status ?? "unknown"}, ${formatDate(t.startDate)} to ${formatDate(t.endDate)})`,
    );
    sections.push(tripLines.join("\n"));
  } else {
    sections.push("No trips scheduled for today.");
  }

  // -- Invoices --
  const invoiceCount = snapshot.pendingInvoices.length;
  sections.push(`\n### Pending Invoices: ${invoiceCount}`);

  if (invoiceCount > 0) {
    const invoiceLines = snapshot.pendingInvoices.map((inv) => {
      const due = inv.dueDate !== null ? ` due ${formatDate(inv.dueDate)}` : "";
      return `- #${inv.invoiceNumber} -- ${inv.clientName ?? "Unknown"}: ${formatCurrency(inv.balanceAmount, inv.currency)} of ${formatCurrency(inv.totalAmount, inv.currency)} (${inv.status}${due})`;
    });
    sections.push(invoiceLines.join("\n"));
  } else {
    sections.push("All invoices are settled.");
  }

  // -- Clients --
  const clientCount = snapshot.recentClients.length;
  sections.push(`\n### Recent Active Clients: ${clientCount}`);

  if (clientCount > 0) {
    const clientLines = snapshot.recentClients.map(
      (c) => `- ${c.name ?? "Unknown"} (${c.lifecycleStage ?? "unknown"})`,
    );
    sections.push(clientLines.join("\n"));
  }

  // -- Failed notifications --
  const failedCount = snapshot.failedNotifications.length;
  sections.push(`\n### Failed Notifications: ${failedCount}`);

  if (failedCount > 0) {
    const notifLines = snapshot.failedNotifications.map(
      (n) =>
        `- ${n.recipientName ?? "Unknown recipient"} via ${n.channel ?? "unknown channel"}: ${n.errorMessage ?? "unknown error"}`,
    );
    sections.push(notifLines.join("\n"));
  } else {
    sections.push("All notifications delivered successfully.");
  }

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// Full system prompt
// ---------------------------------------------------------------------------

/** Assemble the complete system prompt for the assistant. */
export function buildSystemPrompt(
  orgName: string,
  snapshot: ContextSnapshot | null,
): string {
  const today = formatDate(new Date().toISOString());
  const contextBlock =
    snapshot !== null ? `\n${buildContextBlock(snapshot)}\n` : "";

  return `You are GoBuddy, a business operations assistant for ${orgName}. Today is ${today}.

## Your Role
You help tour operators run their daily business quickly and confidently.
You have direct access to the business database and can look up real-time information.

## Rules
- Use the provided functions to fetch real data from the database. NEVER make up numbers or information.
- Keep answers short, clear, and practical -- 1 to 3 sentences for simple queries.
- For detailed data (lists of trips, invoices), present them in a clean, scannable format.
- When referencing specific records, include identifying info (invoice number, client name, trip dates).
- If a user asks to update/change something, use the appropriate function to do so.
- For updates and deletions, always describe what will change and ask for confirmation before acting.
- Never expose another operator's data.
- If you don't have a function for what the user is asking, say so and suggest what they can do in the app.
${contextBlock}
## Capabilities
You can query and report on: trips, clients, invoices, proposals, drivers, and notifications.
Use the provided functions to fetch real data. Answer from the function results, not from assumptions.`;
}
