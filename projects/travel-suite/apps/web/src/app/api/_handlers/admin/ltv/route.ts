import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { resolveAdminDateRange } from "@/lib/admin/date-range";
import { logError } from "@/lib/observability/logger";

type PaidCustomerRow = {
  client_name: string | null;
  client_email: string | null;
  amount_paise: number | null;
};

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
    const { data } = await admin.adminClient
      .from("payment_links")
      .select("client_name, client_email, amount_paise")
      .eq("organization_id", organizationId)
      .eq("status", "paid")
      .gte("paid_at", range.fromISO)
      .lt("paid_at", range.toExclusiveISO);

    // payment_links table may not be migrated yet; return empty LTV data gracefully

    const grouped = new Map<
      string,
      { customerName: string; customerEmail: string | null; bookings: number; ltvInr: number }
    >();

    for (const row of (data || []) as PaidCustomerRow[]) {
      const key = row.client_email || row.client_name || "anonymous";
      const existing = grouped.get(key) || {
        customerName: row.client_name || row.client_email || "Walk-in traveler",
        customerEmail: row.client_email || null,
        bookings: 0,
        ltvInr: 0,
      };

      existing.bookings += 1;
      existing.ltvInr += Number(row.amount_paise || 0) / 100;
      grouped.set(key, existing);
    }

    const customers = Array.from(grouped.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((left, right) => right.ltvInr - left.ltvInr)
      .slice(0, 10);

    return NextResponse.json({
      customers,
      range: {
        from: range.from,
        to: range.to,
        label: range.label,
      },
    });
  } catch (error) {
    logError("[/api/admin/ltv:GET] Unhandled error", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
