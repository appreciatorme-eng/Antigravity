import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch itineraries with additional fields
    const { data: itineraries, error } = await supabase
      .from("itineraries")
      .select("id, trip_title, destination, duration_days, created_at, budget, interests, client_id, template_id, summary, client:profiles!client_id(full_name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch share info for all itineraries
    const itineraryIds = (itineraries ?? []).map((i: any) => i.id);
    let shareMap: Record<string, { share_code: string; status: string | null }> = {};

    if (itineraryIds.length > 0) {
      const { data: shares } = await supabase
        .from("shared_itineraries")
        .select("itinerary_id, share_code, status")
        .in("itinerary_id", itineraryIds);

      if (shares) {
        for (const s of shares) {
          if (s.itinerary_id) {
            shareMap[s.itinerary_id] = { share_code: s.share_code, status: s.status };
          }
        }
      }
    }

    // Fetch trip links for all itineraries
    let tripMap: Record<string, string> = {};
    if (itineraryIds.length > 0) {
      const { data: trips } = await supabase
        .from("trips")
        .select("id, itinerary_id")
        .in("itinerary_id", itineraryIds);

      if (trips) {
        for (const t of trips) {
          if (t.itinerary_id) {
            tripMap[t.itinerary_id] = t.id;
          }
        }
      }
    }

    // Merge share & trip info into itineraries
    const enriched = (itineraries ?? []).map((itin: any) => ({
      ...itin,
      share_code: shareMap[itin.id]?.share_code ?? null,
      share_status: shareMap[itin.id]?.status ?? null,
      trip_id: tripMap[itin.id] ?? null,
    }));

    return NextResponse.json({ itineraries: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
