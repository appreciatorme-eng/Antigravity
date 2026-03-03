/* ------------------------------------------------------------------
 * Contextual follow-up action suggestions.
 *
 * After the assistant executes an action, this module provides a set
 * of relevant follow-up actions the UI can surface as quick-reply
 * buttons.  The mapping is static and pure -- no I/O, no side effects.
 * ------------------------------------------------------------------ */

import "server-only";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A suggested follow-up action shown to the user. */
export interface SuggestedAction {
  readonly label: string;
  readonly prefilledMessage: string;
}

// ---------------------------------------------------------------------------
// Follow-up mapping
// ---------------------------------------------------------------------------

/**
 * Map of action names to contextual follow-up suggestions.
 *
 * Each entry provides 2 quick-reply options that make sense as a
 * natural next step after the given action completes.
 */
const FOLLOW_UP_MAP: Readonly<Record<string, readonly SuggestedAction[]>> = {
  get_today_summary: [
    { label: "Overdue invoices", prefilledMessage: "Show me overdue invoices" },
    { label: "Trips without drivers", prefilledMessage: "Any trips without drivers assigned?" },
  ],
  get_overdue_invoices: [
    { label: "Send reminders", prefilledMessage: "Send payment reminders to overdue clients" },
    { label: "Invoice details", prefilledMessage: "Show details for the most overdue invoice" },
  ],
  get_pending_items: [
    { label: "Today's summary", prefilledMessage: "What's happening today?" },
    { label: "Follow-up clients", prefilledMessage: "Which clients need follow-ups?" },
  ],
  search_trips: [
    { label: "Assign driver", prefilledMessage: "Assign a driver to this trip" },
    { label: "Trip itinerary", prefilledMessage: "Show the itinerary for this trip" },
  ],
  get_trip_details: [
    { label: "Update status", prefilledMessage: "Update this trip's status" },
    { label: "Send client update", prefilledMessage: "Send an update to the client about this trip" },
  ],
  search_clients: [
    { label: "Client details", prefilledMessage: "Show me more details about this client" },
    { label: "Add a note", prefilledMessage: "Add a note for this client" },
  ],
  get_client_details: [
    { label: "Add note", prefilledMessage: "Add a note for this client" },
    { label: "Schedule follow-up", prefilledMessage: "Schedule a follow-up for this client" },
  ],
  update_client_stage: [
    { label: "Add note", prefilledMessage: "Add a note about this stage change" },
    { label: "Send WhatsApp", prefilledMessage: "Send a WhatsApp message to this client" },
  ],
  get_kpi_snapshot: [
    { label: "Revenue report", prefilledMessage: "Generate a revenue report for this month" },
    { label: "Overdue invoices", prefilledMessage: "Show me overdue invoices" },
  ],
  mark_invoice_paid: [
    { label: "Send receipt", prefilledMessage: "Send a payment confirmation to the client" },
    { label: "Other invoices", prefilledMessage: "Show me other pending invoices" },
  ],
  generate_report: [
    { label: "Weekly report", prefilledMessage: "Generate a weekly report" },
    { label: "Client report", prefilledMessage: "Generate a client activity report for this month" },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get suggested follow-up actions based on the last action executed.
 *
 * Returns an empty array when there are no suggestions for the given
 * action name (or when `lastActionName` is null).
 */
export function getSuggestedActions(
  lastActionName: string | null,
): readonly SuggestedAction[] {
  if (lastActionName === null) {
    return [];
  }

  return FOLLOW_UP_MAP[lastActionName] ?? [];
}
