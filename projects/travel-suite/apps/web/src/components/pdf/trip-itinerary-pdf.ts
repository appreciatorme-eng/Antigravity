"use client";

import { authedFetch } from "@/lib/api/authed-fetch";
import type { ItineraryResult } from "@/types/itinerary";
import type { TripDetailPayload, TripItineraryRawData } from "@/features/trip-detail/types";
import { downloadItineraryPdf } from "./itinerary-pdf";
import { normalizeItineraryTemplateId } from "./itinerary-types";
import type { ItineraryPrintAddOn, ItineraryPrintExtras } from "./itinerary-types";

interface TripAddOnResponse {
  addOns?: Array<ItineraryPrintAddOn & {
    image_url?: string | null;
    imageUrl?: string | null;
    is_selected?: boolean | null;
    unit_price?: number | null;
  }>;
}

interface DownloadTripItineraryPdfParams {
  tripId: string;
  tripPayload?: TripDetailPayload | null;
}

const sanitizePdfFileName = (value: string) =>
  value.replace(/[^a-zA-Z0-9-_]+/g, "_").replace(/^_+|_+$/g, "") || "itinerary";

const formatDuration = (minutes?: number | null) => {
  if (!minutes || !Number.isFinite(minutes)) return undefined;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
};

const buildPdfItinerary = (payload: TripDetailPayload): ItineraryResult | null => {
  const trip = payload.trip;
  const itinerary = trip.itineraries;
  const rawData = itinerary?.raw_data;
  if (!itinerary || !rawData) return null;

  const normalizedRaw = rawData as TripItineraryRawData & {
    logistics?: ItineraryResult["logistics"];
  };

  return {
    trip_title: normalizedRaw.trip_title || itinerary.trip_title || trip.destination || "Trip itinerary",
    destination: normalizedRaw.destination || itinerary.destination || trip.destination || "Destination",
    duration_days: normalizedRaw.duration_days || itinerary.duration_days || normalizedRaw.days?.length || 1,
    start_date: trip.start_date || undefined,
    end_date: trip.end_date || undefined,
    summary: normalizedRaw.summary || "Detailed itinerary enclosed.",
    days: (normalizedRaw.days || []).map((day) => ({
      day_number: day.day_number,
      theme: day.theme || day.title || `Day ${day.day_number}`,
      title: day.title,
      summary: day.summary,
      activities: (day.activities || []).map((activity) => ({
        time: activity.start_time || "",
        title: activity.title || "Scheduled stop",
        description: activity.description || "",
        location: activity.location || "",
        coordinates: activity.coordinates,
        duration: formatDuration(activity.duration_minutes),
        cost: activity.cost,
        transport: activity.transport,
        image: activity.image,
        imageUrl: activity.imageUrl,
        image_source: activity.image_source,
        image_confidence: activity.image_confidence,
        image_query: activity.image_query,
        image_entity_id: activity.image_entity_id,
      })),
    })),
    budget: normalizedRaw.budget,
    interests: normalizedRaw.interests || [],
    tips: normalizedRaw.tips || [],
    inclusions: normalizedRaw.inclusions || [],
    exclusions: normalizedRaw.exclusions || [],
    extracted_pricing: normalizedRaw.pricing,
    logistics: normalizedRaw.logistics || {
      flights: (normalizedRaw.flights || []).map((flight, index) => ({
        id: `${itinerary.id}-flight-${index}`,
        airline: flight.airline,
        flight_number: flight.flight_number,
        departure_airport: flight.departure_city,
        arrival_airport: flight.arrival_city,
        departure_time: flight.departure_time,
        arrival_time: flight.arrival_time,
        confirmation: flight.booking_reference || flight.pnr || undefined,
        source: "manual",
      })),
    },
  };
};

const buildPrintExtras = (
  payload: TripDetailPayload,
  addOns: TripAddOnResponse["addOns"] = [],
): ItineraryPrintExtras => {
  const dayAccommodations = Object.values(payload.accommodations || {})
    .filter((accommodation) => accommodation?.day_number && accommodation.hotel_name)
    .map((accommodation) => ({
      dayNumber: accommodation.day_number,
      hotelName: accommodation.hotel_name,
      roomType: accommodation.address || null,
      amenities: [
        accommodation.check_in_time ? `Check-in ${accommodation.check_in_time}` : null,
        accommodation.contact_phone ? `Contact ${accommodation.contact_phone}` : null,
      ].filter((item): item is string => Boolean(item)),
    }));

  const selectedAddOns = (addOns || [])
    .filter((addOn) => addOn.is_selected !== false)
    .map((addOn) => ({
      name: addOn.name,
      category: addOn.category,
      description: addOn.description,
      unitPrice: addOn.unitPrice ?? addOn.unit_price ?? null,
      quantity: addOn.quantity,
      imageUrl: addOn.imageUrl || addOn.image_url || null,
    }));

  return { dayAccommodations, selectedAddOns };
};

const fetchTripPayload = async (tripId: string) => {
  const response = await authedFetch(`/api/trips/${tripId}`);
  if (!response.ok) {
    throw new Error("Could not fetch trip itinerary data.");
  }
  return response.json() as Promise<TripDetailPayload>;
};

const fetchTripAddOns = async (tripId: string) =>
  authedFetch(`/api/trips/${tripId}/add-ons`)
    .then((response) => (response.ok ? response.json() as Promise<TripAddOnResponse> : { addOns: [] }))
    .catch(() => ({ addOns: [] }));

export const downloadTripItineraryPdf = async ({
  tripId,
  tripPayload,
}: DownloadTripItineraryPdfParams): Promise<{ fileName: string }> => {
  const [resolvedPayload, addOnsResult] = await Promise.all([
    tripPayload ? Promise.resolve(tripPayload) : fetchTripPayload(tripId),
    fetchTripAddOns(tripId),
  ]);

  const itinerary = buildPdfItinerary(resolvedPayload);
  if (!itinerary) {
    throw new Error("This trip does not have a printable itinerary yet.");
  }

  const fileName = `${sanitizePdfFileName(itinerary.trip_title)}_Itinerary.pdf`;

  await downloadItineraryPdf({
    itinerary,
    template: normalizeItineraryTemplateId(resolvedPayload.trip.itineraries?.template_id),
    branding: resolvedPayload.trip.profiles?.full_name
      ? { clientName: resolvedPayload.trip.profiles.full_name }
      : undefined,
    printExtras: buildPrintExtras(resolvedPayload, addOnsResult.addOns),
    fileName,
  });

  return { fileName };
};
