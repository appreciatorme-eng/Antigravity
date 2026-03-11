import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { buildRevenueRiskActionQueue } from "@/lib/admin/action-queue";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(req: NextRequest) {
  try {
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

    const organizationId = admin.organizationId;
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const todayISO = new Date().toISOString().slice(0, 10);
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

    const [proposalRes, invoiceRes, tripRes, leadRes] = await Promise.all([
      admin.adminClient
        .from("proposals")
        .select("id,title,status,expires_at")
        .eq("organization_id", organizationId)
        .in("status", ["draft", "sent", "viewed"])
        .not("expires_at", "is", null)
        .lte("expires_at", inThreeDays)
        .order("expires_at", { ascending: true })
        .limit(40),
      admin.adminClient
        .from("invoices")
        .select("id,invoice_number,status,due_date,balance_amount")
        .eq("organization_id", organizationId)
        .in("status", ["issued", "partially_paid", "overdue"])
        .lt("due_date", todayISO)
        .order("due_date", { ascending: true })
        .limit(40),
      admin.adminClient
        .from("trips")
        .select("id,status,updated_at,start_date")
        .eq("organization_id", organizationId)
        .in("status", ["planned", "confirmed", "in_progress"])
        .order("updated_at", { ascending: true })
        .limit(80),
      admin.adminClient
        .from("crm_contacts")
        .select("id,full_name,stage,expected_value,last_activity_at,destination")
        .eq("organization_id", organizationId)
        .in("stage", ["new", "contacted", "qualified", "negotiating"])
        .or(`last_activity_at.is.null,last_activity_at.lt.${oneDayAgo}`)
        .order("last_activity_at", { ascending: true, nullsFirst: true })
        .limit(60),
    ]);

    if (proposalRes.error || invoiceRes.error || tripRes.error) {
      const err = proposalRes.error || invoiceRes.error || tripRes.error;
      return NextResponse.json({ error: "Failed to build action queue" }, { status: 500 });
    }

    const queue = buildRevenueRiskActionQueue({
      proposals: proposalRes.data || [],
      invoices: invoiceRes.data || [],
      trips: tripRes.data || [],
      leads: (leadRes.data || []) as Array<{
        id: string;
        full_name: string;
        stage: string;
        expected_value: number | null;
        last_activity_at: string | null;
        destination: string | null;
      }>,
    }).slice(0, parsed.data.limit);

    const summary = {
      expiring_proposals: queue.filter((q) => q.reason === "expiring_proposal").length,
      unpaid_invoices: queue.filter((q) => q.reason === "unpaid_invoice").length,
      stalled_trips: queue.filter((q) => q.reason === "stalled_trip").length,
      cold_leads: queue.filter((q) => q.type === "lead").length,
    };

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      summary,
      queue,
    });
  } catch (error) {
    console.error("[/api/admin/insights/action-queue:GET] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
