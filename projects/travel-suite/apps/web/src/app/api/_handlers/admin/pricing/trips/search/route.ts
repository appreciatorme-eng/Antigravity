import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    const db = admin.adminClient;
    const orgId = admin.organizationId;

    let query = db
      .from("trips")
      .select("id, name, destination, start_date, pax_count, client_id")
      .eq("organization_id", orgId)
      .order("start_date", { ascending: false })
      .limit(20);

    if (q.length >= 2) {
      query = query.or(`name.ilike.%${q}%,destination.ilike.%${q}%`);
    }

    const { data: trips, error } = await query;
    if (error) {
      logError("[/api/admin/pricing/trips/search:GET] DB error", error);
      return apiError(safeErrorMessage(error, "Request failed"), 500);
    }

    const rows = trips || [];
    type ClientNameRow = { id: string; name: string | null };
    const clientIds = [...new Set(rows.map((t) => t.client_id).filter(Boolean))] as string[];
    const clientMap = new Map<string, string>();
    if (clientIds.length > 0) {
      const { data: clients } = await (db as unknown as SupabaseClient)
        .from("clients")
        .select("id, name")
        .in("id", clientIds);
      for (const c of (clients || []) as unknown as ClientNameRow[]) {
        clientMap.set(c.id, c.name || "Unknown");
      }
    }

    const results = rows.map((t) => ({
      id: t.id,
      name: t.name || "Untitled",
      destination: t.destination,
      start_date: t.start_date,
      pax_count: t.pax_count || 1,
      client_name: clientMap.get(t.client_id ?? "") || null,
    }));

    return NextResponse.json({ trips: results });
  } catch (error) {
    logError("[/api/admin/pricing/trips/search:GET] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
