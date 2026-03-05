import { normalizeStatus, safeTitle, daysUntil } from "@/lib/admin/insights";

export type QueueAction = {
  id: string;
  type: "proposal" | "invoice" | "trip" | "lead";
  priority: number;
  title: string;
  description: string;
  due_at: string | null;
  href: string;
  reason: string;
  expected_revenue?: number | null;
};

interface LeadInput {
  id: string;
  full_name: string;
  stage: string;
  expected_value: number | null;
  last_activity_at: string | null;
  destination: string | null;
}

interface BuildQueueInput {
  proposals: Array<{ id: string; title: string | null; status: string | null; expires_at: string | null }>;
  invoices: Array<{ id: string; invoice_number: string; status: string; due_date: string | null; balance_amount: number | null }>;
  trips: Array<{ id: string; status: string | null; updated_at: string | null; start_date: string | null }>;
  leads?: LeadInput[];
}

function daysSince(isoDate: string | null): number | null {
  if (!isoDate) return null;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000));
}

export function buildRevenueRiskActionQueue(input: BuildQueueInput): QueueAction[] {
  const actions: QueueAction[] = [];

  for (const proposal of input.proposals) {
    const expiresIn = daysUntil(proposal.expires_at);
    const priority = expiresIn !== null && expiresIn <= 1 ? 95 : expiresIn !== null && expiresIn <= 2 ? 88 : 82;

    actions.push({
      id: `proposal:${proposal.id}`,
      type: "proposal",
      priority,
      title: `Proposal expiring: ${safeTitle(proposal.title, "Untitled Proposal")}`,
      description: "Follow up with revised pricing/options before expiry.",
      due_at: proposal.expires_at,
      href: `/proposals/${proposal.id}`,
      reason: "expiring_proposal",
    });
  }

  for (const invoice of input.invoices) {
    actions.push({
      id: `invoice:${invoice.id}`,
      type: "invoice",
      priority: 92,
      title: `Unpaid invoice ${safeTitle(invoice.invoice_number, "INV")}`,
      description: "Send reminder and payment link to recover at-risk cash flow.",
      due_at: invoice.due_date,
      href: "/admin/revenue",
      reason: "unpaid_invoice",
    });
  }

  const staleCutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
  for (const trip of input.trips) {
    const updatedTs = trip.updated_at ? new Date(trip.updated_at).getTime() : 0;
    if (updatedTs > staleCutoff) continue;
    const status = normalizeStatus(trip.status);
    if (!["planned", "in_progress", "confirmed"].includes(status)) continue;

    actions.push({
      id: `trip:${trip.id}`,
      type: "trip",
      priority: 84,
      title: "Stalled trip workflow detected",
      description: "Trip has no recent progress; trigger operator check-in.",
      due_at: trip.start_date,
      href: `/trips/${trip.id}`,
      reason: "stalled_trip",
    });
  }

  for (const lead of input.leads ?? []) {
    const elapsed = daysSince(lead.last_activity_at);
    const stage = normalizeStatus(lead.stage);
    const name = safeTitle(lead.full_name, "Unknown Lead");
    const dest = lead.destination ? ` (${lead.destination})` : "";
    const value = lead.expected_value;

    if (stage === "new" && value !== null && value >= 50000 && (elapsed === null || elapsed >= 1)) {
      actions.push({
        id: `lead:${lead.id}:high-value`,
        type: "lead",
        priority: 92,
        title: `High-value lead: ${name}${dest}`,
        description: "High-value enquiry not yet contacted. Act now before they book elsewhere.",
        due_at: null,
        href: `/admin/crm/${lead.id}`,
        reason: "cold_high_value_lead",
        expected_revenue: value,
      });
      continue;
    }

    if (["new", "contacted"].includes(stage) && elapsed !== null && elapsed >= 3) {
      actions.push({
        id: `lead:${lead.id}:cold`,
        type: "lead",
        priority: 85,
        title: `Cold lead: ${name}${dest}`,
        description: `No activity for ${elapsed} days. Follow up before this enquiry goes cold.`,
        due_at: null,
        href: `/admin/crm/${lead.id}`,
        reason: "cold_lead",
        expected_revenue: value,
      });
      continue;
    }

    if (stage === "qualified" && elapsed !== null && elapsed >= 2) {
      actions.push({
        id: `lead:${lead.id}:proposal-due`,
        type: "lead",
        priority: 88,
        title: `Send proposal: ${name}${dest}`,
        description: `Qualified ${elapsed} days ago with no proposal sent. Strike while interest is hot.`,
        due_at: null,
        href: `/admin/crm/${lead.id}`,
        reason: "proposal_overdue_lead",
        expected_revenue: value,
      });
      continue;
    }

    if (stage === "negotiating" && elapsed !== null && elapsed >= 7) {
      actions.push({
        id: `lead:${lead.id}:stuck-negotiation`,
        type: "lead",
        priority: 87,
        title: `Stuck negotiation: ${name}${dest}`,
        description: `Deal in negotiation for ${elapsed} days. Check in to unblock or close.`,
        due_at: null,
        href: `/admin/crm/${lead.id}`,
        reason: "stuck_negotiation",
        expected_revenue: value,
      });
      continue;
    }
  }

  return actions.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const aDue = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bDue = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aDue - bDue;
  });
}
