import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError, logWarn } from "@/lib/observability/logger";
import { getDeterministicFallback, getWikiImage } from "@/lib/image-search";
import { normalizeSharePaymentConfig } from "@/lib/share/payment-config";
import { withOptionalSharedItineraryPaymentConfig } from "@/lib/share/payment-config-compat";
import { getHolidayOverlapSummary } from "@/lib/external/holidays";

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
      payment_config: unknown;
      client_comments: unknown;
      client_preferences: unknown;
      wishlist_items: unknown;
      viewed_at: string | null;
      approved_at: string | null;
      approved_by: string | null;
      self_service_status: string | null;
    }> = {};

    if (itineraryIds.length > 0) {
      const { data: shares, paymentConfigSupported } = await withOptionalSharedItineraryPaymentConfig<
        Array<{
          itinerary_id: string | null;
          share_code: string;
          status: string | null;
          payment_config?: unknown;
          client_comments: unknown;
          client_preferences: unknown;
          wishlist_items: unknown;
          viewed_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          self_service_status: string | null;
        }>
      >(
        async () =>
          supabase
            .from("shared_itineraries")
            .select("itinerary_id, share_code, status, payment_config, client_comments, client_preferences, wishlist_items, viewed_at, approved_at, approved_by, self_service_status")
            .in("itinerary_id", itineraryIds),
        async () =>
          supabase
            .from("shared_itineraries")
            .select("itinerary_id, share_code, status, client_comments, client_preferences, wishlist_items, viewed_at, approved_at, approved_by, self_service_status")
            .in("itinerary_id", itineraryIds),
      );

      if (shares) {
        for (const s of shares) {
          if (s.itinerary_id) {
            shareMap[s.itinerary_id] = {
              share_code: s.share_code,
              status: s.status,
              payment_config: paymentConfigSupported && "payment_config" in s ? s.payment_config ?? null : null,
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

    // Fetch trip links for all itineraries (include status to derive pipeline stage)
    const tripMap: Record<string, { id: string; status: string; start_date: string | null; end_date: string | null }> = {};
    const tripIdByItineraryId: Record<string, string> = {};
    if (itineraryIds.length > 0) {
      const { data: trips } = await supabase
        .from("trips")
        .select("id, itinerary_id, status, start_date, end_date")
        .in("itinerary_id", itineraryIds);

      if (trips) {
        for (const t of trips) {
          if (t.itinerary_id) {
            tripMap[t.itinerary_id] = {
              id: t.id,
              status: t.status ?? "draft",
              start_date: t.start_date ?? null,
              end_date: t.end_date ?? null,
            };
            tripIdByItineraryId[t.itinerary_id] = t.id;
          }
        }
      }
    }

    const proposalMap: Record<string, { id: string; status: string | null; share_token: string | null; title: string | null }> = {};
    const linkedTripIds = [...new Set(Object.values(tripIdByItineraryId))];
    const paymentLinkMap: Record<string, { status: "pending" | "viewed" | "paid" | "expired" | "cancelled" | null; paid_at: string | null }> = {};
    if (linkedTripIds.length > 0) {
      const [{ data: proposals }, { data: paymentLinks }] = await Promise.all([
        supabase
          .from("proposals")
          .select("id, trip_id, status, share_token, title, created_at")
          .in("trip_id", linkedTripIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("payment_links")
          .select("booking_id, status, paid_at, created_at")
          .in("booking_id", linkedTripIds)
          .order("created_at", { ascending: false }),
      ]);

      if (proposals) {
        for (const proposal of proposals) {
          if (!proposal.trip_id || proposalMap[proposal.trip_id]) continue;
          proposalMap[proposal.trip_id] = {
            id: proposal.id,
            status: proposal.status ?? null,
            share_token: proposal.share_token ?? null,
            title: proposal.title ?? null,
          };
        }
      }

      if (paymentLinks) {
        for (const paymentLink of paymentLinks) {
          if (!paymentLink.booking_id || paymentLinkMap[paymentLink.booking_id]) continue;
          paymentLinkMap[paymentLink.booking_id] = {
            status: paymentLink.status as "pending" | "viewed" | "paid" | "expired" | "cancelled" | null,
            paid_at: paymentLink.paid_at ?? null,
          };
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
    const holidaySummaries = await Promise.all(
      preEnriched.map(async ({ itin }) => {
        const rawData = (itin.raw_data ?? null) as { start_date?: string; end_date?: string; destination?: string } | null;
        const tripInfo = tripMap[itin.id as string];
        return [
          itin.id as string,
          await getHolidayOverlapSummary({
            destination: (itin.destination as string | null) ?? rawData?.destination ?? null,
            startDate: tripInfo?.start_date ?? rawData?.start_date ?? null,
            endDate: tripInfo?.end_date ?? rawData?.end_date ?? tripInfo?.start_date ?? rawData?.start_date ?? null,
          }),
        ] as const;
      }),
    );
    const holidaySummaryMap = new Map(holidaySummaries);

    const enriched = preEnriched.map(({ itin, heroImage }) => {
      const id = itin.id as string;
      const clientId = itin.client_id as string | null;
      const share = shareMap[id];
      const tripId = tripMap[id]?.id ?? null;
      const linkedProposal = tripId ? proposalMap[tripId] : null;
      const paymentConfig = normalizeSharePaymentConfig(share?.payment_config ?? null);
      const latestPaymentLink = tripId ? paymentLinkMap[tripId] : null;


      // Strip raw_data from response (too large for list view)
      const { raw_data: _rawData, ...itinWithoutRaw } = itin;
      void _rawData;

      return {
        ...itinWithoutRaw,
        hero_image: heroImage,
        client: clientId ? { full_name: clientNameMap[clientId] ?? null } : null,
        share_code: share?.share_code ?? null,
        share_status: share?.status ?? null,
        trip_id: tripId,
        trip_status: tripMap[id]?.status ?? null,
        proposal_id: linkedProposal?.id ?? null,
        proposal_status: linkedProposal?.status ?? null,
        proposal_share_token: linkedProposal?.share_token ?? null,
        proposal_title: linkedProposal?.title ?? null,
        holiday_summary: holidaySummaryMap.get(id) ?? null,
        // Client feedback fields
        client_comments: share?.client_comments ?? [],
        client_preferences: share?.client_preferences ?? null,
        wishlist_items: share?.wishlist_items ?? [],
        share_payment_summary: paymentConfig ? {
          config: paymentConfig,
          latest_status: latestPaymentLink?.status ?? null,
          latest_paid_at: latestPaymentLink?.paid_at ?? null,
        } : null,
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
