import { normalizeStatus, safeTitle, daysUntil } from "@/lib/admin/insights";

export type QueueAction = {
  id: string;
  type: "proposal" | "invoice" | "trip";
  priority: number;
  title: string;
  description: string;
  due_at: string | null;
  href: string;
  reason: string;
};

interface BuildQueueInput {
  proposals: Array<{ id: string; title: string | null; status: string | null; expires_at: string | null }>;
  invoices: Array<{ id: string; invoice_number: string; status: string; due_date: string | null; balance_amount: number | null }>;
  trips: Array<{ id: string; status: string | null; updated_at: string | null; start_date: string | null }>;
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

  return actions.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const aDue = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bDue = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aDue - bDue;
  });
}
