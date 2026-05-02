/**
 * Hotel name detection patterns and validation.
 *
 * Used by trip-draft.ts to recover hotel hints from raw source text and to
 * reject false positives where a city/location is mistakenly captured as a
 * hotel name (e.g. "overnight at Pahalgam" must NOT yield hotel "Pahalgam").
 */

const STAY_VERB = "(?:stay|stayed|overnight|check[- ]?in|accommodation|accom\\.?)";

export const HOTEL_BRAND_KEYWORDS = [
  "hotel",
  "resort",
  "houseboat",
  "camp",
  "lodge",
  "villa",
  "inn",
  "retreat",
  "homestay",
  "palace",
  "suites",
  "spa",
  "manor",
  "guest house",
  "guesthouse",
  "boutique",
  "haveli",
  "cottage",
  "the leela",
  "the lalit",
  "the oberoi",
  "the taj",
  "vivanta",
  "welcomhotel",
  "welcome hotel",
  "fortune",
  "novotel",
  "marriott",
  "hyatt",
  "hilton",
  "radisson",
  "ramada",
  "lemon tree",
  "ginger",
  "fairfield",
  "country inn",
  "ibis",
  "club mahindra",
  "sterling",
  "khyber",
];

export const HOTEL_BRAND_RE = new RegExp(
  `\\b(?:${HOTEL_BRAND_KEYWORDS.join("|")})\\b`,
  "i",
);

export const STAR_RATING_RE = /\b\d\s*-?\s*star\b/i;

export const ACCOMMODATION_LINE_RE = HOTEL_BRAND_RE;

export const ACCOMMODATION_PREFIX_RE = new RegExp(
  `^(?:accommodation|hotel(?:\\s+name)?|stay(?:\\s+at)?|overnight\\s+stay(?:\\s+at)?|check[- ]?in(?:\\s+at)?)\\s*[:\\-]?\\s*(.+)$`,
  "i",
);

export const NIGHT_STAY_RE =
  /^(?:(\d+)\s*night(?:s)?\s+)?(?:stay\s+)?(?:at|in)\s+(.+)$/i;

export const PACKAGE_SECTION_RE =
  /^(?:[✅✓✔❌✕xX+\-\s]*)?(?:package\s+)?(?:inclusions?|includes?|exclusions?|excludes?|tour\s+cost\s+(?:includes?|excludes?)|cost\s+(?:includes?|excludes?)|included|not\s+included)\b/i;

/**
 * Common Indian destinations and tourist towns that should never be
 * mistaken for a hotel name. Lowercased for comparison.
 */
const KNOWN_LOCATION_TOKENS = new Set<string>([
  // Kashmir
  "srinagar", "pahalgam", "gulmarg", "sonmarg", "kashmir", "leh", "ladakh",
  "kargil", "doodhpathri", "yusmarg", "betaab", "aru", "nubra",
  // Himachal
  "shimla", "manali", "dharamshala", "dharamsala", "mcleodganj", "kasol",
  "spiti", "kullu", "kasauli", "dalhousie", "khajjiar", "chail",
  // Rajasthan
  "jaipur", "udaipur", "jaisalmer", "jodhpur", "pushkar", "ajmer",
  "mount abu", "ranthambore", "bikaner", "chittorgarh",
  // Goa
  "goa", "panaji", "panjim", "calangute", "baga", "anjuna", "candolim",
  "vagator", "palolem", "morjim", "varkala",
  // Kerala
  "kerala", "munnar", "alleppey", "alappuzha", "thekkady", "kumarakom",
  "kovalam", "wayanad", "kochi", "cochin", "trivandrum", "thiruvananthapuram",
  "varkala", "marari",
  // Tamil Nadu / Karnataka
  "ooty", "kodaikanal", "coorg", "chikmagalur", "hampi", "mysore", "mysuru",
  "bangalore", "bengaluru", "chennai", "mahabalipuram", "pondicherry",
  "puducherry",
  // Uttarakhand
  "rishikesh", "haridwar", "mussoorie", "nainital", "auli", "kausani",
  "ranikhet", "dehradun", "jim corbett", "corbett",
  // North East
  "darjeeling", "gangtok", "sikkim", "shillong", "guwahati", "tawang",
  "kaziranga", "cherrapunji",
  // Maharashtra / others
  "mumbai", "pune", "lonavala", "khandala", "mahabaleshwar",
  "matheran", "alibaug", "shirdi", "aurangabad", "nashik",
  // Andhra / Telangana / Odisha
  "hyderabad", "visakhapatnam", "vizag", "puri", "konark", "bhubaneswar",
  // Major hubs / generic
  "delhi", "agra", "varanasi", "amritsar", "chandigarh", "kolkata",
  "ahmedabad", "udaipur", "indore", "bhopal",
  // International common ones (defensive)
  "dubai", "abu dhabi", "bali", "phuket", "bangkok", "krabi", "singapore",
  "kuala lumpur", "langkawi", "colombo", "kandy", "kathmandu", "pokhara",
]);

const STOP_WORDS_AS_HOTEL = new Set<string>([
  "to", "from", "the", "and", "or", "in", "at", "by",
  "airport", "station", "pickup", "drop", "check", "checkin", "checkout",
  "breakfast", "lunch", "dinner", "transfer", "transfers", "departure",
  "arrival", "sightseeing",
]);

/**
 * Returns true if the candidate string is just a city/location name
 * (or a stop word) and therefore must NOT be used as a hotel name.
 *
 * Additional candidates (such as the trip's destination and per-day
 * locations) can be passed in via additionalCities to extend the
 * blocklist for the current import.
 */
export function isLikelyLocationOnly(
  candidate: string,
  additionalCities: ReadonlyArray<string> = [],
): boolean {
  if (!candidate) return true;
  const normalized = candidate.toLowerCase().trim();
  if (!normalized) return true;
  if (STOP_WORDS_AS_HOTEL.has(normalized)) return true;
  if (KNOWN_LOCATION_TOKENS.has(normalized)) return true;

  for (const city of additionalCities) {
    const c = city.toLowerCase().trim();
    if (!c) continue;
    if (normalized === c) return true;
    if (KNOWN_LOCATION_TOKENS.has(c) && normalized.split(/[\s,]+/).every((token) => token === c || KNOWN_LOCATION_TOKENS.has(token) || STOP_WORDS_AS_HOTEL.has(token))) {
      return true;
    }
  }

  return false;
}

const REJECT_PHRASE_RE =
  /^\s*(?:to\s+(?:the\s+)?hotel|to\s+(?:the\s+)?resort|the\s+hotel|the\s+resort|hotel|resort)\s*$/i;

/**
 * Returns true if the candidate looks like a real hotel/accommodation name.
 *
 * Required signals (at least one must be present):
 *  - Brand keyword (hotel, resort, houseboat, vivanta, taj, ...)
 *  - Star rating mention ("4-star")
 *  - Two or more capitalized words (proper-noun multi-token name)
 *
 * Negative signals reject the candidate even when above are met:
 *  - Candidate is just a known city/region name
 *  - Candidate is a stop word / verb / generic transit phrase
 *  - Candidate is a generic hotel-keyword phrase with no proper-noun
 */
export function looksLikeHotelName(
  candidate: string,
  additionalCities: ReadonlyArray<string> = [],
): boolean {
  if (!candidate) return false;
  const trimmed = candidate.trim();
  if (trimmed.length < 4) return false;
  if (REJECT_PHRASE_RE.test(trimmed)) return false;
  if (isLikelyLocationOnly(trimmed, additionalCities)) return false;

  if (STAR_RATING_RE.test(trimmed)) return true;

  if (HOTEL_BRAND_RE.test(trimmed)) {
    // A brand keyword alone isn't enough — require at least one additional
    // proper-noun token so "to hotel" or "the resort" don't slip through.
    const words = trimmed.split(/\s+/);
    if (words.length >= 2) return true;
  }

  const words = trimmed.split(/\s+/);
  const capitalizedCount = words.filter((w) => /^[A-Z][\w&'-]*/.test(w)).length;
  if (capitalizedCount >= 2 && words.length >= 2) {
    const last = words[words.length - 1];
    const isCityOnly = isLikelyLocationOnly(last, additionalCities);
    return !isCityOnly || capitalizedCount >= 3;
  }

  return false;
}

/**
 * Strip trailing city qualifiers from a hotel name candidate so that
 * "Hotel Heevan, Pahalgam" or "Hotel Heevan, Srinagar." becomes "Hotel Heevan".
 */
export function stripTrailingLocation(
  hotelName: string,
  cities: ReadonlyArray<string> = [],
): string {
  let cleaned = hotelName.trim().replace(/[\s.,;:!?]+$/u, "");

  cleaned = cleaned.replace(/\s*,\s*[^,]+$/u, (match) => {
    const tail = match.replace(/^[\s,]+/, "").replace(/[\s.,;:!?]+$/u, "").trim();
    if (isLikelyLocationOnly(tail, cities)) return "";
    return match;
  });

  return cleaned.trim();
}

const STAY_VERB_RE = new RegExp(`\\b${STAY_VERB}\\b`, "i");

export function lineHasStayVerb(line: string): boolean {
  return STAY_VERB_RE.test(line);
}
