import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import type { FlightDetails, HotelDetails, ItineraryResult } from "@/types/itinerary";

const FlightSchema = z.object({
  id: z.string().min(1),
  airline: z.string().min(1),
  flight_number: z.string().min(1),
  departure_airport: z.string().min(1),
  arrival_airport: z.string().min(1),
  departure_time: z.string().min(1),
  arrival_time: z.string().min(1),
  price: z.number().optional(),
  currency: z.string().optional(),
  confirmation: z.string().optional(),
  source: z.enum(["manual", "amadeus"]).optional(),
});

const HotelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  check_in: z.string().min(1),
  check_out: z.string().min(1),
  price_per_night: z.number().optional(),
  currency: z.string().optional(),
  confirmation: z.string().optional(),
  source: z.enum(["manual", "amadeus"]).optional(),
});

const ImportBookingSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("flight"),
    flight: FlightSchema,
  }),
  z.object({
    type: z.literal("hotel"),
    hotel: HotelSchema,
  }),
]);

function toItineraryPayload(rawData: unknown): Partial<ItineraryResult> {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    return {};
  }
  return rawData as Partial<ItineraryResult>;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing itinerary id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ImportBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: itinerary, error: itineraryError } = await supabase
      .from("itineraries")
      .select("id, raw_data")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (itineraryError || !itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    const rawData = toItineraryPayload(itinerary.raw_data);
    const logistics = rawData.logistics ?? {};
    const flights = Array.isArray(logistics.flights) ? [...logistics.flights] : [];
    const hotels = Array.isArray(logistics.hotels) ? [...logistics.hotels] : [];

    if (parsed.data.type === "flight") {
      const nextFlight: FlightDetails = {
        ...parsed.data.flight,
        source: parsed.data.flight.source ?? "amadeus",
      };
      const withoutDuplicate = flights.filter((existing) => existing?.id !== nextFlight.id);
      withoutDuplicate.push(nextFlight);
      rawData.logistics = { ...logistics, flights: withoutDuplicate, hotels };
    } else {
      const nextHotel: HotelDetails = {
        ...parsed.data.hotel,
        source: parsed.data.hotel.source ?? "amadeus",
      };
      const withoutDuplicate = hotels.filter((existing) => existing?.id !== nextHotel.id);
      withoutDuplicate.push(nextHotel);
      rawData.logistics = { ...logistics, flights, hotels: withoutDuplicate };
    }

    const { error: updateError } = await supabase
      .from("itineraries")
      .update({
        raw_data: rawData as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      itineraryId: id,
      totals: {
        flights: rawData.logistics?.flights?.length ?? 0,
        hotels: rawData.logistics?.hotels?.length ?? 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
