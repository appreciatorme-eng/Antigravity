import { createClient as createServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";
import {
  EMBEDDING_MODEL_V2,
  EMBEDDING_VERSION_V2,
  generateQueryEmbeddingV2,
  isEmbeddingV2Configured,
  toVectorLiteral,
} from "@/lib/embeddings-v2";

const DEFAULT_MATCH_THRESHOLD = 0.8;

type MatchItineraryRow = { itinerary_data: unknown };
type RpcResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;

function resolveSemanticMatchThreshold(): number {
  const raw = Number(process.env.SEMANTIC_CACHE_MATCH_THRESHOLD);
  if (Number.isFinite(raw) && raw > 0) {
    return Math.max(0.5, Math.min(raw, 0.98));
  }
  return DEFAULT_MATCH_THRESHOLD;
}

export async function getSemanticMatch(
  prompt: string,
  destination: string,
  days: number,
) {
  if (!isEmbeddingV2Configured()) {
    return null;
  }

  try {
    const supabase = await createServerClient();
    const embedding = await generateQueryEmbeddingV2(prompt);

    if (embedding.length === 0) {
      return null;
    }

    const rpc = supabase.rpc as unknown as (
      fn: string,
      params: Record<string, unknown>,
    ) => RpcResult<MatchItineraryRow[]>;

    const { data, error } = await rpc("match_itineraries_v2", {
      query_embedding: toVectorLiteral(embedding),
      match_threshold: resolveSemanticMatchThreshold(),
      match_count: 1,
      filter_destination: destination,
      filter_days: days,
    });

    if (error) {
      logError(
        "[semantic-cache] match_itineraries_v2 error - skipping semantic cache",
        error,
      );
      return null;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      return data[0]?.itinerary_data ?? null;
    }

    return null;
  } catch (error) {
    logError("[semantic-cache] Semantic match extraction failed", error);
    return null;
  }
}

export async function saveSemanticMatch(
  prompt: string,
  destination: string,
  days: number,
  itineraryData: unknown,
) {
  if (!isEmbeddingV2Configured()) {
    return null;
  }

  try {
    const supabase = await createServerClient();
    const embedding = await generateQueryEmbeddingV2(prompt);

    if (embedding.length === 0) {
      return null;
    }

    const fromFn = supabase.from as unknown as (
      table: string,
    ) => {
      insert: (row: Record<string, unknown>) => Promise<{
        error: { message: string } | null;
      }>;
    };

    const { error } = await fromFn("itinerary_embeddings").insert({
      query_text: prompt,
      destination,
      duration_days: days,
      embedding_v2: toVectorLiteral(embedding),
      embedding_model: EMBEDDING_MODEL_V2,
      embedding_version: EMBEDDING_VERSION_V2,
      itinerary_data: itineraryData,
    });

    if (error) {
      logError("[semantic-cache] Failed to insert semantic itinerary", error);
    }
  } catch (error) {
    logError("[semantic-cache] Failed to save semantic match", error);
  }
}
