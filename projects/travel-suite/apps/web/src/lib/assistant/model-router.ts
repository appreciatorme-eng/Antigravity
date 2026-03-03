import "server-only";

/* ------------------------------------------------------------------
 * Model Router -- selects the optimal OpenAI model per request.
 *
 * Strategy:
 *   - gpt-4o-mini for all free/pro plans (always)
 *   - gpt-4o-mini for simple/short queries on any plan
 *   - gpt-4o for complex analytical queries on enterprise plan only
 *
 * Pure function, no side effects.
 * ------------------------------------------------------------------ */

// ---------------------------------------------------------------------------
// Complexity detection patterns
// ---------------------------------------------------------------------------

const ANALYTICAL_KEYWORDS =
  /\banalyz[ei]\b|\bforecast\b|\bpredict\b|\bstrateg[yi]\b|\boptimiz[ei]\b|\binsight\b|\btrend\b|\bpattern\b/i;

const WHY_PATTERN = /\bwhy\s+(is|are|was|were|did)\b/i;

const HOW_SHOULD_PATTERN = /\bhow\s+should\s+(i|we)\b/i;

const RECOMMEND_PATTERN = /\bwhat.{0,15}recommend\b/i;

const COMPARISON_PATTERN = /\bcompare\b|\bvs\b|\bversus\b/i;

const COMPLEXITY_PATTERNS: readonly RegExp[] = [
  ANALYTICAL_KEYWORDS,
  WHY_PATTERN,
  HOW_SHOULD_PATTERN,
  RECOMMEND_PATTERN,
  COMPARISON_PATTERN,
];

const WORD_COUNT_THRESHOLD = 30;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Determine whether a message is "complex" based on word count and
 * analytical keyword patterns. Pure function, no tier gating.
 */
export function isComplexQuery(message: string): boolean {
  const wordCount = message.split(/\s+/).filter(Boolean).length;
  if (wordCount > WORD_COUNT_THRESHOLD) {
    return true;
  }

  return COMPLEXITY_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Select the optimal OpenAI model for a given message and subscription tier.
 *
 * Only enterprise-tier organisations with complex queries are routed to
 * gpt-4o. All other combinations return gpt-4o-mini.
 */
export function selectModel(
  message: string,
  tier: string,
): "gpt-4o" | "gpt-4o-mini" {
  if (tier === "enterprise" && isComplexQuery(message)) {
    return "gpt-4o";
  }

  return "gpt-4o-mini";
}
