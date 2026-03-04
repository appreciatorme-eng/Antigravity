import { NextRequest, NextResponse } from "next/server";
import { getWeatherForLocation, getWeatherForLocations, type LocationWeather } from "@/lib/external/weather";
import { getCachedJson, setCachedJson } from "@/lib/cache/upstash";

const WEATHER_TTL_SECONDS = 6 * 60 * 60;
const WEATHER_CACHE_HEADERS = {
    "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
};

interface MultiLocationWeatherResponse {
    locations: Record<string, LocationWeather>;
    requested: string[];
    found: string[];
}

function normalizedLocationKey(location: string): string {
    return location.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * GET /api/weather?location=Paris
 * GET /api/weather?locations=Paris,Rome,Barcelona
 * 
 * Returns weather forecast for location(s)
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get("location");
    const locations = searchParams.get("locations");
    const days = parseInt(searchParams.get("days") || "7", 10);

    // Validate days parameter
    const forecastDays = Math.min(Math.max(days, 1), 16); // Open-Meteo supports up to 16 days

    try {
        // Single location
        if (location) {
            const cacheKey = `weather:single:v1:${normalizedLocationKey(location)}:${forecastDays}`;
            const cached = await getCachedJson<LocationWeather>(cacheKey);
            if (cached) {
                return NextResponse.json(cached, { headers: WEATHER_CACHE_HEADERS });
            }

            const weather = await getWeatherForLocation(location, forecastDays);

            if (!weather) {
                return NextResponse.json(
                    { error: `Could not find weather data for: ${location}` },
                    { status: 404 }
                );
            }

            await setCachedJson(cacheKey, weather, WEATHER_TTL_SECONDS);
            return NextResponse.json(weather, { headers: WEATHER_CACHE_HEADERS });
        }

        // Multiple locations
        if (locations) {
            const locationList = locations.split(",").map(l => l.trim()).filter(Boolean);

            if (locationList.length === 0) {
                return NextResponse.json(
                    { error: "No valid locations provided" },
                    { status: 400 }
                );
            }

            if (locationList.length > 10) {
                return NextResponse.json(
                    { error: "Maximum 10 locations per request" },
                    { status: 400 }
                );
            }

            const normalizedLocations = [...locationList].map(normalizedLocationKey).sort();
            const cacheKey = `weather:multi:v1:${normalizedLocations.join(",")}:${forecastDays}`;
            const cached = await getCachedJson<MultiLocationWeatherResponse>(cacheKey);
            if (cached) {
                return NextResponse.json(cached, { headers: WEATHER_CACHE_HEADERS });
            }

            const weatherData = await getWeatherForLocations(locationList, forecastDays);
            const payload: MultiLocationWeatherResponse = {
                locations: weatherData,
                requested: locationList,
                found: Object.keys(weatherData),
            };

            await setCachedJson(cacheKey, payload, WEATHER_TTL_SECONDS);
            return NextResponse.json(payload, { headers: WEATHER_CACHE_HEADERS });
        }

        return NextResponse.json(
            { error: "Provide 'location' or 'locations' query parameter" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Weather API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch weather data" },
            { status: 500 }
        );
    }
}
