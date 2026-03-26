import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { resolveAdminDateRange } from "@/lib/admin/date-range";
import { sessionNameFromOrgId } from "@/lib/whatsapp-evolution.server";
import { logError } from "@/lib/observability/logger";

const APPROVED_STATUSES = ["approved", "accepted", "confirmed", "converted"];

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const organizationId = resolveScopedOrgWithDemo(request, admin.organizationId);
    if (!organizationId) {
      return apiError("Organization not configured", 400);
    }

    const range = resolveAdminDateRange(request.nextUrl.searchParams);
    const db = admin.adminClient;
    const baseSessionName = sessionNameFromOrgId(organizationId);

    const [
      inquiriesResult,
      proposalsResult,
      approvedResult,
      linksResult,
      paidResult,
    ] = await Promise.all([
      db
        .from("whatsapp_webhook_events")
        .select("id", { count: "exact", head: true })
        .filter("metadata->>session", "like", `${baseSessionName}%`)
        .eq("event_type", "text")
        .filter("metadata->>direction", "eq", "in")
        .gte("received_at", range.fromISO)
        .lt("received_at", range.toExclusiveISO),
      db
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("created_at", range.fromISO)
        .lt("created_at", range.toExclusiveISO),
      db
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("status", APPROVED_STATUSES)
        .gte("updated_at", range.fromISO)
        .lt("updated_at", range.toExclusiveISO),
      db
        .from("payment_links")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("created_at", range.fromISO)
        .lt("created_at", range.toExclusiveISO),
      db
        .from("payment_links")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "paid")
        .gte("paid_at", range.fromISO)
        .lt("paid_at", range.toExclusiveISO),
    ]);

    if (inquiriesResult.error) throw inquiriesResult.error;
    if (proposalsResult.error) throw proposalsResult.error;
    if (approvedResult.error) throw approvedResult.error;
    if (linksResult.error) throw linksResult.error;
    if (paidResult.error) throw paidResult.error;

    const counts = [
      inquiriesResult.count ?? 0,
      proposalsResult.count ?? 0,
      approvedResult.count ?? 0,
      linksResult.count ?? 0,
      paidResult.count ?? 0,
    ];
    const labels = ["Inquiries", "Proposals", "Approved", "Links Sent", "Paid"];

    const stages = counts.map((count, index) => ({
      key: labels[index].toLowerCase().replace(/\s+/g, "_"),
      label: labels[index],
      count,
      conversionRate:
        index === 0 || counts[index - 1] === 0
          ? null
          : Number(((count / counts[index - 1]) * 100).toFixed(1)),
    }));

    return NextResponse.json({
      stages,
      range: {
        from: range.from,
        to: range.to,
        label: range.label,
      },
    });
  } catch (error) {
    logError("[/api/admin/funnel:GET] Unhandled error", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
