import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError, logWarn } from "@/lib/observability/logger";
import { getDeterministicFallback, getWikiImage } from "@/lib/image-search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || null;
  const limitRaw = Number(searchParams.get("limit") || "50");
  const limit = Math.min(Math.max(1, Number.isNaN(limitRaw) ? 50 : limitRaw), 100);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logWarn("[GET /api/itineraries] 401 — session not found or expired");
      return apiError("Unauthorized", 401);
    }

    // Fetch itineraries — select only columns guaranteed to exist
    let itinQuery = supabase
      .from("itineraries")
      .select("id, trip_title, destination, duration_days, created_at, budget, interests, summary, client_id, template_id, raw_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (cursor) {
      itinQuery = itinQuery.lt("created_at", cursor);
    }
    const { data: itineraries, error } = await itinQuery.limit(limit);

    if (error) {
      logError("Itinerary fetch error, retrying with core columns", error.message);
      let fallbackQuery = supabase
        .from("itineraries")
        .select("id, trip_title, destination, duration_days, created_at, budget, interests, summary")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cursor) {
        fallbackQuery = fallbackQuery.lt("created_at", cursor);
      }
      const { data: fallbackData, error: fallbackError } = await fallbackQuery.limit(limit);

      if (fallbackError) {
        return apiError(safeErrorMessage(fallbackError, "Failed to load itineraries"), 400);
      }

      const fallbackList = fallbackData ?? [];
      const fallbackNextCursor = fallbackList.length === limit
        ? ((fallbackList[fallbackList.length - 1] as { created_at?: string } | undefined)?.created_at ?? null)
        : null;
      return NextResponse.json({ itineraries: fallbackList, nextCursor: fallbackNextCursor, hasMore: fallbackNextCursor !== null });
    }

    // Fetch share info for all itineraries — now includes feedback data
    const itineraryIds = (itineraries ?? []).map((i: Record<string, unknown>) => i.id as string);
    const shareMap: Record<string, {
      share_code: string;
      status: string | null;
      client_comments: unknown;
      client_preferences: unknown;
      wishlist_items: unknown;
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
    const tripMap: Record<string, string> = {};
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
    const clientNameMap: Record<string, string> = {};
    const clientIds = [...new Set((itineraries ?? []).map((i: Record<string, unknown>) => i.client_id as string).filter(Boolean))];
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
    // First pass: extract hero images from raw_data
    const preEnriched = (itineraries ?? []).map((itin: Record<string, unknown>) => {
      let heroImage: string | null = null;
      const rawData = itin.raw_data as { days?: Array<{ activities?: Array<{ image?: string }> }> } | null;
      if (rawData?.days) {
        for (const day of rawData.days) {
          for (const act of day.activities ?? []) {
            if (act.image) { heroImage = act.image; break; }
          }
          if (heroImage) break;
        }
      }
      return { itin, heroImage };
    });

    // Fetch destination-specific Wikipedia images for itineraries without hero images (in parallel)
    const missingImageIdxs = preEnriched
      .map((e, i) => (!e.heroImage && e.itin.destination ? i : -1))
      .filter((i) => i !== -1);

    if (missingImageIdxs.length > 0) {
      const wikiResults = await Promise.all(
        missingImageIdxs.map((idx) => {
          const dest = preEnriched[idx].itin.destination as string;
          return getWikiImage(dest, dest).catch(() => getDeterministicFallback(dest));
        })
      );
      for (let j = 0; j < missingImageIdxs.length; j++) {
        preEnriched[missingImageIdxs[j]].heroImage = wikiResults[j];
      }
    }

    // Second pass: build response objects
    const enriched = preEnriched.map(({ itin, heroImage }) => {
      const id = itin.id as string;
      const clientId = itin.client_id as string | null;
      const share = shareMap[id];

      // Strip raw_data from response (too large for list view)
      const { raw_data: _rawData, ...itinWithoutRaw } = itin;
      void _rawData;

      return {
        ...itinWithoutRaw,
        hero_image: heroImage,
        client: clientId ? { full_name: clientNameMap[clientId] ?? null } : null,
        share_code: share?.share_code ?? null,
        share_status: share?.status ?? null,
        trip_id: tripMap[id] ?? null,
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

    const nextCursor = enriched.length === limit
      ? ((enriched[enriched.length - 1] as { created_at?: string } | undefined)?.created_at ?? null)
      : null;
    return NextResponse.json({ itineraries: enriched, nextCursor, hasMore: nextCursor !== null });
  } catch (error) {
    return apiError(safeErrorMessage(error), 500);
  }
}
