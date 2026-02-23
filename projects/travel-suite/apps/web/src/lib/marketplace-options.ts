export const SERVICE_REGION_OPTIONS: string[] = [
  'Abu Dhabi',
  'Amboseli',
  'Andaman & Nicobar',
  'Argentina',
  'Australia',
  'Bali',
  'Bangkok',
  'Bhutan',
  'Botswana',
  'Brazil',
  'Cambodia',
  'Canada',
  'Cape Town',
  'Chile',
  'Chiang Mai',
  'Costa Rica',
  'Da Nang',
  'Doha',
  'Dubai',
  'Egypt',
  'France',
  'Goa',
  'Greece',
  'Hanoi',
  'Ho Chi Minh City',
  'Iceland',
  'India',
  'Indonesia',
  'Istanbul',
  'Italy',
  'Japan',
  'Jordan',
  'Kashmir',
  'Kathmandu Valley',
  'Kenya',
  'Kerala',
  'Krabi',
  'Kuala Lumpur',
  'Ladakh',
  'Laos',
  'Lombok',
  'London',
  'Malaysia',
  'Maldives',
  'Marrakech',
  'Masai Mara',
  'Mauritius',
  'Mexico',
  'Morocco',
  'Mumbai',
  'Muscat',
  'Namibia',
  'Nairobi',
  'Nepal',
  'New Zealand',
  'Norway',
  'Oman',
  'Paris',
  'Peru',
  'Phuket',
  'Portugal',
  'Qatar',
  'Rajasthan',
  'Riyadh',
  'Rome',
  'Rwanda',
  'Saudi Arabia',
  'Scotland',
  'Serengeti',
  'Seychelles',
  'Sharjah',
  'Singapore',
  'South Africa',
  'South Korea',
  'Spain',
  'Sri Lanka',
  'Sumatra',
  'Switzerland',
  'Tanzania',
  'Thailand',
  'Tsavo',
  'Turkey',
  'Uganda',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Vietnam',
  'Zanzibar',
];

export const SPECIALTY_OPTIONS: string[] = [
  '4x4 Expeditions',
  'Adventure Travel',
  'Beach Holidays',
  'Birding Tours',
  'Budget Tours',
  'Camping Trips',
  'City Breaks',
  'Conservation Travel',
  'Corporate Retreats',
  'Cruise Holidays',
  'Cultural Tours',
  'Custom Private Tours',
  'Desert Safaris',
  'Destination Weddings',
  'Eco Tourism',
  'Family Safaris',
  'Festival Tours',
  'Food & Culinary Tours',
  'Glamping',
  'Group Departures',
  'Heritage Tours',
  'Honeymoon Packages',
  'Incentive Travel',
  'Luxury Safaris',
  'MICE',
  'Motorbike Tours',
  'Overland Journeys',
  'Photography Safaris',
  'Pilgrimage Tours',
  'Rail Journeys',
  'Road Trips',
  'Scuba Diving',
  'Self Drive Safaris',
  'Senior-Friendly Travel',
  'Solo Travel',
  'Sports Tourism',
  'Student Groups',
  'Surfing Trips',
  'Sustainable Travel',
  'Trekking & Hiking',
  'Volunteer Tourism',
  'Water Sports',
  'Wellness Retreats',
  'Wildlife Safaris',
  'Yoga Retreats',
];

export const mergeMarketplaceOptions = (
  defaults: string[],
  dynamicValues: string[] = []
): string[] => {
  const normalized = new Map<string, string>();
  [...defaults, ...dynamicValues]
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => normalized.set(value.toLowerCase(), value));

  return Array.from(normalized.values()).sort((a, b) => a.localeCompare(b));
};

const MARKETPLACE_OPTION_MAX_LENGTH = 80;
const MARKETPLACE_OPTION_MAX_ITEMS = 400;

function normalizeOptionValue(value: unknown, maxLength = MARKETPLACE_OPTION_MAX_LENGTH): string | null {
  const candidate = String(value || "").trim();
  if (!candidate) return null;
  return candidate.slice(0, maxLength);
}

export function normalizeMarketplaceOptionList(
  values: unknown,
  maxItems = MARKETPLACE_OPTION_MAX_ITEMS
): string[] {
  if (!Array.isArray(values)) return [];

  const deduped = new Map<string, string>();
  for (const value of values) {
    const normalized = normalizeOptionValue(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, normalized);
    }
    if (deduped.size >= maxItems) {
      break;
    }
  }

  return Array.from(deduped.values()).sort((a, b) => a.localeCompare(b));
}

export type MarketplaceOptionCatalog = {
  service_regions: string[];
  specialties: string[];
  source?: string;
  generated_at?: string;
};

export function normalizeMarketplaceOptionCatalog(payload: unknown): MarketplaceOptionCatalog | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  return {
    service_regions: normalizeMarketplaceOptionList(record.service_regions),
    specialties: normalizeMarketplaceOptionList(record.specialties),
    source: normalizeOptionValue(record.source, 64) || undefined,
    generated_at: normalizeOptionValue(record.generated_at, 64) || undefined,
  };
}

export async function fetchMarketplaceOptionCatalog(
  signal?: AbortSignal
): Promise<MarketplaceOptionCatalog | null> {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch("/api/marketplace/options", {
      cache: "no-store",
      signal,
    });

    if (!response.ok) return null;
    const payload = await response.json();
    return normalizeMarketplaceOptionCatalog(payload);
  } catch {
    return null;
  }
}
