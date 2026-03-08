import "server-only";

/* ------------------------------------------------------------------
 * Semantic Response Cache -- embedding-based fuzzy cache layer.
 *
 * Uses Gemini embeddings to find semantically similar
 * cached responses at cosine similarity >= 0.92. Stored in Redis as
 * a ring buffer of up to MAX_ENTRIES entries per organisation.
 *
 * Sits between the exact-match cache and the primary model chat call.
 * Never throws -- all errors are caught and logged.
 * ------------------------------------------------------------------ */

import { getCachedJson, setCachedJson } from "@/lib/cache/upstash";
import { generateSemanticEmbeddingV2 } from "@/lib/embeddings-v2";
import type { OrchestratorResponse } from "./types";
import { shouldSkipCache } from "./response-cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SemanticCacheEntry {
  readonly embedding: readonly number[];
  readonly response: OrchestratorResponse;
  readonly query: string;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEMANTIC_KEY_PREFIX = "assistant:semcache";
const SEMANTIC_TTL_SECONDS = 3600;
const SIMILARITY_THRESHOLD = 0.92;
const MAX_ENTRIES = 50;
// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Compute cosine similarity between two equal-length vectors.
 * Returns 0 when either vector has zero magnitude.
 */
function cosineSimilarity(
  a: readonly number[],
  b: readonly number[],
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Check whether a response should be stored in the semantic cache.
 * Excludes action proposals and results with side effects.
 */
function isResponseCacheable(response: OrchestratorResponse): boolean {
  if (response.actionProposal) {
    return false;
  }

  if (response.actionResult?.affectedEntities?.length) {
    return false;
  }

  return true;
}

/**
 * Build the Redis key for a given organisation's semantic cache.
 * Format: `assistant:semcache:<orgId>`
 */
function buildSemanticKey(orgId: string): string {
  return `${SEMANTIC_KEY_PREFIX}:${orgId}`;
}

// ---------------------------------------------------------------------------
// Embedding helper
// ---------------------------------------------------------------------------

/**
 * Fetch an embedding vector from the shared Gemini embedding helper.
 * Returns null on any error so callers can gracefully skip caching.
 */
async function getEmbedding(
  text: string,
): Promise<readonly number[] | null> {
  try {
    return await generateSemanticEmbeddingV2(text);
  } catch (error: unknown) {
    console.error("Semantic cache embedding error:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cache I/O
// ---------------------------------------------------------------------------

/**
 * Search for a semantically similar cached response for the given query.
 * Returns null on cache miss, skip, or any error.
 */
export async function getSemanticCachedResponse(
  orgId: string,
  message: string,
): Promise<OrchestratorResponse | null> {
  try {
    if (shouldSkipCache(message)) {
      return null;
    }

    const key = buildSemanticKey(orgId);
    const entries = await getCachedJson<readonly SemanticCacheEntry[]>(key);

    if (!entries || entries.length === 0) {
      return null;
    }

    const embedding = await getEmbedding(message);

    if (!embedding) {
      return null;
    }

    let bestSimilarity = -1;
    let bestEntry: SemanticCacheEntry | null = null;

    for (const entry of entries) {
      const similarity = cosineSimilarity(embedding, entry.embedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestEntry = entry;
      }
    }

    if (bestSimilarity >= SIMILARITY_THRESHOLD && bestEntry) {
      return bestEntry.response;
    }

    return null;
  } catch (error: unknown) {
    console.error("Semantic cache get error:", error);
    return null;
  }
}

/**
 * Store a response in the semantic cache alongside its embedding vector.
 * Maintains a FIFO ring buffer capped at MAX_ENTRIES per organisation.
 */
export async function setSemanticCachedResponse(
  orgId: string,
  message: string,
  response: OrchestratorResponse,
): Promise<void> {
  try {
    if (shouldSkipCache(message)) {
      return;
    }

    if (!isResponseCacheable(response)) {
      return;
    }

    const embedding = await getEmbedding(message);

    if (!embedding) {
      return;
    }

    const key = buildSemanticKey(orgId);
    const existing =
      (await getCachedJson<readonly SemanticCacheEntry[]>(key)) ?? [];

    const newEntry: SemanticCacheEntry = {
      embedding,
      response,
      query: message,
      createdAt: new Date().toISOString(),
    };

    const updated = [...existing, newEntry].slice(-MAX_ENTRIES);

    await setCachedJson(key, updated, SEMANTIC_TTL_SECONDS);
  } catch (error: unknown) {
    console.error("Semantic cache set error:", error);
  }
}
