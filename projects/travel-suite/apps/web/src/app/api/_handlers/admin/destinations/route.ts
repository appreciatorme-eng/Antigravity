import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { resolveAdminDateRange } from "@/lib/admin/date-range";

type ProposalDestinationRow = {
  tour_templates:
    | { destination?: string | null; name?: string | null }
    | Array<{ destination?: string | null; name?: string | null }>
    | null;
};

function normalizeTemplateDestination(
  relation: ProposalDestinationRow["tour_templates"],
) {
  if (Array.isArray(relation)) {
    return relation[0]?.destination || relation[0]?.name || null;
  }
  return relation?.destination || relation?.name || null;
}

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
    const { data, error } = await admin.adminClient
      .from("proposals")
      .select("tour_templates(destination, name)")
      .eq("organization_id", organizationId)
      .gte("created_at", range.fromISO)
      .lt("created_at", range.toExclusiveISO);

    if (error) throw error;

    const counts = new Map<string, number>();
    for (const row of (data || []) as ProposalDestinationRow[]) {
      const destination = normalizeTemplateDestination(row.tour_templates) || "Unspecified";
      counts.set(destination, (counts.get(destination) || 0) + 1);
    }

    const destinations = Array.from(counts.entries())
      .map(([destination, count]) => ({ destination, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8);

    return NextResponse.json({
      destinations,
      range: {
        from: range.from,
        to: range.to,
        label: range.label,
      },
    });
  } catch (error) {
    console.error("[/api/admin/destinations:GET] Unhandled error:", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
