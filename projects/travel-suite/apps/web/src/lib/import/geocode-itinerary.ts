import "server-only";

import { logError, logEvent } from "@/lib/observability/logger";
import { geocodeLocation } from "@/lib/geocoding-with-cache";
import type { ImportedItineraryDraft } from "@/lib/import/trip-draft";
import type { Activity } from "@/types/itinerary";

interface Coordinate {
  lat: number;
  lng: number;
}

const MAX_PARALLEL = 5;
const NOMINATIM_DELAY_MS = 1100;

let nominatimNextSlot = 0;

async function nominatimQueue<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const wait = Math.max(0, nominatimNextSlot - now);
  nominatimNextSlot = Math.max(now, nominatimNextSlot) + NOMINATIM_DELAY_MS;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  return fn();
}

async function geocodeWithNominatim(query: string): Promise<Coordinate | null> {
  return nominatimQueue(async () => {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "1");
      url.searchParams.set("q", query);

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "TripBuilt/1.0 (tripbuilt.com)",
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      const first = Array.isArray(data) ? data[0] : null;
      const lat = Number(first?.lat);
      const lng = Number(first?.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (lat === 0 && lng === 0) return null;

      return { lat, lng };
    } catch (error) {
      logError("Nominatim geocode failed", error);
      return null;
    }
  });
}

async function resolveCoordinate(query: string): Promise<Coordinate | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const cached = await geocodeLocation(trimmed);
    if (cached?.coordinates) return cached.coordinates;
  } catch (error) {
    logError("geocodeLocation primary failed", error);
  }

  return geocodeWithNominatim(trimmed);
}

async function resolveBatch(queries: string[]): Promise<Map<string, Coordinate | null>> {
  const result = new Map<string, Coordinate | null>();
  const unique = Array.from(new Set(queries.map((q) => q.trim()).filter(Boolean)));

  for (let i = 0; i < unique.length; i += MAX_PARALLEL) {
    const batch = unique.slice(i, i + MAX_PARALLEL);
    const resolved = await Promise.all(batch.map((query) => resolveCoordinate(query)));
    batch.forEach((query, index) => {
      result.set(query, resolved[index]);
    });
  }

  return result;
}

function activityNeedsGeocoding(activity: Activity): boolean {
  if (!activity?.location) return false;
  const coords = activity.coordinates;
  if (!coords) return true;
  if (typeof coords.lat !== "number" || typeof coords.lng !== "number") return true;
  if (coords.lat === 0 && coords.lng === 0) return true;
  return false;
}

/**
 * Bake server-resolved coordinates into the imported itinerary draft so the
 * map view does not have to geocode at render time. Failures are non-fatal —
 * the draft is returned unchanged on error and the client-side fallback in
 * ItineraryMap.tsx can still attempt geocoding.
 */
export async function geocodeItineraryDraft(
  draft: ImportedItineraryDraft,
): Promise<ImportedItineraryDraft> {
  if (!draft) return draft;

  try {
    const destination = draft.destination?.trim() ?? "";
    const queries: string[] = [];
    const queryByActivity = new Map<string, string>();

    draft.days.forEach((day) => {
      day.activities?.forEach((activity, activityIndex) => {
        if (!activityNeedsGeocoding(activity)) return;
        const location = activity.location?.trim();
        if (!location) return;

        const baseQuery =
          destination && !location.toLowerCase().includes(destination.toLowerCase())
            ? `${location}, ${destination}`
            : location;

        const key = `${day.day_number}:${activityIndex}`;
        queryByActivity.set(key, baseQuery);
        queries.push(baseQuery);
      });
    });

    const queryByHotel = new Map<number, string>();
    (draft.accommodations ?? []).forEach((accommodation) => {
      if (accommodation.is_fallback) return;
      if (accommodation.coordinates) return;
      const hotelName = accommodation.hotel_name?.trim();
      if (!hotelName) return;

      const target = accommodation.address?.trim()
        ? `${hotelName}, ${accommodation.address}`
        : destination
          ? `${hotelName}, ${destination}`
          : hotelName;

      queryByHotel.set(accommodation.day_number, target);
      queries.push(target);
    });

    if (queries.length === 0) return draft;

    const resolved = await resolveBatch(queries);

    const nextDays = draft.days.map((day) => {
      const nextActivities = day.activities?.map((activity, activityIndex) => {
        const key = `${day.day_number}:${activityIndex}`;
        const query = queryByActivity.get(key);
        if (!query) return activity;
        const coordinates = resolved.get(query);
        if (!coordinates) return activity;
        return { ...activity, coordinates };
      });
      return { ...day, activities: nextActivities ?? day.activities };
    });

    const nextAccommodations = (draft.accommodations ?? []).map((accommodation) => {
      const query = queryByHotel.get(accommodation.day_number);
      if (!query) return accommodation;
      const coordinates = resolved.get(query);
      if (!coordinates) return accommodation;
      return { ...accommodation, coordinates };
    });

    const hits = Array.from(resolved.values()).filter(Boolean).length;
    logEvent("info", `geocodeItineraryDraft resolved ${hits}/${queries.length} locations`);

    return {
      ...draft,
      days: nextDays,
      accommodations: nextAccommodations,
    };
  } catch (error) {
    logError("geocodeItineraryDraft failed (returning draft as-is)", error);
    return draft;
  }
}
