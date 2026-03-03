import "server-only";

/* ------------------------------------------------------------------
 * Response Cache -- semantic deduplication of LLM responses.
 *
 * Stores full OrchestratorResponse payloads in Redis (via Upstash)
 * so that identical queries within a short window avoid repeated
 * OpenAI calls. Cache keys are scoped per organisation and derived
 * from a normalised + hashed version of the user message.
 *
 * Pure functions for normalisation, hashing, and key building.
 * Async functions for cache I/O never throw -- errors are caught
 * and logged so that cache failures never break the main flow.
 * ------------------------------------------------------------------ */

import { createHash } from "crypto";

import {
  getCachedJson,
  setCachedJson,
  deleteCachedByPrefix,
} from "@/lib/cache/upstash";
import type { OrchestratorResponse } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cache TTL in seconds -- matches context snapshot cache (5 minutes). */
const RESPONSE_CACHE_TTL_SECONDS = 300;

/** Prefix used for all response cache keys. */
const KEY_PREFIX = "assistant:resp";

/** Minimum normalised query length required for caching. */
const MIN_QUERY_LENGTH = 3;

/**
 * Filler words and phrases stripped during normalisation.
 * Sorted longest-first so multi-word phrases are removed before
 * their single-word components.
 */
const FILLER_PHRASES: readonly string[] = [
  "could you",
  "can you",
  "show me",
  "tell me",
  "what are",
  "what is",
  "what's",
  "give me",
  "i want",
  "i need",
  "please",
  "the",
  "an",
  "a",
];

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Strip filler words / phrases and normalise whitespace.
 *
 * 1. Lowercase the input
 * 2. Remove each filler phrase (longest-first to avoid partial matches)
 * 3. Trim and collapse internal whitespace
 */
export function normalizeQuery(raw: string): string {
  let text = raw.toLowerCase();

  for (const filler of FILLER_PHRASES) {
    // Global replace using a RegExp with word boundaries where applicable.
    // For multi-word phrases we use a simple global string replace since
    // word-boundary anchors around spaces can behave unexpectedly.
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
    text = text.replace(pattern, " ");
  }

  return text.trim().replace(/\s+/g, " ");
}

/**
 * Create a short hex hash of the normalised query text.
 * Uses SHA-256 truncated to 16 hex characters (64 bits) -- more
 * than sufficient for cache-key disambiguation within a single org.
 */
export function hashQuery(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

/**
 * Build the full Redis cache key for a given org + message pair.
 *
 * Format: `assistant:resp:<orgId>:<queryHash>`
 */
export function buildCacheKey(orgId: string, message: string): string {
  const normalized = normalizeQuery(message);
  const hash = hashQuery(normalized);
  return `${KEY_PREFIX}:${orgId}:${hash}`;
}

/**
 * Determine whether a message should bypass the response cache.
 *
 * A message is skipped when:
 * - It is too short after normalisation (< 3 chars)
 * - It looks like an action confirmation / proposal trigger
 */
export function shouldSkipCache(message: string): boolean {
  const normalized = normalizeQuery(message);

  if (normalized.length < MIN_QUERY_LENGTH) {
    return true;
  }

  // Action-related keywords that indicate the response will be unique
  // and should not be served from cache.
  const actionPatterns: readonly RegExp[] = [
    /\bconfirm\b/i,
    /\byes\b/i,
    /\bno\b/i,
    /\bcancel\b/i,
    /\bapprove\b/i,
    /\breject\b/i,
    /\bexecute\b/i,
    /\bproceed\b/i,
  ];

  return actionPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Check whether an OrchestratorResponse contains data that should
 * not be cached (action proposals or action results with side effects).
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

// ---------------------------------------------------------------------------
// Cache I/O
// ---------------------------------------------------------------------------

/**
 * Retrieve a cached response for the given org + message pair.
 *
 * Returns `null` on cache miss or if the message should skip caching.
 * Never throws -- errors are caught and logged.
 */
export async function getCachedResponse(
  orgId: string,
  message: string,
): Promise<OrchestratorResponse | null> {
  try {
    if (shouldSkipCache(message)) {
      return null;
    }

    const key = buildCacheKey(orgId, message);
    return await getCachedJson<OrchestratorResponse>(key);
  } catch (error: unknown) {
    console.error("Response cache get error:", error);
    return null;
  }
}

/**
 * Store a response in the cache for the given org + message pair.
 *
 * Silently skips storage when:
 * - The message should skip caching
 * - The response contains an action proposal
 * - The response contains an action result with affected entities
 *
 * Never throws -- errors are caught and logged.
 */
export async function setCachedResponse(
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

    const key = buildCacheKey(orgId, message);
    await setCachedJson(key, response, RESPONSE_CACHE_TTL_SECONDS);
  } catch (error: unknown) {
    console.error("Response cache set error:", error);
  }
}

/**
 * Invalidate all cached responses for an organisation.
 *
 * Typically called after a write action completes so that stale
 * read-only responses are not served from cache.
 *
 * Never throws -- errors are caught and logged.
 */
export async function invalidateOrgCache(orgId: string): Promise<void> {
  try {
    const prefix = `${KEY_PREFIX}:${orgId}:`;
    await deleteCachedByPrefix(prefix);
  } catch (error: unknown) {
    console.error("Response cache invalidation error:", error);
  }
}
