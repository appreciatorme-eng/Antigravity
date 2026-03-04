import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { buildRevenueRiskActionQueue } from "@/lib/admin/action-queue";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;

  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const parsed = QuerySchema.safeParse({
    limit: new URL(req.url).searchParams.get("limit") || "10",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 });
  }

  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const todayISO = new Date().toISOString().slice(0, 10);

  const [proposalRes, invoiceRes, tripRes] = await Promise.all([
    admin.adminClient
      .from("proposals")
      .select("id,title,status,expires_at")
      .eq("organization_id", admin.organizationId)
      .in("status", ["draft", "sent", "viewed"])
      .not("expires_at", "is", null)
      .lte("expires_at", inThreeDays)
      .order("expires_at", { ascending: true })
      .limit(40),
    admin.adminClient
      .from("invoices")
      .select("id,invoice_number,status,due_date,balance_amount")
      .eq("organization_id", admin.organizationId)
      .in("status", ["issued", "partially_paid", "overdue"])
      .lt("due_date", todayISO)
      .order("due_date", { ascending: true })
      .limit(40),
    admin.adminClient
      .from("trips")
      .select("id,status,updated_at,start_date")
      .eq("organization_id", admin.organizationId)
      .in("status", ["planned", "confirmed", "in_progress"])
      .order("updated_at", { ascending: true })
      .limit(80),
  ]);

  if (proposalRes.error || invoiceRes.error || tripRes.error) {
    const err = proposalRes.error || invoiceRes.error || tripRes.error;
    return NextResponse.json({ error: err?.message || "Failed to build action queue" }, { status: 500 });
  }

  const queue = buildRevenueRiskActionQueue({
    proposals: proposalRes.data || [],
    invoices: invoiceRes.data || [],
    trips: tripRes.data || [],
  }).slice(0, parsed.data.limit);

  const summary = {
    expiring_proposals: queue.filter((q) => q.reason === "expiring_proposal").length,
    unpaid_invoices: queue.filter((q) => q.reason === "unpaid_invoice").length,
    stalled_trips: queue.filter((q) => q.reason === "stalled_trip").length,
  };

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    summary,
    queue,
  });
}
