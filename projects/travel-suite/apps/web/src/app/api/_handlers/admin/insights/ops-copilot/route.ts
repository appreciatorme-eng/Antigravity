import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { daysUntil, normalizeStatus, safeTitle } from "@/lib/admin/insights";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

type CopilotAction = {
  id: string;
  type: "proposal" | "invoice" | "notification" | "trip" | "lead";
  priority: number;
  title: string;
  description: string;
  due_at: string | null;
  href: string;
  context: Record<string, unknown>;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;

  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    limit: searchParams.get("limit") || "12",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { limit } = parsed.data;
  const today = todayIsoDate();
  const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const [proposalRes, invoiceRes, notificationRes, tripRes, clientRes] = await Promise.all([
    admin.adminClient
      .from("proposals")
      .select("id,title,status,expires_at,updated_at")
      .eq("organization_id", admin.organizationId)
      .in("status", ["draft", "sent", "viewed"])
      .not("expires_at", "is", null)
      .lte("expires_at", inThreeDays)
      .order("expires_at", { ascending: true })
      .limit(25),
    admin.adminClient
      .from("invoices")
      .select("id,invoice_number,status,due_date,balance_amount,total_amount")
      .eq("organization_id", admin.organizationId)
      .in("status", ["issued", "partially_paid", "overdue"])
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(25),
    admin.adminClient
      .from("notification_delivery_status")
      .select("id,status,notification_type,created_at,trip_id,user_id")
      .eq("organization_id", admin.organizationId)
      .in("status", ["failed", "retrying"])
      .order("created_at", { ascending: false })
      .limit(30),
    admin.adminClient
      .from("trips")
      .select("id,start_date,status,driver_id")
      .eq("organization_id", admin.organizationId)
      .in("status", ["pending", "confirmed"])
      .is("driver_id", null)
      .gte("start_date", today)
      .lte("start_date", inTwoDays)
      .order("start_date", { ascending: true })
      .limit(20),
    admin.adminClient
      .from("profiles")
      .select("id,full_name,lead_status,last_contacted_at,created_at")
      .eq("organization_id", admin.organizationId)
      .eq("role", "client")
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  if (proposalRes.error || invoiceRes.error || notificationRes.error || tripRes.error || clientRes.error) {
    const err =
      proposalRes.error ||
      invoiceRes.error ||
      notificationRes.error ||
      tripRes.error ||
      clientRes.error;
    return NextResponse.json({ error: err?.message || "Failed to build ops copilot queue" }, { status: 500 });
  }

  const actions: CopilotAction[] = [];

  for (const proposal of proposalRes.data || []) {
    const expiresIn = daysUntil(proposal.expires_at);
    const priority = expiresIn !== null && expiresIn <= 1 ? 96 : expiresIn !== null && expiresIn <= 2 ? 88 : 80;
    actions.push({
      id: `proposal:${proposal.id}`,
      type: "proposal",
      priority,
      title: `Proposal at risk: ${safeTitle(proposal.title, "Untitled Proposal")}`,
      description: "Follow up now and offer one revision path before expiry.",
      due_at: proposal.expires_at,
      href: `/admin/proposals/${proposal.id}`,
      context: {
        status: normalizeStatus(proposal.status),
        expires_in_days: expiresIn !== null ? Number(expiresIn.toFixed(2)) : null,
      },
    });
  }

  for (const invoice of invoiceRes.data || []) {
    actions.push({
      id: `invoice:${invoice.id}`,
      type: "invoice",
      priority: 92,
      title: `Overdue invoice ${safeTitle(invoice.invoice_number, "INV")}`,
      description: "Send payment reminder with direct payment link and timeline.",
      due_at: invoice.due_date,
      href: "/admin/revenue",
      context: {
        status: normalizeStatus(invoice.status),
        balance_amount: invoice.balance_amount,
        total_amount: invoice.total_amount,
      },
    });
  }

  for (const row of notificationRes.data || []) {
    actions.push({
      id: `notification:${row.id}`,
      type: "notification",
      priority: 78,
      title: `Notification delivery ${normalizeStatus(row.status)} (${safeTitle(row.notification_type, "general")})`,
      description: "Retry failed notifications and verify recipient contact quality.",
      due_at: row.created_at,
      href: "/admin/notifications",
      context: {
        trip_id: row.trip_id,
        user_id: row.user_id,
      },
    });
  }

  for (const trip of tripRes.data || []) {
    actions.push({
      id: `trip:${trip.id}`,
      type: "trip",
      priority: 86,
      title: "Upcoming trip missing driver assignment",
      description: "Assign driver before departure to prevent same-day disruption.",
      due_at: trip.start_date,
      href: `/admin/trips/${trip.id}`,
      context: {
        status: normalizeStatus(trip.status),
        start_date: trip.start_date,
      },
    });
  }

  const staleLeadCutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
  for (const profile of clientRes.data || []) {
    const lastContactTs = profile.last_contacted_at ? new Date(profile.last_contacted_at).getTime() : 0;
    const createdTs = profile.created_at ? new Date(profile.created_at).getTime() : 0;
    const leadStatus = normalizeStatus(profile.lead_status, "new");
    if (!["new", "contacted", "qualified"].includes(leadStatus)) continue;

    if ((lastContactTs || createdTs) > 0 && (lastContactTs || createdTs) > staleLeadCutoff) {
      continue;
    }

    actions.push({
      id: `lead:${profile.id}`,
      type: "lead",
      priority: 70,
      title: `Stale lead: ${safeTitle(profile.full_name, "Client")}`,
      description: "Send tailored follow-up sequence and propose one itinerary option.",
      due_at: profile.last_contacted_at || profile.created_at || null,
      href: "/admin/clients",
      context: {
        lead_status: leadStatus,
        profile_id: profile.id,
      },
    });
  }

  const prioritized = actions
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const aTs = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      const bTs = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      return aTs - bTs;
    })
    .slice(0, limit);

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    queue_size: prioritized.length,
    queue: prioritized,
    playbook: [
      "Focus first on expiring proposals and overdue invoices.",
      "Batch notification retries after contact cleanup.",
      "Assign drivers for the next 48 hours before handling lower-priority tasks.",
    ],
  });
}

