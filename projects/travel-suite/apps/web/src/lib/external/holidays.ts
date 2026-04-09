import { fetchWithRetry } from "@/lib/network/retry";
import { logError } from "@/lib/observability/logger";
import { resolveLocationMetadata } from "@/lib/external/weather";
import { z } from "zod";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const destinationCache = new Map<string, { expiresAt: number; value: ResolvedHolidayDestination | null }>();
const holidaysCache = new Map<string, { expiresAt: number; value: HolidayRecord[] }>();

const HolidaySchema = z.object({
  date: z.string(),
  localName: z.string(),
  name: z.string(),
  countryCode: z.string(),
  global: z.boolean().optional(),
  types: z.array(z.string()).optional(),
});

const HolidaysSchema = z.array(HolidaySchema);

export interface HolidayRecord {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  global: boolean;
  types: string[];
}

export interface ResolvedHolidayDestination {
  locationName: string;
  country: string;
  countryCode: string;
}

export interface HolidayOverlapSummary {
  holidayName: string;
  date: string;
  country: string;
  countryCode: string;
}

function getCachedValue<T>(cache: Map<string, { expiresAt: number; value: T }>, key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return cached.value;
}

function setCachedValue<T>(cache: Map<string, { expiresAt: number; value: T }>, key: string, value: T) {
  cache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

function formatDateOnly(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function buildDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) {
    return [];
  }

  const days: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(formatDateOnly(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export async function resolveHolidayDestination(destination: string): Promise<ResolvedHolidayDestination | null> {
  const normalized = destination.trim().toLowerCase();
  if (!normalized) return null;

  const cached = getCachedValue(destinationCache, normalized);
  if (cached !== null) {
    return cached;
  }

  const resolved = await resolveLocationMetadata(destination);
  const value = resolved?.countryCode && resolved.country
    ? {
        locationName: resolved.name,
        country: resolved.country,
        countryCode: resolved.countryCode,
      }
    : null;

  setCachedValue(destinationCache, normalized, value);
  return value;
}

export async function getPublicHolidays(countryCode: string, year: number): Promise<HolidayRecord[]> {
  const normalizedCountryCode = countryCode.trim().toUpperCase();
  const cacheKey = `${normalizedCountryCode}:${year}`;
  const cached = getCachedValue(holidaysCache, cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetchWithRetry(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${normalizedCountryCode}`,
      undefined,
      { retries: 2, timeoutMs: 6000 },
    );

    if (!response.ok) {
      logError("[holidays] Failed to load public holidays", {
        countryCode: normalizedCountryCode,
        year,
        status: response.status,
      });
      setCachedValue(holidaysCache, cacheKey, []);
      return [];
    }

    const payload = await response.json();
    const parsed = HolidaysSchema.safeParse(payload);
    if (!parsed.success) {
      logError("[holidays] Invalid holiday payload", parsed.error.flatten());
      setCachedValue(holidaysCache, cacheKey, []);
      return [];
    }

    const holidays = parsed.data.map((item) => ({
      date: item.date,
      localName: item.localName,
      name: item.name,
      countryCode: item.countryCode.toUpperCase(),
      global: item.global ?? false,
      types: item.types ?? [],
    }));

    setCachedValue(holidaysCache, cacheKey, holidays);
    return holidays;
  } catch (error) {
    logError("[holidays] Unexpected holiday fetch error", error);
    setCachedValue(holidaysCache, cacheKey, []);
    return [];
  }
}

export async function getDestinationHolidays(destination: string, year: number, month: number) {
  const resolved = await resolveHolidayDestination(destination);
  if (!resolved) return null;

  const holidays = await getPublicHolidays(resolved.countryCode, year);
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  return {
    ...resolved,
    holidays: holidays.filter((holiday) => holiday.date.startsWith(monthPrefix)),
  };
}

export async function getHolidayOverlapSummary(input: {
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<HolidayOverlapSummary | null> {
  const destination = input.destination?.trim();
  const startDate = input.startDate?.trim();
  const endDate = input.endDate?.trim() || startDate;

  if (!destination || !startDate || !endDate) {
    return null;
  }

  const resolved = await resolveHolidayDestination(destination);
  if (!resolved) {
    return null;
  }

  const rangeDates = new Set(buildDateRange(startDate, endDate));
  if (rangeDates.size === 0) {
    return null;
  }

  const years = new Set(
    Array.from(rangeDates).map((date) => Number(date.slice(0, 4))).filter((year) => Number.isFinite(year)),
  );

  const holidays = (
    await Promise.all(
      Array.from(years).map((year) => getPublicHolidays(resolved.countryCode, year)),
    )
  ).flat();

  const overlap = holidays.find((holiday) => rangeDates.has(holiday.date));
  if (!overlap) {
    return null;
  }

  return {
    holidayName: overlap.localName || overlap.name,
    date: overlap.date,
    country: resolved.country,
    countryCode: resolved.countryCode,
  };
}
