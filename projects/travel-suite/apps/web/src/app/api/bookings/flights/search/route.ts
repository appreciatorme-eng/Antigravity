import { NextRequest, NextResponse } from "next/server";
import { guessIataCode, normalizeIataCode } from "@/lib/airport";
import { getAmadeusToken, resolveAmadeusBaseUrl } from "@/lib/external/amadeus";
import { fetchWithRetry } from "@/lib/network/retry";
import { guardCostEndpoint, withCostGuardHeaders } from "@/lib/security/cost-endpoint-guard";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime());
}

function resolveAirportCode(text: string, codeInput: string) {
  return normalizeIataCode(codeInput) || normalizeIataCode(guessIataCode(text)) || "";
}

export async function GET(request: NextRequest) {
  const guard = await guardCostEndpoint(request, "amadeus");
  if (!guard.ok) return guard.response;

  const origin = (request.nextUrl.searchParams.get("origin") || "").trim();
  const destination = (request.nextUrl.searchParams.get("destination") || "").trim();
  const originCodeInput = (request.nextUrl.searchParams.get("originCode") || "").trim();
  const destinationCodeInput = (request.nextUrl.searchParams.get("destinationCode") || "").trim();
  const departureDate = (request.nextUrl.searchParams.get("date") || "").trim();
  const returnDate = (request.nextUrl.searchParams.get("returnDate") || "").trim();
  const tripTypeRaw = (request.nextUrl.searchParams.get("tripType") || "one_way").trim();
  const tripType = tripTypeRaw === "round_trip" ? "round_trip" : "one_way";
  const adults = Math.min(parsePositiveInt(request.nextUrl.searchParams.get("adults"), 1), 9);

  const originCode = resolveAirportCode(origin, originCodeInput);
  const destinationCode = resolveAirportCode(destination, destinationCodeInput);

  if (!originCode || !destinationCode || !departureDate) {
    return withCostGuardHeaders(
      NextResponse.json(
        {
          error: "Origin, destination, and departure date are required",
        },
        { status: 400 }
      ),
      guard.context
    );
  }
  if (originCode === destinationCode) {
    return withCostGuardHeaders(
      NextResponse.json({ error: "Origin and destination must be different" }, { status: 400 }),
      guard.context
    );
  }
  if (!isValidDateInput(departureDate)) {
    return withCostGuardHeaders(
      NextResponse.json({ error: "Invalid departure date format. Use YYYY-MM-DD" }, { status: 400 }),
      guard.context
    );
  }
  if (tripType === "round_trip") {
    if (!returnDate || !isValidDateInput(returnDate)) {
      return withCostGuardHeaders(
        NextResponse.json(
          { error: "Valid return date is required for round-trip search" },
          { status: 400 }
        ),
        guard.context
      );
    }
    if (returnDate <= departureDate) {
      return withCostGuardHeaders(
        NextResponse.json({ error: "Return date must be after departure date" }, { status: 400 }),
        guard.context
      );
    }
  }

  try {
    const token = await getAmadeusToken();
    const amadeusBaseUrl = resolveAmadeusBaseUrl();

    const params = new URLSearchParams({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate,
      adults: String(adults),
      max: "30",
      currencyCode: "USD",
    });

    if (tripType === "round_trip" && returnDate) {
      params.set("returnDate", returnDate);
    }

    const response = await fetchWithRetry(
      `${amadeusBaseUrl}/v2/shopping/flight-offers?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
      {
        retries: 2,
        timeoutMs: 10000,
        baseDelayMs: 250,
      }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage =
        payload?.errors?.[0]?.detail ||
        payload?.errors?.[0]?.title ||
        payload?.error_description ||
        "Failed to fetch flight offers";
      return withCostGuardHeaders(
        NextResponse.json({ error: errorMessage }, { status: 502 }),
        guard.context
      );
    }

    return withCostGuardHeaders(
      NextResponse.json({
        data: Array.isArray(payload?.data) ? payload.data : [],
      }),
      guard.context
    );
  } catch (error) {
    return withCostGuardHeaders(
      NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Flight search failed",
        },
        { status: 500 }
      ),
      guard.context
    );
  }
}
