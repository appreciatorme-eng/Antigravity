import "server-only";

import dns from "node:dns/promises";
import net from "node:net";

import * as cheerio from "cheerio";
import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";

import { logError } from "@/lib/observability/logger";
import { extractTourFromPDF } from "@/lib/import/pdf-extractor";
import {
  mergeImportedAccommodationHints,
  normalizeImportedItineraryDraft,
  type ImportedItineraryDraft,
  type ImportedItineraryDraftSourceMeta,
} from "@/lib/import/trip-draft";
import { geocodeItineraryDraft } from "@/lib/import/geocode-itinerary";

const IMPORT_TEXT_MIN_LENGTH = 50;
const IMPORT_TEXT_MAX_LENGTH = 30000;
const HTML_IMPORT_MAX_LENGTH = 30000;
const FALLBACK_SECTION_HEADERS = {
  inclusions: /^(?:[✅✓✔+\-\s]*)?(?:package\s+)?(?:inclusions?|includes?|tour\s+cost\s+includes?|cost\s+includes?|included)\b/i,
  exclusions: /^(?:[❌✕xX\-\s]*)?(?:package\s+)?(?:exclusions?|excludes?|tour\s+cost\s+excludes?|cost\s+excludes?|not\s+included)\b/i,
};
const FALLBACK_STOP_SECTION_RE =
  /^(?:day\s*\d+|itinerary|terms?|payment|notes?|important|booking|cancellation|pricing|price\s+summary|cost\s+summary)\b/i;
const DAY_MARKER_RE =
  /\b(?:day\s*[-:]?\s*0?\d{1,2}|d\s*[-:]?\s*0?\d{1,2}|0?\d{1,2}(?:st|nd|rd|th)\s+day)\b/gi;
const ROUTE_ARROW_RE = /\s*(?:→|->|=>|-->|–|—| to )\s*/i;

export interface TripImportDraftResult {
  success: boolean;
  draft?: ImportedItineraryDraft;
  error?: string;
  originalUrl?: string;
}

function getGeminiKey(apiKey?: string) {
  return (
    apiKey ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY
  );
}

function cleanJsonResponse(text: string): string {
  let jsonText = text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return jsonText.trim();
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanFallbackLine(line: string): string {
  return line
    .replace(/^[\s•\-*–—✅✓✔❌✕xX]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getFallbackLines(text: string): string[] {
  return text
    .replace(DAY_MARKER_RE, (match, offset, source) => {
      if (offset === 0) return match;

      const before = source.slice(Math.max(0, offset - 8), offset);
      const previousNonSpace = before.trimEnd().slice(-1);
      if (previousNonSpace === "(" || /\bor\s*$/i.test(before)) return match;

      return `\n${match}`;
    })
    .split(/\r?\n/)
    .map(cleanFallbackLine)
    .filter((line) => line.length > 0);
}

function fallbackSectionForLine(line: string): "inclusions" | "exclusions" | null {
  if (FALLBACK_SECTION_HEADERS.inclusions.test(line)) return "inclusions";
  if (FALLBACK_SECTION_HEADERS.exclusions.test(line)) return "exclusions";
  return null;
}

function isFallbackSectionBoundary(line: string): boolean {
  return Boolean(fallbackSectionForLine(line)) || FALLBACK_STOP_SECTION_RE.test(line);
}

function extractFallbackPackageSection(
  lines: string[],
  section: "inclusions" | "exclusions",
): string[] {
  const items: string[] = [];
  let collecting = false;

  for (const line of lines) {
    const currentSection = fallbackSectionForLine(line);
    if (currentSection) {
      collecting = currentSection === section;
      continue;
    }

    if (!collecting) continue;
    if (isFallbackSectionBoundary(line)) break;

    const cleaned = cleanFallbackLine(line);
    if (cleaned.length > 2) {
      items.push(cleaned);
    }
  }

  return Array.from(new Set(items));
}

function extractFallbackDurationDays(text: string, dayCount: number): number {
  const nightsDaysMatch = text.match(/(\d{1,2})[ \t]*(?:nights?|n)[ \t]*[\/+&-][ \t]*(\d{1,2})[ \t]*(?:days?|d)\b/i);
  if (nightsDaysMatch?.[2]) return Number(nightsDaysMatch[2]);

  if (dayCount >= 2) return dayCount;

  const daysMatch = text.match(/\b(\d{1,2})[ \t]*(?:days?|d)\b/i);
  if (daysMatch?.[1]) return Number(daysMatch[1]);

  const nightsMatch = text.match(/\b(\d{1,2})[ \t]*(?:nights?|n)\b/i);
  if (nightsMatch?.[1]) return Number(nightsMatch[1]) + 1;

  return Math.max(1, dayCount);
}

function extractFallbackTitle(lines: string[]): string {
  const title = lines.find((line) => {
    if (fallbackSectionForLine(line)) return false;
    if (FALLBACK_STOP_SECTION_RE.test(line)) return false;
    if (/^(?:date|duration|price|cost|pax|contact|phone|email)\b/i.test(line)) return false;
    return line.length >= 6 && line.length <= 120;
  });

  return title ?? "Imported itinerary";
}

function extractFallbackDestination(title: string, lines: string[]): string {
  const destinationLine =
    lines.find((line) => /\b(?:destination|location|route)\b\s*[:\-]/i.test(line)) ??
    lines.find((line) => /\b(?:india|thailand|singapore|dubai|bali|kashmir|srinagar|pahalgam|gulmarg|jammu|sonamarg)\b/i.test(line));

  if (destinationLine) {
    const [, value] = destinationLine.split(/[:\-]/, 2);
    return cleanFallbackLine(value ?? destinationLine).slice(0, 90);
  }

  return title;
}

function detectFallbackDayHeader(line: string): { dayNumber: number; title: string } | null {
  const explicit =
    line.match(/^(?:day|d)\s*[-:]?\s*0?(\d{1,2})(?:\s*[:\-–—]\s*|\s+)?(.*)$/i) ??
    line.match(/^0?(\d{1,2})(?:st|nd|rd|th)\s+day(?:\s*[:\-–—]\s*|\s+)?(.*)$/i) ??
    line.match(/^day\s*0?(\d{1,2})\s*\/\s*(.*)$/i) ??
    line.match(/^0?(\d{1,2})[\).]\s+(.+)$/i);

  if (explicit?.[1]) {
    const title = cleanFallbackLine(explicit[2] || `Day ${Number(explicit[1])}`);
    if (/^\d/.test(line) && !looksLikeItineraryLine(title)) return null;

    return {
      dayNumber: Number(explicit[1]),
      title: title || `Day ${Number(explicit[1])}`,
    };
  }

  return null;
}

function looksLikeItineraryLine(line: string): boolean {
  if (line.length < 4 || line.length > 140) return false;
  if (/^(?:inclusions?|exclusions?|price|cost|payment|terms?|notes?|contact|phone|email)\b/i.test(line)) return false;
  return (
    ROUTE_ARROW_RE.test(line) ||
    /\b(?:arrival|arrive|departure|depart|airport|station|transfer|drive|visit|sightseeing|excursion|darshan|trek|check[- ]?in|local|tour|temple|lake|valley|garden|hotel|stay)\b/i.test(line)
  );
}

function inferRouteTitle(line: string): string | null {
  if (line.length > 110) return null;
  if (!ROUTE_ARROW_RE.test(line)) return null;
  if (/^(?:transport(?:ation)?|airfare|train|pony|horse|entry|personal|camera|travel insurance)\b/i.test(line)) return null;

  const parts = line
    .split(ROUTE_ARROW_RE)
    .map(cleanFallbackLine)
    .filter(Boolean);
  if (parts.length < 2 || parts.length > 5) return null;
  if (parts.some((part) => part.length < 3 || part.length > 45)) return null;

  return parts.join(" to ");
}

function inferMilestoneTitle(line: string): string | null {
  if (!looksLikeItineraryLine(line)) return null;
  if (/^(?:transport(?:ation)?|airfare|train|pony|horse|entry|personal|camera|travel insurance)\b/i.test(line)) return null;
  return line.length > 90 ? `${line.slice(0, 87)}...` : line;
}

function extractFallbackDays(lines: string[]) {
  const sections: Array<{ dayNumber: number; title: string; lines: string[]; inferred?: boolean }> = [];
  let current: { dayNumber: number; title: string; lines: string[]; inferred?: boolean } | null = null;
  let inferredDayNumber = 1;
  let inPackageSection = false;

  for (const line of lines) {
    const section = fallbackSectionForLine(line);
    if (section) {
      if (current || sections.length > 0) {
        if (current) sections.push(current);
        current = null;
        break;
      }

      inPackageSection = true;
      continue;
    }

    if (inPackageSection && isFallbackSectionBoundary(line)) {
      inPackageSection = false;
    }

    if (inPackageSection) continue;

    const header = detectFallbackDayHeader(line);
    if (header) {
      if (current) sections.push(current);
      current = { ...header, lines: [], inferred: false };
      inferredDayNumber = Math.max(inferredDayNumber, header.dayNumber + 1);
      continue;
    }

    const routeTitle = !inPackageSection ? inferRouteTitle(line) : null;
    if (routeTitle && (!current || (current.inferred && current.lines.length > 0))) {
      if (current) sections.push(current);
      current = { dayNumber: inferredDayNumber, title: routeTitle, lines: [line], inferred: true };
      inferredDayNumber += 1;
      continue;
    }

    const milestoneTitle = !inPackageSection ? inferMilestoneTitle(line) : null;
    if (!routeTitle && milestoneTitle && (!current || (current.inferred && current.lines.length > 0))) {
      if (current) sections.push(current);
      current = { dayNumber: inferredDayNumber, title: milestoneTitle, lines: [line], inferred: true };
      inferredDayNumber += 1;
      continue;
    }

    if (current) current.lines.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

function countValidDays(value: unknown): number {
  if (!value || typeof value !== "object") return 0;
  const days = (value as { days?: unknown }).days;
  return Array.isArray(days) ? days.length : 0;
}

function shouldPreferFallbackDays(extracted: unknown, fallback: unknown): boolean {
  const extractedDays = countValidDays(extracted);
  const fallbackDays = countValidDays(fallback);
  if (fallbackDays <= 1) return false;
  if (extractedDays <= 1 && fallbackDays > extractedDays) return true;
  return fallbackDays >= extractedDays + 2;
}

function mergeFallbackStructureIntoExtracted(extracted: unknown, fallback: unknown): unknown {
  if (!shouldPreferFallbackDays(extracted, fallback)) return extracted;
  if (!extracted || typeof extracted !== "object" || !fallback || typeof fallback !== "object") return fallback;

  const extractedRecord = extracted as Record<string, unknown>;
  const fallbackRecord = fallback as Record<string, unknown>;

  return {
    ...extractedRecord,
    duration_days: fallbackRecord.duration_days ?? extractedRecord.duration_days,
    days: fallbackRecord.days,
    inclusions:
      Array.isArray(extractedRecord.inclusions) && extractedRecord.inclusions.length > 0
        ? extractedRecord.inclusions
        : fallbackRecord.inclusions,
    exclusions:
      Array.isArray(extractedRecord.exclusions) && extractedRecord.exclusions.length > 0
        ? extractedRecord.exclusions
        : fallbackRecord.exclusions,
    warnings: [
      ...((Array.isArray(extractedRecord.warnings) ? extractedRecord.warnings : []) as unknown[]),
      "TripBuilt repaired the imported day structure from the pasted text because AI extraction missed itinerary days.",
    ],
  };
}

function lineLooksLikeFallbackActivity(line: string): boolean {
  if (fallbackSectionForLine(line) || FALLBACK_STOP_SECTION_RE.test(line)) return false;
  if (/^(?:accommodation|hotel|stay|lodging|inclusion|exclusion|price|cost|meal|transportation?)\b/i.test(line)) return false;
  return line.length >= 4;
}

export function buildFallbackTourDraftFromText(text: string): unknown {
  const lines = getFallbackLines(text);
  const title = extractFallbackTitle(lines);
  const daySections = extractFallbackDays(lines);
  const destination = extractFallbackDestination(title, lines);
  const durationDays = extractFallbackDurationDays(text, daySections.length);
  const inclusions = extractFallbackPackageSection(lines, "inclusions");
  const exclusions = extractFallbackPackageSection(lines, "exclusions");
  const summaryLine = lines.find((line) => line !== title && line.length > 20 && !isFallbackSectionBoundary(line));
  const expandedDaySections =
    daySections.length > 0
      ? Array.from({ length: Math.max(durationDays, Math.max(...daySections.map((day) => day.dayNumber))) }, (_, index) => {
          const dayNumber = index + 1;
          return (
            daySections.find((day) => day.dayNumber === dayNumber) ?? {
              dayNumber,
              title: `Day ${dayNumber}`,
              lines: [],
            }
          );
        })
      : [];
  const daySource =
    expandedDaySections.length > 0
      ? expandedDaySections
      : [
          {
            dayNumber: 1,
            title: "Trip overview",
            lines: lines.filter(lineLooksLikeFallbackActivity).slice(0, 4),
          },
        ];

  return {
    trip_title: title,
    destination,
    duration_days: Math.max(1, durationDays),
    summary:
      summaryLine ??
      "Imported from pasted itinerary text. Review the generated structure before creating the trip.",
    inclusions,
    exclusions,
    days: daySource.map((day) => {
      const activityLines = day.lines.filter(lineLooksLikeFallbackActivity);
      const activityTitle = activityLines[0] ?? day.title;

      return {
        day_number: day.dayNumber,
        title: day.title,
        description: activityLines[0] ?? "",
        activities: activityLines.slice(0, 5).map((line, index) => ({
          time: index === 0 ? "TBD" : "Flexible",
          title: line.length > 90 ? `${line.slice(0, 87)}...` : line,
          description: line,
          location: destination,
        })),
        ...(activityLines.length === 0
          ? {
              activities: [
                {
                  time: "TBD",
                  title: activityTitle,
                  description: "Review imported itinerary details with the tour operator.",
                  location: destination,
                },
              ],
            }
          : {}),
      };
    }),
    warnings: [
      "AI extraction was unavailable, so TripBuilt created a fallback draft from the pasted text. Review before creating the trip.",
    ],
  };
}

function isPrivateIp(address: string): boolean {
  const normalized = address.trim().toLowerCase();
  const version = net.isIP(normalized);

  if (version === 4) {
    if (normalized === "0.0.0.0") return true;
    if (normalized.startsWith("127.")) return true;
    if (normalized.startsWith("10.")) return true;
    if (normalized.startsWith("192.168.")) return true;
    if (normalized.startsWith("169.254.")) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
    return false;
  }

  if (version === 6) {
    if (normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (normalized.startsWith("fe80:")) return true;
    if (normalized.startsWith("::ffff:127.")) return true;
    if (normalized.startsWith("::ffff:10.")) return true;
    if (normalized.startsWith("::ffff:192.168.")) return true;
    if (normalized.startsWith("::ffff:169.254.")) return true;
    if (/^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
    return false;
  }

  return true;
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "localhost" || normalized.endsWith(".local")) return true;
  if (net.isIP(normalized) !== 0) return isPrivateIp(normalized);
  return false;
}

async function isSafePublicUrl(target: URL): Promise<boolean> {
  if (isPrivateOrLocalHost(target.hostname)) {
    return false;
  }

  try {
    const resolved = await dns.lookup(target.hostname, { all: true, verbatim: true });
    if (resolved.length === 0) {
      return false;
    }

    return resolved.every((entry) => !isPrivateIp(entry.address));
  } catch {
    return false;
  }
}

export function looksLikePdfUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /\.pdf(?:$|[?#])/i.test(parsed.pathname + parsed.search + parsed.hash);
  } catch {
    return false;
  }
}

function isPdfContentType(contentType: string | null): boolean {
  return (contentType ?? "").toLowerCase().includes("application/pdf");
}

function getFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.split("/").filter(Boolean).pop();
    if (!pathname) return "brochure.pdf";
    const decoded = decodeURIComponent(pathname);
    return decoded.toLowerCase().endsWith(".pdf") ? decoded : `${decoded}.pdf`;
  } catch {
    return "brochure.pdf";
  }
}

export function extractImportTextFromHtml(html: string): string {
  const $ = cheerio.load(html);

  $("nav, footer, header, script, style, noscript, svg, img, iframe, form, aside").remove();

  const title = normalizeWhitespace($("title").first().text());
  const metaDescription = normalizeWhitespace(
    $('meta[name="description"]').attr("content") ??
      $('meta[property="og:description"]').attr("content") ??
      "",
  );
  const mainText = normalizeWhitespace(
    $("main").first().text() ||
      $("article").first().text() ||
      $('[role="main"]').first().text() ||
      $("body").text(),
  );

  return normalizeWhitespace([title, metaDescription, mainText].filter(Boolean).join(" "));
}

const TOUR_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    destination: { type: SchemaType.STRING },
    duration_days: { type: SchemaType.INTEGER },
    start_date: { type: SchemaType.STRING },
    end_date: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    base_price: { type: SchemaType.NUMBER },
    budget: { type: SchemaType.STRING },
    interests: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    tips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    inclusions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    exclusions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    pricing: {
      type: SchemaType.OBJECT,
      properties: {
        per_person_cost: { type: SchemaType.NUMBER },
        total_cost: { type: SchemaType.NUMBER },
        currency: { type: SchemaType.STRING },
        pax_count: { type: SchemaType.INTEGER },
        notes: { type: SchemaType.STRING },
      },
    },
    days: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          day_number: { type: SchemaType.INTEGER },
          date: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          accommodation: {
            type: SchemaType.OBJECT,
            properties: {
              hotel_name: { type: SchemaType.STRING },
              star_rating: { type: SchemaType.INTEGER },
              room_type: { type: SchemaType.STRING },
              price_per_night: { type: SchemaType.NUMBER },
              amenities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ["hotel_name"],
          },
          activities: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                time: { type: SchemaType.STRING },
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                location: { type: SchemaType.STRING },
                price: { type: SchemaType.NUMBER },
                is_optional: { type: SchemaType.BOOLEAN },
                is_premium: { type: SchemaType.BOOLEAN },
              },
              required: ["title"],
            },
          },
        },
        required: ["day_number", "title", "activities"],
      },
    },
  },
  required: ["name", "destination", "duration_days", "days"],
};

const HOTEL_FALLBACK_PHRASE = "To be decided by travel operator";

const EXTRACTION_PROMPT_HEADER = `You are a tour itinerary extraction expert for a premium B2B travel operations product used by Indian tour operators (Kashmir, Goa, Kerala, Rajasthan, Himachal patterns dominate).

Your goal: parse brochure / pasted itinerary / website text into a clean structured tour object that an operator can save with zero manual fixups.

CRITICAL RULES (in priority order):

1. HOTEL vs LOCATION DISAMBIGUATION
   - A HOTEL NAME is a proper noun like "Hotel Heevan", "The Lalit Grand", "Vivanta by Taj", "WelcomHotel Pine N Peak", "Khyber Resort & Spa", "Houseboat New Bombay Palace".
   - A LOCATION is a city / region / place like "Pahalgam", "Srinagar", "Gulmarg", "Goa", "Munnar".
   - NEVER put a city / location name into accommodation.hotel_name. "Overnight at Pahalgam" means the city, not a hotel.
   - If a line says "overnight at Hotel X in Pahalgam", the hotel_name is "Hotel X" (drop the city).

2. MULTI-SOURCE HOTEL EXTRACTION
   - Hotels can be mentioned in: day titles, day descriptions, inclusions, package notes, a separate "Hotels" section, or "Accommodation" tables.
   - Search ALL of these. Match each hotel to the day(s) it applies to.
   - If a hotels table lists "Day 1-3: Hotel Heevan, Day 4-5: Hotel Hilltop", assign Hotel Heevan to days 1, 2, 3 and Hotel Hilltop to days 4 and 5.

3. MULTI-NIGHT ALLOCATION
   - "3 nights at Hotel X" → set hotel_name="Hotel X" on 3 consecutive days starting at the right day.
   - "2N Srinagar / 2N Pahalgam / 1N Gulmarg" with hotels per city → map each city's hotel to its night-block days.

4. EXPLICIT FALLBACK FOR MISSING HOTELS
   - If after exhaustive search NO hotel is identifiable for a day, set accommodation.hotel_name="${HOTEL_FALLBACK_PHRASE}".
   - DO NOT leave the accommodation field empty for any day. Every day MUST have an accommodation object.
   - The last day (departure / checkout) may also use this fallback if no hotel is mentioned.

5. ACTIVITY LOCATIONS
   - For every activity, set location to the most specific geocodable place name (e.g., "Dal Lake, Srinagar" not "lake").
   - If unclear, use the city the day takes place in.

6. NEVER INVENT
   - Only return days, activities, hotels, and prices that are supported by the source text.
   - Use numeric prices only (no currency symbols inside numbers — use the pricing.currency field).
   - Use YYYY-MM-DD for any explicit dates.

FEW-SHOT EXAMPLE

Source:
"""
Kashmir Paradise 5N/6D
Day 1: Arrival Srinagar - Transfer to hotel - Shikara ride on Dal Lake. Overnight at Hotel Heevan.
Day 2: Srinagar to Pahalgam (90 km) - Sightseeing - Stay at WelcomHotel Pine N Peak.
Day 3: Pahalgam local - Aru valley, Betaab valley. Same hotel as previous day.
Day 4: Pahalgam to Gulmarg - Gondola ride. Overnight at Khyber Himalayan Resort.
Day 5: Gulmarg to Sonmarg day trip back to Srinagar. Houseboat New Bombay Palace.
Day 6: Departure.
Inclusions: 5 nights accommodation, daily breakfast, sedan transfers.
Per person ₹35,000 (twin sharing, 2 pax).
"""

Expected days[*].accommodation.hotel_name:
- Day 1: "Hotel Heevan"
- Day 2: "WelcomHotel Pine N Peak"
- Day 3: "WelcomHotel Pine N Peak"   (same hotel as previous day)
- Day 4: "Khyber Himalayan Resort"
- Day 5: "Houseboat New Bombay Palace"
- Day 6: "${HOTEL_FALLBACK_PHRASE}"   (departure day, no overnight)

Notice "Pahalgam" and "Srinagar" never appear as hotel_name — they are locations.
`;

async function extractStructuredTourFromText(text: string, apiKey?: string): Promise<unknown> {
  const key = getGeminiKey(apiKey);
  if (!key) {
    throw new Error("Missing Gemini API key. Set GOOGLE_API_KEY (recommended) in your environment.");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: TOUR_RESPONSE_SCHEMA,
      temperature: 0.1,
    },
  });

  const prompt = `${EXTRACTION_PROMPT_HEADER}

Now extract from this source text:
"""
${text}
"""`;

  const result = await model.generateContent(prompt);
  return JSON.parse(cleanJsonResponse(result.response.text()));
}

export async function importTripDraftFromPdf(
  file: File | Blob,
  sourceMeta?: ImportedItineraryDraftSourceMeta,
): Promise<TripImportDraftResult> {
  const extraction = await extractTourFromPDF(file);
  if (!extraction.success || !extraction.data) {
    return {
      success: false,
      error: extraction.error || "Failed to extract itinerary from PDF",
    };
  }

  const draft = normalizeImportedItineraryDraft(extraction.data, sourceMeta);
  const geocoded = await geocodeItineraryDraft(draft);
  return { success: true, draft: geocoded };
}

export async function importTripDraftFromText(
  text: string,
  sourceMeta?: ImportedItineraryDraftSourceMeta,
): Promise<TripImportDraftResult> {
  const normalizedText = text.trim();

  if (normalizedText.length < IMPORT_TEXT_MIN_LENGTH) {
    return {
      success: false,
      error: `Text must be at least ${IMPORT_TEXT_MIN_LENGTH} characters`,
    };
  }

  if (normalizedText.length > IMPORT_TEXT_MAX_LENGTH) {
    return {
      success: false,
      error: `Text is too long (max ${IMPORT_TEXT_MAX_LENGTH.toLocaleString()} characters)`,
    };
  }

  try {
    const extracted = await extractStructuredTourFromText(normalizedText);
    const fallback = buildFallbackTourDraftFromText(normalizedText);
    const repaired = mergeFallbackStructureIntoExtracted(extracted, fallback);
    const hydrated = mergeImportedAccommodationHints(repaired, normalizedText);
    const draft = normalizeImportedItineraryDraft(hydrated, sourceMeta);
    const geocoded = await geocodeItineraryDraft(draft);
    return { success: true, draft: geocoded };
  } catch (error) {
    logError("Text import extraction error", error);
    const fallback = buildFallbackTourDraftFromText(normalizedText);
    const hydrated = mergeImportedAccommodationHints(fallback, normalizedText);
    const draft = normalizeImportedItineraryDraft(hydrated, {
      ...sourceMeta,
      extraction_confidence: Math.min(sourceMeta?.extraction_confidence ?? 0.45, 0.45),
    });
    const geocoded = await geocodeItineraryDraft(draft);
    return { success: true, draft: geocoded };
  }
}

export async function importTripDraftFromUrl(url: string): Promise<TripImportDraftResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { success: false, error: "URL format is invalid" };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { success: false, error: "Only http/https URLs are supported" };
  }

  if (!(await isSafePublicUrl(parsedUrl))) {
    return { success: false, error: "URL not allowed" };
  }

  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.statusText}`,
      };
    }

    const resolvedUrl = response.url || url;
    const contentType = response.headers.get("content-type");
    const pdfLike = isPdfContentType(contentType) || looksLikePdfUrl(resolvedUrl) || looksLikePdfUrl(url);

    if (pdfLike) {
      const arrayBuffer = await response.arrayBuffer();
      const filename = getFilenameFromUrl(resolvedUrl);
      const file = new File([arrayBuffer], filename, {
        type: "application/pdf",
      });

      const pdfResult = await importTripDraftFromPdf(file, {
        filename,
        source: "url",
        url: resolvedUrl,
      });

      return {
        ...pdfResult,
        originalUrl: resolvedUrl,
      };
    }

    const html = await response.text();
    const extractedText = extractImportTextFromHtml(html).slice(0, HTML_IMPORT_MAX_LENGTH);

    if (extractedText.length < IMPORT_TEXT_MIN_LENGTH) {
      return {
        success: false,
        error: "Could not extract useful text from this URL",
      };
    }

    const textResult = await importTripDraftFromText(extractedText, {
      source: "url",
      url: resolvedUrl,
    });

    return {
      ...textResult,
      originalUrl: resolvedUrl,
    };
  } catch (error) {
    logError("URL import extraction error", error);
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: "The URL took too long to respond. Try again or check the URL.",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import from URL",
    };
  }
}
