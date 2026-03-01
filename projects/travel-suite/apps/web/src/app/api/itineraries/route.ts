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

    // Fetch itineraries — select only columns guaranteed to exist
    // Note: client_id FK points to clients(id) not profiles(id), so we can't
    // do a direct PostgREST join to profiles via client_id. We fetch client
    // names separately below.
    const { data: itineraries, error } = await supabase
      .from("itineraries")
      .select("id, trip_title, destination, duration_days, created_at, budget, interests, summary, client_id, template_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // If the query failed (e.g. client_id or template_id columns don't exist),
      // retry with only the core columns that are guaranteed to exist
      console.error("Itinerary fetch error, retrying with core columns:", error.message);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("itineraries")
        .select("id, trip_title, destination, duration_days, created_at, budget, interests, summary")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 400 });
      }

      return NextResponse.json({ itineraries: fallbackData ?? [] });
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

    // Fetch client names for itineraries that have a client_id
    let clientNameMap: Record<string, string> = {};
    const clientIds = [...new Set((itineraries ?? []).map((i: any) => i.client_id).filter(Boolean))];
    if (clientIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", clientIds);

      if (profiles) {
        for (const p of profiles) {
          clientNameMap[p.id] = p.full_name ?? "";
        }
      }
    }

    // Merge share, trip & client info into itineraries
    const enriched = (itineraries ?? []).map((itin: any) => ({
      ...itin,
      client: itin.client_id ? { full_name: clientNameMap[itin.client_id] ?? null } : null,
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
