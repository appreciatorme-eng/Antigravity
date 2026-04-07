import type { ExtractedTourData } from "@/lib/import/types";
import type {
  Activity,
  Day,
  ExtractedPricing,
  ItineraryResult,
} from "@/types/itinerary";

export interface ImportedItineraryDraftSourceMeta {
  filename?: string;
  extraction_confidence?: number;
  source?: string;
}

export interface ImportedItineraryDraft {
  trip_title: string;
  destination: string;
  duration_days: number;
  summary: string;
  days: Day[];
  budget?: string;
  pricing?: ExtractedPricing;
  interests?: string[];
  tips?: string[];
  inclusions?: string[];
  exclusions?: string[];
  warnings: string[];
  missing_sections: string[];
  source_meta?: ImportedItineraryDraftSourceMeta;
}

type RecordLike = Record<string, unknown>;

function asRecord(value: unknown): RecordLike | null {
  return value && typeof value === "object" ? (value as RecordLike) : null;
}

function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value
    .map((item) => toTrimmedString(item))
    .filter((item): item is string => Boolean(item));
  return list.length > 0 ? Array.from(new Set(list)) : undefined;
}

function normalizeCoordinates(value: unknown): { lat: number; lng: number } | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const lat = toFiniteNumber(record.lat);
  const lng = toFiniteNumber(record.lng);
  if (lat === undefined || lng === undefined) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  if (lat === 0 && lng === 0) return undefined;
  return { lat, lng };
}

function formatCost(price: number, currency?: string): string {
  const code = currency?.trim().toUpperCase();
  if (!code || code === "USD") return `$${price}`;
  if (code === "INR") return `₹${price}`;
  return `${code} ${price}`;
}

function normalizePricing(raw: RecordLike | null, basePrice?: number): ExtractedPricing | undefined {
  const priceSource = raw ?? {};
  const pricing: ExtractedPricing = {
    per_person_cost: toFiniteNumber(priceSource.per_person_cost),
    total_cost: toFiniteNumber(priceSource.total_cost),
    currency: toTrimmedString(priceSource.currency),
    pax_count: toFiniteNumber(priceSource.pax_count),
    notes: toTrimmedString(priceSource.notes),
  };

  if (
    pricing.per_person_cost === undefined &&
    pricing.total_cost === undefined &&
    pricing.currency === undefined &&
    pricing.pax_count === undefined &&
    pricing.notes === undefined &&
    basePrice !== undefined
  ) {
    pricing.per_person_cost = basePrice;
  }

  const hasValue = Object.values(pricing).some((value) => value !== undefined);
  return hasValue ? pricing : undefined;
}

function normalizeActivity(raw: unknown, pricing?: ExtractedPricing): Activity | null {
  const record = asRecord(raw);
  if (!record) return null;

  const title =
    toTrimmedString(record.title) ??
    toTrimmedString(record.name) ??
    toTrimmedString(record.activity);
  if (!title) return null;

  const numericPrice = toFiniteNumber(record.price);

  return {
    time: toTrimmedString(record.time) ?? "TBD",
    title,
    description: toTrimmedString(record.description) ?? "",
    location: toTrimmedString(record.location) ?? "",
    coordinates: normalizeCoordinates(record.coordinates),
    duration: toTrimmedString(record.duration),
    cost:
      toTrimmedString(record.cost) ??
      (numericPrice !== undefined ? formatCost(numericPrice, pricing?.currency) : undefined),
    transport: toTrimmedString(record.transport),
    image: toTrimmedString(record.image) ?? toTrimmedString(record.imageUrl),
  };
}

function normalizeDay(raw: unknown, index: number, pricing?: ExtractedPricing): Day | null {
  const record = asRecord(raw);
  if (!record) return null;

  const activities = Array.isArray(record.activities)
    ? record.activities
        .map((activity) => normalizeActivity(activity, pricing))
        .filter((activity): activity is Activity => Boolean(activity))
    : [];

  const dayNumber = toFiniteNumber(record.day_number) ?? toFiniteNumber(record.day) ?? index + 1;
  const theme =
    toTrimmedString(record.theme) ??
    toTrimmedString(record.title) ??
    `Day ${dayNumber}`;

  return {
    day_number: Math.max(1, Math.round(dayNumber)),
    day: Math.max(1, Math.round(dayNumber)),
    theme,
    title: toTrimmedString(record.title) ?? theme,
    summary: toTrimmedString(record.summary) ?? toTrimmedString(record.description),
    activities,
  };
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildMissingSections(draft: Omit<ImportedItineraryDraft, "warnings" | "missing_sections">): string[] {
  const missing: string[] = [];

  if (!draft.budget) missing.push("budget");
  if (!draft.pricing) missing.push("pricing");
  if (!draft.interests || draft.interests.length === 0) missing.push("interests");
  if (!draft.tips || draft.tips.length === 0) missing.push("tips");
  if (!draft.inclusions || draft.inclusions.length === 0) missing.push("inclusions");
  if (!draft.exclusions || draft.exclusions.length === 0) missing.push("exclusions");
  if (draft.days.length === 0) missing.push("days");

  return missing;
}

function buildWarnings(
  draft: Omit<ImportedItineraryDraft, "warnings" | "missing_sections">,
  existingWarnings: string[],
): string[] {
  const warnings = [...existingWarnings];

  if (!draft.pricing) {
    warnings.push("Pricing was not extracted. Review and enter package pricing manually if needed.");
  }
  if (!draft.inclusions || draft.inclusions.length === 0) {
    warnings.push("Inclusions are missing from the extraction.");
  }
  if (!draft.exclusions || draft.exclusions.length === 0) {
    warnings.push("Exclusions are missing from the extraction.");
  }
  if (draft.days.length === 0) {
    warnings.push("No valid itinerary days were extracted from this brochure.");
  } else if (draft.days.some((day) => day.activities.length === 0)) {
    warnings.push("One or more days have no activities and should be reviewed before creating the trip.");
  }

  return dedupe(warnings);
}

export function getImportedItineraryDraftErrors(draft: ImportedItineraryDraft): string[] {
  const errors: string[] = [];

  if (!draft.trip_title.trim()) {
    errors.push("Trip title is required.");
  }
  if (!draft.destination.trim()) {
    errors.push("Destination is required.");
  }
  if (draft.days.length === 0) {
    errors.push("At least one day is required.");
  }
  if (!draft.days.some((day) => day.activities.length > 0)) {
    errors.push("At least one day must include an activity.");
  }

  return errors;
}

export function buildItineraryRawDataFromDraft(draft: ImportedItineraryDraft) {
  return {
    trip_title: draft.trip_title,
    destination: draft.destination,
    duration_days: draft.duration_days,
    summary: draft.summary,
    budget: draft.budget,
    interests: draft.interests,
    tips: draft.tips,
    inclusions: draft.inclusions,
    exclusions: draft.exclusions,
    pricing: draft.pricing,
    days: draft.days,
  };
}

export function importedDraftToItineraryResult(draft: ImportedItineraryDraft): ItineraryResult {
  return {
    trip_title: draft.trip_title,
    destination: draft.destination,
    duration_days: draft.duration_days,
    summary: draft.summary,
    days: draft.days,
    budget: draft.budget,
    interests: draft.interests,
    tips: draft.tips,
    inclusions: draft.inclusions,
    exclusions: draft.exclusions,
    extracted_pricing: draft.pricing,
  };
}

export function normalizeImportedItineraryDraft(
  input: unknown,
  sourceMeta?: ImportedItineraryDraftSourceMeta,
): ImportedItineraryDraft {
  const record = asRecord(input);
  const rawData = asRecord(record?.raw_data);
  const merged = { ...(rawData ?? {}), ...(record ?? {}) };

  const warnings = normalizeStringList(merged.warnings) ?? [];
  const missingSections = normalizeStringList(merged.missing_sections) ?? [];
  const durationFallback = Array.isArray(merged.days) ? merged.days.length : undefined;
  const pricing = normalizePricing(
    asRecord(merged.pricing) ?? asRecord(merged.extracted_pricing),
    toFiniteNumber((record as ExtractedTourData | null)?.base_price),
  );
  const days = Array.isArray(merged.days)
    ? merged.days
        .map((day, index) => normalizeDay(day, index, pricing))
        .filter((day): day is Day => Boolean(day))
        .sort((a, b) => a.day_number - b.day_number)
    : [];

  const draftBase = {
    trip_title:
      toTrimmedString(merged.trip_title) ??
      toTrimmedString(merged.title) ??
      toTrimmedString(merged.name) ??
      "Imported itinerary",
    destination: toTrimmedString(merged.destination) ?? "",
    duration_days: Math.max(1, Math.round(toFiniteNumber(merged.duration_days) ?? durationFallback ?? 1)),
    summary:
      toTrimmedString(merged.summary) ??
      toTrimmedString(merged.description) ??
      "",
    days,
    budget: toTrimmedString(merged.budget),
    pricing,
    interests: normalizeStringList(merged.interests),
    tips: normalizeStringList(merged.tips),
    inclusions: normalizeStringList(merged.inclusions),
    exclusions: normalizeStringList(merged.exclusions),
    source_meta: {
      filename:
        sourceMeta?.filename ??
        toTrimmedString(asRecord(merged.source_meta)?.filename),
      extraction_confidence:
        sourceMeta?.extraction_confidence ??
        toFiniteNumber(asRecord(merged.source_meta)?.extraction_confidence),
      source:
        sourceMeta?.source ??
        toTrimmedString(asRecord(merged.source_meta)?.source),
    },
  };

  const normalizedMissingSections = dedupe([
    ...missingSections,
    ...buildMissingSections(draftBase),
  ]);

  return {
    ...draftBase,
    warnings: buildWarnings(draftBase, warnings),
    missing_sections: normalizedMissingSections,
  };
}
