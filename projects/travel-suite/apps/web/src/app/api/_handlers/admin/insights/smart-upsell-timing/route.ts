import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { safeTitle } from "@/lib/admin/insights";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  daysForward: z.coerce.number().int().min(3).max(90).default(30),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const parsed = QuerySchema.safeParse({
    limit: new URL(req.url).searchParams.get("limit") || "10",
    daysForward: new URL(req.url).searchParams.get("daysForward") || "30",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 });
  }

  const today = new Date();
  const endWindow = new Date(Date.now() + parsed.data.daysForward * 24 * 60 * 60 * 1000);

  const [tripRes, addOnRes] = await Promise.all([
    admin.adminClient
      .from("trips")
      .select("id,status,start_date,itineraries(destination,trip_title)")
      .eq("organization_id", admin.organizationId)
      .in("status", ["planned", "confirmed", "in_progress"])
      .gte("start_date", today.toISOString().slice(0, 10))
      .lte("start_date", endWindow.toISOString().slice(0, 10))
      .order("start_date", { ascending: true })
      .limit(120),
    admin.adminClient
      .from("add_ons")
      .select("id,name,category,price")
      .eq("organization_id", admin.organizationId)
      .eq("is_active", true)
      .limit(40),
  ]);

  if (tripRes.error || addOnRes.error) {
    const err = tripRes.error || addOnRes.error;
    return NextResponse.json({ error: err?.message || "Failed to compute smart upsell timing" }, { status: 500 });
  }

  const trips = tripRes.data || [];
  const tripIds = trips.map((trip) => trip.id);

  let tripAddOns: Array<{ trip_id: string; add_on_id: string | null; status: string | null }> = [];
  if (tripIds.length > 0) {
    const { data } = await admin.adminClient
      .from("client_add_ons")
      .select("trip_id,add_on_id,status")
      .in("trip_id", tripIds);
    tripAddOns = (data || []) as Array<{ trip_id: string; add_on_id: string | null; status: string | null }>;
  }

  const addOnMap = new Map((addOnRes.data || []).map((row) => [row.id, row]));
  const byTrip = new Map<string, Set<string>>();
  for (const row of tripAddOns) {
    if (!row.trip_id || !row.add_on_id) continue;
    if (!byTrip.has(row.trip_id)) byTrip.set(row.trip_id, new Set());
    byTrip.get(row.trip_id)?.add(row.add_on_id);
  }

  const recommendations = trips
    .map((trip) => {
      const existing = byTrip.get(trip.id) || new Set();
      const available = (addOnRes.data || []).filter((addOn) => !existing.has(addOn.id));
      const itinerary = Array.isArray(trip.itineraries) ? trip.itineraries[0] : trip.itineraries;
      const startDate = trip.start_date ? new Date(trip.start_date) : null;
      const daysToDeparture = startDate
        ? Math.max(0, Math.round((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

      const stage =
        daysToDeparture === null
          ? "active"
          : daysToDeparture > 14
            ? "early"
            : daysToDeparture > 3
              ? "mid"
              : "last_minute";

      const best = available
        .map((addOn) => {
          const stageBoost =
            stage === "early" && addOn.category?.toLowerCase() === "experience"
              ? 12
              : stage === "mid" && addOn.category?.toLowerCase() === "transport"
                ? 11
                : stage === "last_minute" && addOn.category?.toLowerCase() === "support"
                  ? 10
                  : 6;
          return {
            add_on_id: addOn.id,
            name: safeTitle(addOn.name),
            category: safeTitle(addOn.category, "General"),
            price_usd: Number(addOn.price || 0),
            score: stageBoost + Math.min(Number(addOn.price || 0) / 50, 20),
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      return {
        trip_id: trip.id,
        trip_title: safeTitle(itinerary?.trip_title || itinerary?.destination || "Trip"),
        destination: safeTitle(itinerary?.destination || "Unknown"),
        start_date: trip.start_date,
        stage,
        days_to_departure: daysToDeparture,
        recommendations: best,
      };
    })
    .filter((item) => item.recommendations.length > 0)
    .slice(0, parsed.data.limit);

  return NextResponse.json({
    window_days_forward: parsed.data.daysForward,
    generated_at: new Date().toISOString(),
    recommendations,
  });
}
