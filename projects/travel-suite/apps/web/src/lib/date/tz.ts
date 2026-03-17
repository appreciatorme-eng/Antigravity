export const DEFAULT_APP_TIMEZONE = "Asia/Kolkata";
export const TIMEZONE_STORAGE_KEY = "tripbuilt.user-timezone";

const FALLBACK_TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
] as const;

function getSupportedTimezones(): readonly string[] {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    const supported = Intl.supportedValuesOf("timeZone");
    if (Array.isArray(supported) && supported.length > 0) {
      return supported;
    }
  }

  return FALLBACK_TIMEZONES;
}

export const COMMON_TIMEZONES = Array.from(new Set(getSupportedTimezones())).filter(
  (timezone) => FALLBACK_TIMEZONES.includes(timezone as (typeof FALLBACK_TIMEZONES)[number]),
);

export function isValidTimezone(value: string | null | undefined): value is string {
  if (!value) return false;

  try {
    new Intl.DateTimeFormat("en-IN", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveAppTimezone(value?: string | null): string {
  if (isValidTimezone(value)) {
    return value;
  }

  if (typeof Intl !== "undefined") {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (isValidTimezone(browserTimezone)) {
      return browserTimezone;
    }
  }

  return DEFAULT_APP_TIMEZONE;
}

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const next = value instanceof Date ? value : new Date(value);
  return Number.isNaN(next.getTime()) ? null : next;
}

export function formatLocalDate(
  value: Date | string | number | null | undefined,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
): string {
  const next = toDate(value);
  if (!next) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    ...options,
    timeZone: resolveAppTimezone(timezone),
  }).format(next);
}

export function formatLocalTime(
  value: Date | string | number | null | undefined,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  },
): string {
  const next = toDate(value);
  if (!next) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    ...options,
    timeZone: resolveAppTimezone(timezone),
  }).format(next);
}

export function formatLocalDateTime(
  value: Date | string | number | null | undefined,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  },
): string {
  const next = toDate(value);
  if (!next) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    ...options,
    timeZone: resolveAppTimezone(timezone),
  }).format(next);
}

export function getTimezoneDisplayName(timezone: string): string {
  const resolved = resolveAppTimezone(timezone);
  return `${resolved.replaceAll("_", " ")}`;
}
