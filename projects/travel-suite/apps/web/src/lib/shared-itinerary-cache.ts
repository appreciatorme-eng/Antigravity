import crypto from "crypto";

import { createClient } from "@supabase/supabase-js";

type SharedCacheSource =
  | "org_exact"
  | "redis_exact"
  | "shared_exact"
  | "shared_similar"
  | "semantic"
  | "rag"
  | "ai";

interface SharedCacheLookupInput {
  prompt: string;
  destination: string;
  days: number;
  organizationId?: string | null;
}

interface SharedCachePromotionInput extends SharedCacheLookupInput {
  itineraryData: unknown;
  sourceType: "generated" | "rag" | "promoted";
  createdBy?: string | null;
}

interface SharedCacheParams {
  destinationKey: string;
  seasonKey: string;
  durationBucket: string;
  budgetBucket: string;
  interestsKey: string;
  fingerprint: string;
}

function getSharedCacheClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function normalizeDestinationKey(destination: string) {
  return destination
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveSeasonKey(now = new Date()) {
  const month = now.getUTCMonth() + 1;
  if (month === 12 || month <= 2) return "winter";
  if (month >= 3 && month <= 5) return "summer";
  if (month >= 6 && month <= 9) return "monsoon";
  return "festive";
}

function resolveDurationBucket(days: number) {
  if (days <= 3) return "1-3";
  if (days <= 6) return "4-6";
  if (days <= 10) return "7-10";
  return "11-14";
}

function resolveBudgetBucket(prompt: string) {
  const lower = prompt.toLowerCase();
  if (/(luxury|premium|5 star|five star|high[-\s]?end)/.test(lower)) return "luxury";
  if (/(budget|cheap|affordable|backpack)/.test(lower)) return "budget";
  if (/(mid[-\s]?range|moderate|comfortable|standard)/.test(lower)) return "mid";
  return "flex";
}

function resolveInterestsKey(prompt: string) {
  const lower = prompt.toLowerCase();
  const tags = [
    ["adventure", /(adventure|trek|hike|rafting|ski|bike)/],
    ["family", /(family|kids|child|children)/],
    ["honeymoon", /(honeymoon|romantic|couple)/],
    ["culture", /(culture|museum|history|heritage|temple)/],
    ["food", /(food|culinary|restaurant|street food)/],
    ["beach", /(beach|island|coast)/],
    ["nature", /(nature|wildlife|national park|mountain|lake)/],
  ].flatMap(([label, pattern]) =>
    (pattern as RegExp).test(lower) ? [label as string] : []
  );

  return tags.length > 0 ? tags.sort().join("|") : "general";
}

function createSharedCacheParams(input: SharedCacheLookupInput): SharedCacheParams {
  const destinationKey = normalizeDestinationKey(input.destination);
  const seasonKey = resolveSeasonKey();
  const durationBucket = resolveDurationBucket(input.days);
  const budgetBucket = resolveBudgetBucket(input.prompt);
  const interestsKey = resolveInterestsKey(input.prompt);
  const fingerprint = crypto
    .createHash("sha1")
    .update(
      JSON.stringify({
        destinationKey,
        seasonKey,
        durationBucket,
        budgetBucket,
        interestsKey,
      })
    )
    .digest("hex");

  return {
    destinationKey,
    seasonKey,
    durationBucket,
    budgetBucket,
    interestsKey,
    fingerprint,
  };
}

export async function trackSharedCacheSourceEvent(options: {
  eventType: "hit" | "miss" | "promote";
  cacheSource: SharedCacheSource;
  organizationId?: string | null;
  destinationKey?: string;
  durationBucket?: string;
  sharedCacheId?: string | null;
  responseTimeMs?: number;
  metadata?: Record<string, unknown>;
}) {
  const client = getSharedCacheClient();
  if (!client) return;

  await client.from("shared_itinerary_cache_events").insert({
    event_type: options.eventType,
    cache_source: options.cacheSource,
    organization_id: options.organizationId ?? null,
    shared_cache_id: options.sharedCacheId ?? null,
    destination_key: options.destinationKey ?? null,
    duration_bucket: options.durationBucket ?? null,
    response_time_ms: options.responseTimeMs ?? null,
    metadata: options.metadata ?? {},
  });
}

export async function getSharedCachedItinerary(input: SharedCacheLookupInput) {
  const client = getSharedCacheClient();
  if (!client) return null;

  const startedAt = Date.now();
  const params = createSharedCacheParams(input);

  try {
    const { data: exact, error: exactError } = await client
      .from("shared_itinerary_cache")
      .select("id, itinerary_data, hit_count, quality_score")
      .eq("fingerprint", params.fingerprint)
      .eq("promotion_state", "shared")
      .maybeSingle();

    if (exactError) {
      throw exactError;
    }

    if (exact) {
      await client
        .from("shared_itinerary_cache")
        .update({
          hit_count: exact.hit_count + 1,
          last_hit_at: new Date().toISOString(),
        })
        .eq("id", exact.id);

      await trackSharedCacheSourceEvent({
        eventType: "hit",
        cacheSource: "shared_exact",
        organizationId: input.organizationId,
        destinationKey: params.destinationKey,
        durationBucket: params.durationBucket,
        sharedCacheId: exact.id,
        responseTimeMs: Date.now() - startedAt,
      });

      return {
        itinerary: exact.itinerary_data,
        source: "shared_exact" as const,
        cacheId: exact.id,
      };
    }

    const { data: similar, error: similarError } = await client
      .from("shared_itinerary_cache")
      .select("id, itinerary_data, hit_count, quality_score")
      .eq("destination_key", params.destinationKey)
      .eq("duration_bucket", params.durationBucket)
      .eq("promotion_state", "shared")
      .gte("quality_score", 0.75)
      .order("quality_score", { ascending: false })
      .order("hit_count", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (similarError) {
      throw similarError;
    }

    if (similar) {
      await client
        .from("shared_itinerary_cache")
        .update({
          hit_count: similar.hit_count + 1,
          last_hit_at: new Date().toISOString(),
        })
        .eq("id", similar.id);

      await trackSharedCacheSourceEvent({
        eventType: "hit",
        cacheSource: "shared_similar",
        organizationId: input.organizationId,
        destinationKey: params.destinationKey,
        durationBucket: params.durationBucket,
        sharedCacheId: similar.id,
        responseTimeMs: Date.now() - startedAt,
        metadata: {
          seasonKey: params.seasonKey,
          budgetBucket: params.budgetBucket,
          interestsKey: params.interestsKey,
        },
      });

      return {
        itinerary: similar.itinerary_data,
        source: "shared_similar" as const,
        cacheId: similar.id,
      };
    }

    await trackSharedCacheSourceEvent({
      eventType: "miss",
      cacheSource: "shared_exact",
      organizationId: input.organizationId,
      destinationKey: params.destinationKey,
      durationBucket: params.durationBucket,
      responseTimeMs: Date.now() - startedAt,
    });

    return null;
  } catch (error) {
    console.error("Shared itinerary cache lookup failed:", error);
    return null;
  }
}

export async function promoteSharedItineraryCache(input: SharedCachePromotionInput) {
  const client = getSharedCacheClient();
  if (!client) return null;

  const params = createSharedCacheParams(input);

  try {
    const { data, error } = await client
      .from("shared_itinerary_cache")
      .upsert(
        {
          destination_key: params.destinationKey,
          season_key: params.seasonKey,
          duration_bucket: params.durationBucket,
          budget_bucket: params.budgetBucket,
          interests_key: params.interestsKey,
          fingerprint: params.fingerprint,
          itinerary_data: input.itineraryData,
          source_type: input.sourceType,
          promotion_state: "shared",
          quality_score: input.sourceType === "rag" ? 0.9 : 0.8,
          last_promoted_at: new Date().toISOString(),
          created_by: input.createdBy ?? null,
        },
        { onConflict: "fingerprint" }
      )
      .select("id")
      .single();

    if (error || !data) {
      throw error ?? new Error("Failed to promote shared itinerary cache");
    }

    await trackSharedCacheSourceEvent({
      eventType: "promote",
      cacheSource: input.sourceType === "rag" ? "rag" : "ai",
      organizationId: input.organizationId,
      destinationKey: params.destinationKey,
      durationBucket: params.durationBucket,
      sharedCacheId: data.id,
      metadata: {
        seasonKey: params.seasonKey,
        budgetBucket: params.budgetBucket,
        interestsKey: params.interestsKey,
      },
    });

    return data.id;
  } catch (error) {
    console.error("Shared itinerary cache promotion failed:", error);
    return null;
  }
}

export async function getSharedCacheStats(days = 30, organizationId?: string | null) {
  const client = getSharedCacheClient();
  if (!client) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  let query = client
    .from("shared_itinerary_cache_events")
    .select("event_type, cache_source, destination_key, created_at")
    .gte("created_at", since);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Shared itinerary cache stats lookup failed:", error);
    return null;
  }

  const events = data ?? [];
  const totalHits = events.filter((event) => event.event_type === "hit").length;
  const totalMisses = events.filter((event) => event.event_type === "miss").length;
  const bySource = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.cache_source] = (acc[event.cache_source] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalHits,
    totalMisses,
    hitRate: totalHits + totalMisses > 0 ? Number(((totalHits / (totalHits + totalMisses)) * 100).toFixed(2)) : 0,
    bySource,
    topDestinations: events.reduce<Record<string, number>>((acc, event) => {
      if (!event.destination_key) return acc;
      acc[event.destination_key] = (acc[event.destination_key] ?? 0) + 1;
      return acc;
    }, {}),
  };
}
