import "server-only";

/* ------------------------------------------------------------------
 * Schema Router -- selects relevant tool schemas based on keywords
 * in the user's message.
 *
 * Instead of sending all 29 action schemas on every request (~1800
 * tokens), this module scans the message for domain keywords and
 * returns only the schemas that are likely to be needed.
 *
 * The `dashboard` category is always included as a baseline.
 * If no keyword patterns match (ambiguous query), all schemas are
 * returned as a safe fallback.
 *
 * Pure function, no side effects. Category map is computed once at
 * module load time.
 * ------------------------------------------------------------------ */

import type { OpenAITool } from "./types";
import { toOpenAITool } from "./types";
import { getAllActions } from "./actions/registry";

// ---------------------------------------------------------------------------
// Domain categories -- each action name maps to exactly one category
// ---------------------------------------------------------------------------

type Category =
  | "dashboard"
  | "trip"
  | "client"
  | "invoice"
  | "driver"
  | "proposal"
  | "notification"
  | "preference"
  | "report";

const ACTION_CATEGORY_MAP: Readonly<Record<string, Category>> = {
  // dashboard
  get_today_summary: "dashboard",
  get_pending_items: "dashboard",
  get_kpi_snapshot: "dashboard",

  // trip
  search_trips: "trip",
  get_trip_details: "trip",
  get_trip_itinerary: "trip",
  update_trip_status: "trip",
  assign_driver_to_trip: "trip",

  // client
  search_clients: "client",
  get_client_details: "client",
  get_client_history: "client",
  update_client_stage: "client",
  add_client_note: "client",
  update_client_tags: "client",

  // invoice
  search_invoices: "invoice",
  get_invoice_details: "invoice",
  get_overdue_invoices: "invoice",
  mark_invoice_paid: "invoice",
  send_invoice_reminder: "invoice",

  // driver
  search_drivers: "driver",
  get_driver_availability: "driver",

  // proposal
  search_proposals: "proposal",
  get_proposal_details: "proposal",
  send_proposal: "proposal",
  convert_proposal_to_trip: "proposal",

  // notification
  send_whatsapp_message: "notification",
  schedule_followup: "notification",

  // preference
  get_my_preferences: "preference",
  get_preference: "preference",
  set_preference: "preference",
  delete_preference: "preference",

  // report
  generate_report: "report",
};

// ---------------------------------------------------------------------------
// Keyword patterns -- regex to matched categories
// ---------------------------------------------------------------------------

interface KeywordRule {
  readonly pattern: RegExp;
  readonly categories: readonly Category[];
}

const KEYWORD_RULES: readonly KeywordRule[] = [
  {
    pattern: /invoice|payment|overdue|billing|due|paid|amount|balance/i,
    categories: ["invoice", "dashboard"],
  },
  {
    pattern: /trip|travel|itinerary|driver|vehicle|assign|route/i,
    categories: ["trip", "driver"],
  },
  {
    pattern: /client|customer|lead|follow.?up|contact|stage|tag|note/i,
    categories: ["client", "notification"],
  },
  {
    pattern: /proposal|quote|quotation|convert/i,
    categories: ["proposal"],
  },
  {
    pattern: /preference|setting/i,
    categories: ["preference"],
  },
  {
    pattern: /summary|today|dashboard|kpi|stat|report|weekly|monthly/i,
    categories: ["dashboard", "report"],
  },
];

// ---------------------------------------------------------------------------
// Module-level initialization -- build category-to-schemas map once
// ---------------------------------------------------------------------------

const categorySchemaMap: ReadonlyMap<Category, readonly OpenAITool[]> =
  buildCategorySchemaMap();

const allSchemas: readonly OpenAITool[] = getAllActions().map(toOpenAITool);

function buildCategorySchemaMap(): ReadonlyMap<Category, readonly OpenAITool[]> {
  const actions = getAllActions();
  const grouped = new Map<Category, OpenAITool[]>();

  for (const action of actions) {
    const category = ACTION_CATEGORY_MAP[action.name];
    if (category === undefined) {
      continue;
    }

    const existing = grouped.get(category);
    const schema = toOpenAITool(action);

    if (existing) {
      grouped.set(category, [...existing, schema]);
    } else {
      grouped.set(category, [schema]);
    }
  }

  return grouped;
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * Collect the set of categories that match keyword patterns in the message.
 * Always includes `dashboard` as a baseline.
 */
function matchCategories(message: string): ReadonlySet<Category> {
  const matched = new Set<Category>(["dashboard"]);

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(message)) {
      for (const cat of rule.categories) {
        matched.add(cat);
      }
    }
  }

  return matched;
}

/**
 * Gather schemas for the given categories, deduplicating by action name.
 */
function collectSchemas(
  categories: ReadonlySet<Category>,
): readonly OpenAITool[] {
  const seen = new Set<string>();
  const result: OpenAITool[] = [];

  for (const category of categories) {
    const schemas = categorySchemaMap.get(category);
    if (!schemas) {
      continue;
    }

    for (const schema of schemas) {
      if (!seen.has(schema.function.name)) {
        seen.add(schema.function.name);
        result.push(schema);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Select the relevant OpenAI tool schemas for a user message.
 *
 * Scans the message for domain keywords and returns only the schemas
 * whose categories match. The `dashboard` category is always included.
 *
 * If no keyword patterns match (ambiguous query), returns ALL schemas
 * as a safe fallback so the model can still pick the right tool.
 */
export function getRelevantSchemas(message: string): readonly OpenAITool[] {
  const categories = matchCategories(message);

  // Only `dashboard` matched (the always-included baseline) -- no keyword
  // patterns fired, so the query is ambiguous. Return everything.
  if (categories.size === 1 && categories.has("dashboard")) {
    return allSchemas;
  }

  return collectSchemas(categories);
}

/**
 * Count how many specific domain categories (excluding baseline "dashboard")
 * are matched by the message. Returns 0 when intent is ambiguous.
 */
export function getSpecificCategoryCount(message: string): number {
  let count = 0;
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(message)) {
      // Only count if the rule includes at least one non-dashboard category
      const hasSpecific = rule.categories.some((c) => c !== "dashboard");
      if (hasSpecific) count++;
    }
  }
  return count;
}
