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
    const { data: itineraries, error } = await supabase
      .from("itineraries")
      .select("id, trip_title, destination, duration_days, created_at, budget, interests, summary, client_id, template_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
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

    // Fetch share info for all itineraries — now includes feedback data
    const itineraryIds = (itineraries ?? []).map((i: any) => i.id);
    let shareMap: Record<string, {
      share_code: string;
      status: string | null;
      client_comments: any;
      client_preferences: any;
      wishlist_items: any;
      viewed_at: string | null;
      approved_at: string | null;
      approved_by: string | null;
      self_service_status: string | null;
    }> = {};

    if (itineraryIds.length > 0) {
      const { data: shares } = await supabase
        .from("shared_itineraries")
        .select("itinerary_id, share_code, status, client_comments, client_preferences, wishlist_items, viewed_at, approved_at, approved_by, self_service_status")
        .in("itinerary_id", itineraryIds);

      if (shares) {
        for (const s of shares) {
          if (s.itinerary_id) {
            shareMap[s.itinerary_id] = {
              share_code: s.share_code,
              status: s.status,
              client_comments: s.client_comments ?? [],
              client_preferences: s.client_preferences ?? null,
              wishlist_items: s.wishlist_items ?? [],
              viewed_at: s.viewed_at ?? null,
              approved_at: s.approved_at ?? null,
              approved_by: s.approved_by ?? null,
              self_service_status: s.self_service_status ?? null,
            };
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
    const enriched = (itineraries ?? []).map((itin: any) => {
      const share = shareMap[itin.id];
      return {
        ...itin,
        client: itin.client_id ? { full_name: clientNameMap[itin.client_id] ?? null } : null,
        share_code: share?.share_code ?? null,
        share_status: share?.status ?? null,
        trip_id: tripMap[itin.id] ?? null,
        // Client feedback fields
        client_comments: share?.client_comments ?? [],
        client_preferences: share?.client_preferences ?? null,
        wishlist_items: share?.wishlist_items ?? [],
        viewed_at: share?.viewed_at ?? null,
        approved_at: share?.approved_at ?? null,
        approved_by: share?.approved_by ?? null,
        self_service_status: share?.self_service_status ?? null,
      };
    });

    return NextResponse.json({ itineraries: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
