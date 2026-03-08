import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GOOGLE_PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type GoogleReview = {
  author_name?: string;
  author_url?: string;
  language?: string;
  profile_photo_url?: string;
  rating?: number;
  text?: string;
  time?: number;
};

type GooglePlaceDetailsResponse = {
  error_message?: string;
  result?: {
    name?: string;
    rating?: number;
    reviews?: GoogleReview[];
    url?: string;
    user_ratings_total?: number;
  };
  status?: string;
};

type SyncConnectionRecord = {
  id: string;
  organization_id: string;
  platform: string;
  platform_account_id: string | null;
  platform_account_name: string | null;
  platform_location_id: string | null;
  sync_enabled: boolean;
};

type ExistingReviewRecord = {
  id: string;
  platform_review_id: string | null;
  response_posted_at: string | null;
  response_posted_by: string | null;
  response_status: string | null;
  response_text: string | null;
  is_featured: boolean | null;
};

function buildPlatformReviewId(placeId: string, review: GoogleReview): string {
  const identityParts = [
    placeId,
    review.author_name?.trim() || "anonymous",
    review.time ? String(review.time) : "no-time",
    review.text?.trim().slice(0, 80) || "no-text",
  ];

  return identityParts.join(":");
}

function deriveSentimentLabel(rating: number): "positive" | "neutral" | "negative" {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

async function setConnectionSyncState(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reputation sync tables are not in generated types yet.
  supabase: any,
  connectionId: string,
  fields: {
    last_synced_at?: string | null;
    sync_error?: string | null;
  },
) {
  const updatePayload: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if ("last_synced_at" in fields) {
    updatePayload.last_synced_at = fields.last_synced_at ?? null;
  }

  if ("sync_error" in fields) {
    updatePayload.sync_error = fields.sync_error ?? null;
  }

  await supabase
    .from("reputation_platform_connections")
    .update(updatePayload)
    .eq("id", connectionId);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Google Places is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY before syncing reviews.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      connectionId?: string;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- organization_settings is available in Supabase but not fully typed here.
    const { data: orgSettings } = await (supabase as any)
      .from("organization_settings")
      .select("google_places_enabled")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (!orgSettings?.google_places_enabled) {
      return NextResponse.json(
        {
          error:
            "Connect Google Places in Settings before importing reviews automatically.",
        },
        { status: 412 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reputation sync tables are not in generated types yet.
    let connectionsQuery = (supabase as any)
      .from("reputation_platform_connections")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("platform", "google_business")
      .eq("sync_enabled", true);

    if (body.connectionId) {
      connectionsQuery = connectionsQuery.eq("id", body.connectionId);
    }

    const { data: rawConnections, error: connectionsError } = await connectionsQuery.order(
      "created_at",
      { ascending: false },
    );

    if (connectionsError) {
      throw connectionsError;
    }

    const connections = (rawConnections ?? []) as SyncConnectionRecord[];
    if (connections.length === 0) {
      return NextResponse.json(
        {
          error:
            "No active Google Business connection found. Connect Google Business first.",
        },
        { status: 404 },
      );
    }

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    const syncedAt = new Date().toISOString();

    for (const connection of connections) {
      const placeId = connection.platform_location_id || connection.platform_account_id;

      if (!placeId) {
        const message = `${connection.platform_account_name || "Google Business"} is missing a Place ID.`;
        errors.push(message);
        await setConnectionSyncState(supabase, connection.id, {
          sync_error: message,
        });
        continue;
      }

      try {
        const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
        url.searchParams.set("place_id", placeId);
        url.searchParams.set("fields", "name,rating,reviews,url,user_ratings_total");
        url.searchParams.set("reviews_sort", "newest");
        url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

        const placesResponse = await fetch(url.toString(), {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const payload = (await placesResponse.json().catch(() => null)) as
          | GooglePlaceDetailsResponse
          | null;

        if (!placesResponse.ok || !payload) {
          throw new Error("Google Places did not return a valid review payload");
        }

        if (payload.status && payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
          throw new Error(payload.error_message || `Google Places error: ${payload.status}`);
        }

        const remoteReviews = payload.result?.reviews ?? [];
        const reviewIds = remoteReviews.map((review) => buildPlatformReviewId(placeId, review));

        let existingReviewMap = new Map<string, ExistingReviewRecord>();
        if (reviewIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reputation review table is not fully represented in generated types yet.
          const { data: existingReviews, error: existingError } = await (supabase as any)
            .from("reputation_reviews")
            .select(
              "id, platform_review_id, response_posted_at, response_posted_by, response_status, response_text, is_featured",
            )
            .eq("organization_id", profile.organization_id)
            .eq("platform", "google")
            .in("platform_review_id", reviewIds);

          if (existingError) {
            throw existingError;
          }

          existingReviewMap = new Map(
            ((existingReviews ?? []) as ExistingReviewRecord[])
              .filter((review) => Boolean(review.platform_review_id))
              .map((review) => [review.platform_review_id as string, review]),
          );
        }

        for (const remoteReview of remoteReviews) {
          const rating = Number(remoteReview.rating ?? 0);
          if (!Number.isFinite(rating) || rating <= 0) continue;

          const platformReviewId = buildPlatformReviewId(placeId, remoteReview);
          const existingReview = existingReviewMap.get(platformReviewId);
          const reviewDate = remoteReview.time
            ? new Date(remoteReview.time * 1000).toISOString()
            : syncedAt;
          const requiresAttention = rating <= 2;

          const baseReviewPayload = {
            organization_id: profile.organization_id,
            platform: "google",
            platform_review_id: platformReviewId,
            platform_url: payload.result?.url || remoteReview.author_url || null,
            reviewer_name: remoteReview.author_name || "Google reviewer",
            reviewer_avatar_url: remoteReview.profile_photo_url || null,
            rating,
            title: null,
            comment: remoteReview.text || null,
            review_date: reviewDate,
            language: remoteReview.language || "en",
            sentiment_label: deriveSentimentLabel(rating),
            response_status: existingReview?.response_status || "pending",
            response_text: existingReview?.response_text || null,
            response_posted_at: existingReview?.response_posted_at || null,
            response_posted_by: existingReview?.response_posted_by || null,
            is_featured: existingReview?.is_featured ?? false,
            is_verified_client: false,
            requires_attention: requiresAttention,
            attention_reason: requiresAttention
              ? "Imported low-rating review requires a response"
              : null,
            updated_at: syncedAt,
          };

          if (existingReview) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reputation review table is not fully represented in generated types yet.
            const { error: updateError } = await (supabase as any)
              .from("reputation_reviews")
              .update(baseReviewPayload)
              .eq("id", existingReview.id)
              .eq("organization_id", profile.organization_id);

            if (updateError) {
              throw updateError;
            }

            updated += 1;
            continue;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reputation review table is not fully represented in generated types yet.
          const { error: insertError } = await (supabase as any)
            .from("reputation_reviews")
            .insert({
              ...baseReviewPayload,
              created_at: syncedAt,
            });

          if (insertError) {
            throw insertError;
          }

          inserted += 1;
        }

        await setConnectionSyncState(supabase, connection.id, {
          last_synced_at: syncedAt,
          sync_error: null,
        });
      } catch (connectionError) {
        const message =
          connectionError instanceof Error
            ? connectionError.message
            : "Failed to sync Google reviews";

        errors.push(message);
        await setConnectionSyncState(supabase, connection.id, {
          sync_error: message,
        });
      }
    }

    return NextResponse.json({
      synced: inserted + updated,
      inserted,
      updated,
      failedConnections: errors.length,
      errors,
      lastSyncedAt: syncedAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sync reviews";
    console.error("[reputation/sync] sync failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
