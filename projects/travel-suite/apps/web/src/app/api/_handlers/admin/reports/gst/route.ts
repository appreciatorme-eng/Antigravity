/* ------------------------------------------------------------------
 * GET /api/admin/reports/gst?month=2026-02
 * Returns GST-reportable payment_links rows for the given month.
 * ------------------------------------------------------------------ */

import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";

function parseMonthParam(raw: string | null): { start: string; end: string } | null {
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, end };
}

type PaymentStatus = "paid" | "pending" | "cancelled";

function mapStatus(raw: string | null): PaymentStatus {
  if (raw === "paid") return "paid";
  if (raw === "cancelled" || raw === "expired") return "cancelled";
  return "pending";
}

export async function GET(request: Request): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;
    const { organizationId, adminClient } = authResult;

    if (!organizationId) {
      return apiError("Organization not configured", 400);
    }

    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month");
    const range = parseMonthParam(monthParam);

    let query = adminClient
      .from("payment_links")
      .select(`
        id,
        client_name,
        description,
        amount_paise,
        status,
        created_at,
        proposal_id,
        proposals!payment_links_proposal_id_fkey(title)
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (range) {
      query = query.gte("created_at", range.start).lt("created_at", range.end);
    } else {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", thirtyDaysAgo);
    }

    const { data: rows, error } = await query.limit(500);

    if (error) {
      logError("[reports/gst] DB error", error);
      return apiError("Failed to fetch GST report data", 500);
    }

    const gstRows = (rows || []).map((row, idx) => {
      const totalRupees = Math.round((row.amount_paise ?? 0) / 100);
      const baseAmount = Math.round(totalRupees / 1.05);
      const gst = totalRupees - baseAmount;
      const dateStr = (row.created_at ?? "").slice(0, 10);
      const invoiceNo = `INV-${dateStr.slice(0, 7).replace("-", "")}-${String(idx + 1).padStart(3, "0")}`;
      const proposalRecord = Array.isArray(row.proposals) ? row.proposals[0] : row.proposals;
      const tripTitle = (proposalRecord as { title?: string } | null)?.title ?? row.description ?? "Trip package";

      return {
        invoiceNo,
        date: dateStr,
        client: row.client_name ?? "Unknown client",
        trip: tripTitle,
        baseAmount,
        gst,
        total: totalRupees,
        status: mapStatus(row.status),
      };
    });

    return NextResponse.json({ data: { rows: gstRows } });
  } catch (error) {
    logError("[/api/admin/reports/gst:GET] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
