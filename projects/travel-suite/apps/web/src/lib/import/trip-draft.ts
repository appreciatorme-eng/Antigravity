import type { ExtractedTourData } from "@/lib/import/types";
import type {
  Activity,
  Day,
  ExtractedPricing,
  HotelDetails,
  ItineraryResult,
} from "@/types/itinerary";
import {
  ACCOMMODATION_LINE_RE as HOTEL_KEYWORD_RE,
  ACCOMMODATION_PREFIX_RE,
  isLikelyLocationOnly,
  looksLikeHotelName,
  NIGHT_STAY_RE,
  PACKAGE_SECTION_RE,
  stripTrailingLocation,
} from "@/lib/import/hotel-patterns";

export interface ImportedItineraryDraftSourceMeta {
  filename?: string;
  url?: string;
  extraction_confidence?: number;
  source?: string;
}

export interface ImportedAccommodationDraft {
  day_number: number;
  hotel_name: string;
  address?: string;
  check_in_time?: string;
  contact_phone?: string;
  room_type?: string;
  star_rating?: number;
  price_per_night?: number;
  amenities?: string[];
  is_fallback?: boolean;
  coordinates?: { lat: number; lng: number };
}

export interface ImportedItineraryDraft {
  trip_title: string;
  destination: string;
  duration_days: number;
  start_date?: string;
  end_date?: string;
  summary: string;
  days: Day[];
  budget?: string;
  pricing?: ExtractedPricing;
  interests?: string[];
  tips?: string[];
  inclusions?: string[];
  exclusions?: string[];
  accommodations?: ImportedAccommodationDraft[];
  warnings: string[];
  missing_sections: string[];
  source_meta?: ImportedItineraryDraftSourceMeta;
}

type RecordLike = Record<string, unknown>;
export const ACCOMMODATION_FALLBACK = "To be decided by travel operator";
const DAY_HEADER_RE = /\bday\s*0?(\d{1,2})\b/i;
const ACCOMMODATION_LINE_RE = HOTEL_KEYWORD_RE;

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

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(dateString: string, daysToAdd: number): string | undefined {
  const parsed = new Date(`${dateString}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  parsed.setUTCDate(parsed.getUTCDate() + daysToAdd);
  return formatDateOnly(parsed);
}

function toIsoDateString(value: unknown): string | undefined {
  const input = toTrimmedString(value);
  if (!input) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  const slashMatch = input.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (slashMatch) {
    const [, day, month, rawYear] = slashMatch;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const parsed = new Date(`${normalized}T00:00:00.000Z`);
    if (Number.isFinite(parsed.getTime())) return normalized;
  }

  const parsed = new Date(input);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  return formatDateOnly(parsed);
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

function normalizeAccommodation(raw: unknown, fallbackDayNumber: number): ImportedAccommodationDraft | null {
  const record = asRecord(raw);
  if (!record) return null;

  const hotelName =
    toTrimmedString(record.hotel_name) ??
    toTrimmedString(record.name) ??
    toTrimmedString(record.hotel) ??
    toTrimmedString(record.stay);

  if (!hotelName) return null;

  const dayNumber = Math.max(
    1,
    Math.round(
      toFiniteNumber(record.day_number) ??
        toFiniteNumber(record.day) ??
        fallbackDayNumber,
    ),
  );

  return {
    day_number: dayNumber,
    hotel_name: hotelName,
    address: toTrimmedString(record.address) ?? toTrimmedString(record.location),
    check_in_time:
      toTrimmedString(record.check_in_time) ??
      toTrimmedString(record.check_in) ??
      toTrimmedString(record.checkIn),
    contact_phone:
      toTrimmedString(record.contact_phone) ??
      toTrimmedString(record.phone) ??
      toTrimmedString(record.contact),
    room_type: toTrimmedString(record.room_type) ?? toTrimmedString(record.room),
    star_rating: toFiniteNumber(record.star_rating),
    price_per_night: toFiniteNumber(record.price_per_night),
    amenities: normalizeStringList(record.amenities),
    coordinates: normalizeCoordinates(record.coordinates),
    is_fallback: false,
  };
}

function normalizeSourceLines(sourceText: string): string[] {
  return sourceText
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^[\s•▪●○◆◇■□✓✔✦✧★☆→\-–—]+/, "")
        .replace(/^\d{1,2}[.)]\s+/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line.length >= 4);
}

function cleanAccommodationLabel(value: string, cities: ReadonlyArray<string> = []): string {
  const stripped = value
    .replace(/\s*(?:check[- ]?in|check[- ]?out|contact|phone)\s*[:\-].*$/i, "")
    .replace(/\s*\((?:days?|nights?)\s+\d{1,2}(?:\s*(?:,|or|and|&|-)\s*\d{1,2})*[^)]*\)\s*$/i, "")
    .replace(/^[,:;\-–—]+/, "")
    .replace(/[,:;\-–—]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripTrailingLocation(stripped, cities);
}

function isAcceptableHotelLabel(value: string, cities: ReadonlyArray<string> = []): boolean {
  if (value.length < 4) return false;
  if (/^to hotel$/i.test(value)) return false;
  if (/^(airport|station|pickup|drop|breakfast|lunch|dinner|sightseeing|transfer|check)\b/i.test(value)) {
    return false;
  }
  return looksLikeHotelName(value, cities);
}

function extractAccommodationNameFromLine(line: string, cities: ReadonlyArray<string> = []): string | null {
  const prefixed = line.match(ACCOMMODATION_PREFIX_RE);
  if (prefixed?.[1]) {
    const cleaned = cleanAccommodationLabel(prefixed[1], cities);
    return isAcceptableHotelLabel(cleaned, cities) ? cleaned : null;
  }

  const explicitStay = line.match(NIGHT_STAY_RE);
  if (explicitStay?.[2] && HOTEL_KEYWORD_RE.test(explicitStay[2])) {
    const cleaned = cleanAccommodationLabel(explicitStay[2], cities);
    return isAcceptableHotelLabel(cleaned, cities) ? cleaned : null;
  }

  if (!HOTEL_KEYWORD_RE.test(line)) return null;

  const cleaned = cleanAccommodationLabel(line, cities);
  return isAcceptableHotelLabel(cleaned, cities) ? cleaned : null;
}

function extractNightAllocationFromLine(
  line: string,
  cities: ReadonlyArray<string> = [],
): { nights: number; hotel_name: string } | null {
  const match = line.match(
    /^(?:(\d+)\s*night(?:s)?\s+)?(?:stay\s+)?(?:at|in)\s+(.+)$/i,
  );
  if (!match?.[2]) return null;

  const hotelName = cleanAccommodationLabel(match[2], cities);
  if (!isAcceptableHotelLabel(hotelName, cities)) {
    return null;
  }

  return {
    nights: Math.max(1, Number(match[1] || 1)),
    hotel_name: hotelName,
  };
}

function recoverAccommodationHintsFromText(
  sourceText: string,
  totalDays: number,
  cities: ReadonlyArray<string> = [],
): ImportedAccommodationDraft[] {
  const lines = normalizeSourceLines(sourceText);
  if (lines.length === 0 || totalDays <= 0) return [];

  const byDay = new Map<number, ImportedAccommodationDraft>();
  let currentDay: number | null = null;
  let inPackageSection = false;

  lines.forEach((line, index) => {
    if (PACKAGE_SECTION_RE.test(line)) {
      currentDay = null;
      inPackageSection = true;
      return;
    }

    if (inPackageSection) return;

    const dayMatch = line.match(DAY_HEADER_RE);
    if (dayMatch) {
      currentDay = Math.max(1, Number(dayMatch[1]));
    }

    const accommodationName = extractAccommodationNameFromLine(line, cities);
    if (accommodationName && currentDay && !byDay.has(currentDay)) {
      byDay.set(currentDay, {
        day_number: currentDay,
        hotel_name: accommodationName,
        is_fallback: false,
      });
      return;
    }

    if (/^(?:accommodation|hotel(?:\s+details|\s+name)?|stay)$/i.test(line) && currentDay && !byDay.has(currentDay)) {
      const nextLine = lines[index + 1];
      const nextName = nextLine ? extractAccommodationNameFromLine(nextLine, cities) : null;
      if (nextName) {
        byDay.set(currentDay, {
          day_number: currentDay,
          hotel_name: nextName,
          is_fallback: false,
        });
      }
    }
  });

  const nightAllocations = lines
    .map((line) => extractNightAllocationFromLine(line, cities))
    .filter((allocation): allocation is { nights: number; hotel_name: string } => Boolean(allocation));

  let dayCursor = 1;
  for (const allocation of nightAllocations) {
    while (dayCursor <= totalDays && byDay.has(dayCursor)) {
      dayCursor += 1;
    }

    for (let offset = 0; offset < allocation.nights; offset += 1) {
      const dayNumber = dayCursor + offset;
      if (dayNumber > totalDays || byDay.has(dayNumber)) continue;
      byDay.set(dayNumber, {
        day_number: dayNumber,
        hotel_name: allocation.hotel_name,
        is_fallback: false,
      });
    }

    dayCursor += allocation.nights;
  }

  return Array.from(byDay.values()).sort((a, b) => a.day_number - b.day_number);
}

function collectKnownCitiesFromInput(input: unknown): string[] {
  const record = asRecord(input);
  if (!record) return [];

  const cities = new Set<string>();
  const destination = toTrimmedString(record.destination);
  if (destination) {
    destination.split(/[,/]/).forEach((part) => {
      const trimmed = part.trim();
      if (trimmed) cities.add(trimmed);
    });
  }

  if (Array.isArray(record.days)) {
    record.days.forEach((day) => {
      const dayRecord = asRecord(day);
      if (!dayRecord) return;
      const dayLocation =
        toTrimmedString(dayRecord.location) ??
        toTrimmedString(dayRecord.title) ??
        toTrimmedString(dayRecord.theme);
      if (dayLocation) cities.add(dayLocation);
      if (Array.isArray(dayRecord.activities)) {
        dayRecord.activities.forEach((activity) => {
          const activityLocation = toTrimmedString(asRecord(activity)?.location);
          if (activityLocation) cities.add(activityLocation);
        });
      }
    });
  }

  return Array.from(cities);
}

function downgradeCityOnlyHotels(
  accommodations: ImportedAccommodationDraft[],
  cities: ReadonlyArray<string>,
): ImportedAccommodationDraft[] {
  return accommodations.map((accommodation) => {
    const trimmed = accommodation.hotel_name.trim();
    if (!trimmed || trimmed === ACCOMMODATION_FALLBACK) return accommodation;
    if (isLikelyLocationOnly(trimmed, cities)) {
      return {
        ...accommodation,
        hotel_name: ACCOMMODATION_FALLBACK,
        is_fallback: true,
      };
    }
    return accommodation;
  });
}

export function mergeImportedAccommodationHints(input: unknown, sourceText: string): unknown {
  const record = asRecord(input);
  if (!record) return input;

  const cities = collectKnownCitiesFromInput(input);

  const durationDays = Math.max(
    1,
    Math.round(
      toFiniteNumber(record.duration_days) ??
        (Array.isArray(record.days) ? record.days.length : 0) ??
        1,
    ),
  );

  const topLevelAccommodations: unknown[] = Array.isArray(record.accommodations)
    ? [...record.accommodations]
    : [];

  // Downgrade any city-only hotel names already extracted by the AI.
  const downgradedTopLevel = downgradeCityOnlyHotels(
    topLevelAccommodations
      .map((acc, index) => normalizeAccommodation(acc, index + 1))
      .filter((acc): acc is ImportedAccommodationDraft => Boolean(acc)),
    cities,
  );

  const downgradedTopLevelByDay = new Map<number, ImportedAccommodationDraft>();
  for (const acc of downgradedTopLevel) {
    downgradedTopLevelByDay.set(acc.day_number, acc);
  }

  const days = Array.isArray(record.days) ? [...record.days] : [];
  const existingDays = new Set<number>();

  // Validate per-day accommodations and downgrade city-only hotel names.
  days.forEach((day, index) => {
    const dayRecord = asRecord(day);
    if (!dayRecord) return;

    const dayNumber =
      toFiniteNumber(dayRecord.day_number) ?? toFiniteNumber(dayRecord.day) ?? index + 1;
    const normalized = normalizeAccommodation(
      dayRecord.accommodation ?? dayRecord.hotel ?? dayRecord.stay,
      dayNumber,
    );

    if (normalized && !isLikelyLocationOnly(normalized.hotel_name, cities)) {
      existingDays.add(normalized.day_number);
    } else if (normalized) {
      // City-only — strip from the day so the recovery / fallback can re-fill it.
      const { accommodation: _accommodation, hotel: _hotel, stay: _stay, ...rest } = dayRecord;
      void _accommodation;
      void _hotel;
      void _stay;
      days[index] = rest;
    }
  });

  // Carry forward AI-extracted hotels that survived validation.
  const goodTopLevel: ImportedAccommodationDraft[] = [];
  for (const acc of downgradedTopLevel) {
    goodTopLevel.push(acc);
    if (!acc.is_fallback) existingDays.add(acc.day_number);
  }

  // Run regex recovery from the source text only when it's available.
  const recovered = sourceText.trim()
    ? recoverAccommodationHintsFromText(sourceText, durationDays, cities)
    : [];

  for (const accommodation of recovered) {
    if (existingDays.has(accommodation.day_number)) continue;
    goodTopLevel.push(accommodation);
    existingDays.add(accommodation.day_number);

    const dayIndex = accommodation.day_number - 1;
    const dayRecord = asRecord(days[dayIndex]);
    if (dayRecord && !dayRecord.accommodation && !dayRecord.hotel && !dayRecord.stay) {
      days[dayIndex] = {
        ...dayRecord,
        accommodation,
      };
    }
  }

  return {
    ...record,
    accommodations: goodTopLevel,
    days,
  };
}

function dedupeAccommodationsByDay(accommodations: ImportedAccommodationDraft[]): ImportedAccommodationDraft[] {
  const byDay = new Map<number, ImportedAccommodationDraft>();

  for (const accommodation of accommodations) {
    const existing = byDay.get(accommodation.day_number);
    if (!existing || existing.is_fallback) {
      byDay.set(accommodation.day_number, accommodation);
    }
  }

  return Array.from(byDay.values()).sort((a, b) => a.day_number - b.day_number);
}

function buildAccommodationFallback(dayNumber: number): ImportedAccommodationDraft {
  return {
    day_number: dayNumber,
    hotel_name: ACCOMMODATION_FALLBACK,
    check_in_time: "To be confirmed",
    is_fallback: true,
  };
}

function buildLogisticsHotels(accommodations?: ImportedAccommodationDraft[]): HotelDetails[] | undefined {
  const realAccommodations = (accommodations ?? []).filter((accommodation) => !accommodation.is_fallback);
  if (realAccommodations.length === 0) return undefined;

  return realAccommodations.map((accommodation) => ({
    id: `imported-hotel-${accommodation.day_number}`,
    name: accommodation.hotel_name,
    address: accommodation.address ?? accommodation.room_type ?? "Hotel details shared in final confirmation",
    check_in: accommodation.check_in_time ?? "Check-in details to be confirmed",
    check_out: "Check-out details to be confirmed",
    source: "manual",
  }));
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
    date: toIsoDateString(record.date),
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
  if (!draft.accommodations || draft.accommodations.every((accommodation) => accommodation.is_fallback)) {
    missing.push("accommodations");
  }
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
  if (!draft.accommodations || draft.accommodations.every((accommodation) => accommodation.is_fallback)) {
    warnings.push("Hotel details were not found in the import. They can be confirmed by the tour operator later.");
  } else if (draft.accommodations.some((accommodation) => accommodation.is_fallback)) {
    warnings.push("One or more days are missing hotel details and should be confirmed by the tour operator.");
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
  const logisticsHotels = buildLogisticsHotels(draft.accommodations);

  return {
    trip_title: draft.trip_title,
    destination: draft.destination,
    duration_days: draft.duration_days,
    start_date: draft.start_date,
    end_date: draft.end_date,
    summary: draft.summary,
    budget: draft.budget,
    interests: draft.interests,
    tips: draft.tips,
    inclusions: draft.inclusions,
    exclusions: draft.exclusions,
    pricing: draft.pricing,
    accommodations: draft.accommodations,
    logistics: logisticsHotels ? { hotels: logisticsHotels } : undefined,
    days: draft.days,
  };
}

export function importedDraftToItineraryResult(draft: ImportedItineraryDraft): ItineraryResult {
  const logisticsHotels = buildLogisticsHotels(draft.accommodations);

  return {
    trip_title: draft.trip_title,
    destination: draft.destination,
    duration_days: draft.duration_days,
    start_date: draft.start_date,
    end_date: draft.end_date,
    summary: draft.summary,
    days: draft.days,
    budget: draft.budget,
    interests: draft.interests,
    tips: draft.tips,
    inclusions: draft.inclusions,
    exclusions: draft.exclusions,
    extracted_pricing: draft.pricing,
    logistics: logisticsHotels ? { hotels: logisticsHotels } : undefined,
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
  const extractedAccommodations = dedupeAccommodationsByDay([
    ...(Array.isArray(merged.accommodations)
      ? merged.accommodations
          .map((accommodation, index) => normalizeAccommodation(accommodation, index + 1))
          .filter((accommodation): accommodation is ImportedAccommodationDraft => Boolean(accommodation))
      : []),
    ...(Array.isArray(merged.days)
      ? merged.days
          .map((day, index) => {
            const dayRecord = asRecord(day);
            if (!dayRecord) return null;
            return normalizeAccommodation(
              dayRecord.accommodation ?? dayRecord.hotel ?? dayRecord.stay,
              toFiniteNumber(dayRecord.day_number) ?? toFiniteNumber(dayRecord.day) ?? index + 1,
            );
          })
          .filter((accommodation): accommodation is ImportedAccommodationDraft => Boolean(accommodation))
      : []),
  ]);
  const knownCities = collectKnownCitiesFromInput(merged);
  const safeExtracted = downgradeCityOnlyHotels(extractedAccommodations, knownCities);
  const accommodations =
    days.length > 0
      ? days.map((day) => {
          const match = safeExtracted.find(
            (accommodation) => accommodation.day_number === day.day_number,
          );
          if (!match || match.is_fallback) return buildAccommodationFallback(day.day_number);
          return match;
        })
      : safeExtracted;
  const datedDays = days
    .map((day) => day.date)
    .filter((value): value is string => Boolean(value))
    .sort();
  const explicitStartDate =
    toIsoDateString(merged.start_date) ??
    toIsoDateString(merged.trip_start_date) ??
    datedDays[0];
  const explicitEndDate =
    toIsoDateString(merged.end_date) ??
    toIsoDateString(merged.trip_end_date) ??
    datedDays[datedDays.length - 1];
  const computedEndDate =
    explicitStartDate && !explicitEndDate
      ? addDays(explicitStartDate, Math.max(0, (toFiniteNumber(merged.duration_days) ?? durationFallback ?? 1) - 1))
      : explicitEndDate;
  const computedStartDate =
    explicitEndDate && !explicitStartDate
      ? addDays(explicitEndDate, -Math.max(0, (toFiniteNumber(merged.duration_days) ?? durationFallback ?? 1) - 1))
      : explicitStartDate;

  const draftBase = {
    trip_title:
      toTrimmedString(merged.trip_title) ??
      toTrimmedString(merged.title) ??
      toTrimmedString(merged.name) ??
      "Imported itinerary",
    destination: toTrimmedString(merged.destination) ?? "",
    duration_days: Math.max(1, Math.round(toFiniteNumber(merged.duration_days) ?? durationFallback ?? 1)),
    start_date: computedStartDate,
    end_date: computedEndDate,
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
    accommodations,
    source_meta: {
      filename:
        sourceMeta?.filename ??
        toTrimmedString(asRecord(merged.source_meta)?.filename),
      url:
        sourceMeta?.url ??
        toTrimmedString(asRecord(merged.source_meta)?.url),
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
