import "server-only";

import dns from "node:dns/promises";
import net from "node:net";

import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { logError } from "@/lib/observability/logger";
import { extractTourFromPDF } from "@/lib/import/pdf-extractor";
import {
  normalizeImportedItineraryDraft,
  type ImportedItineraryDraft,
  type ImportedItineraryDraftSourceMeta,
} from "@/lib/import/trip-draft";

const IMPORT_TEXT_MIN_LENGTH = 50;
const IMPORT_TEXT_MAX_LENGTH = 30000;
const HTML_IMPORT_MAX_LENGTH = 30000;

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

async function extractStructuredTourFromText(text: string, apiKey?: string): Promise<unknown> {
  const key = getGeminiKey(apiKey);
  if (!key) {
    throw new Error("Missing Gemini API key. Set GOOGLE_API_KEY (recommended) in your environment.");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
You are a tour itinerary extraction expert for a premium B2B travel operations product.
I will give you brochure text, copied itinerary text, or website text.
Extract all usable trip information and return ONLY valid raw JSON.

Return JSON in this exact structure:
{
  "name": "Tour name",
  "destination": "City, Country",
  "duration_days": 5,
  "start_date": "2026-04-28",
  "end_date": "2026-05-03",
  "description": "Overall tour summary",
  "base_price": 2500,
  "budget": "Budget | Moderate | Luxury",
  "interests": ["beach", "family"],
  "tips": ["Carry sunscreen"],
  "inclusions": ["Airport transfers", "Breakfast"],
  "exclusions": ["Flights", "Personal expenses"],
  "pricing": {
    "per_person_cost": 1250,
    "total_cost": 2500,
    "currency": "INR",
    "pax_count": 2,
    "notes": "Rate valid for twin sharing"
  },
  "days": [
    {
      "day_number": 1,
      "date": "2026-04-28",
      "title": "Arrival in Phuket",
      "description": "Day summary",
      "accommodation": {
        "hotel_name": "Hotel name if stated",
        "star_rating": 4,
        "room_type": "Deluxe Room",
        "price_per_night": 6500,
        "amenities": ["Breakfast"]
      },
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Phuket Airport pickup",
          "description": "Activity description",
          "location": "Phuket Airport",
          "coordinates": { "lat": 7.8804, "lng": 98.3923 },
          "price": 0,
          "is_optional": false,
          "is_premium": false
        }
      ]
    }
  ]
}

Rules:
- Return JSON only, no markdown.
- Use YYYY-MM-DD for start_date, end_date, and any explicit day dates.
- Extract pricing, inclusions, exclusions, tips, and interests whenever present.
- If the text mentions hotels, stays, camps, resorts, room types, or accommodation nights, extract them into the relevant day's "accommodation" object.
- If hotel details are only mentioned in inclusions or package notes, still capture them under the best matching day instead of dropping them.
- Use numeric prices only, no currency symbols.
- If exact coordinates are unknown, omit coordinates instead of guessing 0,0.
- Do not invent days or activities not supported by the text.
- Keep day numbers sequential.
- If pricing is missing, omit that field instead of guessing.
- Prefer searchable titles and real place names.

Source text:
${text}
`;

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
  return { success: true, draft };
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
    const draft = normalizeImportedItineraryDraft(extracted, sourceMeta);
    return { success: true, draft };
  } catch (error) {
    logError("Text import extraction error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract itinerary from text",
    };
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
