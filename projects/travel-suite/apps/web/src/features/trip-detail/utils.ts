import type { Activity, Day } from "./types";

// ---------------------------------------------------------------------------
// Time helpers — extracted from /trips/[id]/page.tsx
// ---------------------------------------------------------------------------

export function isValidTime(value?: string): boolean {
  return !!value && /^\d{2}:\d{2}$/.test(value);
}

export function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60 - 30));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function roundToNearestThirty(totalMinutes: number): number {
  return Math.round(totalMinutes / 30) * 30;
}

// ---------------------------------------------------------------------------
// Distance & travel estimation
// ---------------------------------------------------------------------------

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const earthRadiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function estimateTravelMinutes(
  previous?: Activity,
  current?: Activity,
): number {
  if (!previous || !current || !previous.coordinates || !current.coordinates)
    return 20;
  const dist = haversineKm(previous.coordinates, current.coordinates);
  const time = Math.round((dist / 30) * 60 + 10);
  return Math.max(10, Math.min(time, 180));
}

// ---------------------------------------------------------------------------
// Schedule builder — assigns start/end times to a day's activities
// ---------------------------------------------------------------------------

export function buildDaySchedule(day: Day): Day {
  const firstStart =
    isValidTime(day.activities[0]?.start_time)
      ? day.activities[0].start_time!
      : "09:00";

  let cursor = timeToMinutes(firstStart);

  const activities = day.activities.map((activity, index) => {
    const travel =
      index > 0
        ? estimateTravelMinutes(day.activities[index - 1], activity)
        : 0;
    const start =
      index === 0 ? cursor : roundToNearestThirty(cursor + travel);
    const duration = Math.max(30, activity.duration_minutes || 60);
    const end = roundToNearestThirty(start + duration);
    cursor = end;
    return {
      ...activity,
      start_time: minutesToTime(start),
      end_time: minutesToTime(end),
      duration_minutes: duration,
    };
  });

  return { ...day, activities };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatINRShort(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return formatINR(n);
}

export function formatDate(value: string | null): string {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateLong(value: string | null): string {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
