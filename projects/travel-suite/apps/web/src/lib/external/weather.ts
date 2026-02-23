/**
 * Open-Meteo Weather API Integration
 * Free tier: 10,000 calls/day
 * No API key required
 * 
 * @see https://open-meteo.com
 */
import { fetchWithRetry } from "@/lib/network/retry";
import { z } from "zod";

export interface WeatherForecast {
    date: string;
    tempMax: number;
    tempMin: number;
    precipitation: number;
    weatherCode: number;
    weatherDescription: string;
}

export interface LocationWeather {
    location: string;
    latitude: number;
    longitude: number;
    timezone: string;
    forecast: WeatherForecast[];
}

// Weather code to description mapping (WMO codes)
const weatherCodeDescriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
};

const OpenMeteoGeocodeSchema = z.object({
    results: z
        .array(
            z.object({
                latitude: z.number(),
                longitude: z.number(),
                name: z.string(),
            })
        )
        .optional(),
});

const OpenMeteoForecastSchema = z.object({
    daily: z.object({
        time: z.array(z.string()),
        temperature_2m_max: z.array(z.number()),
        temperature_2m_min: z.array(z.number()),
        precipitation_sum: z.array(z.number()),
        weathercode: z.array(z.number()),
    }),
});

/**
 * Geocode a location name to get coordinates
 */
async function geocodeLocation(locationName: string): Promise<{ lat: number; lon: number; name: string } | null> {
    try {
        const response = await fetchWithRetry(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`,
            undefined,
            { retries: 2, timeoutMs: 5000 }
        );

        if (!response.ok) {
            console.error(`Geocoding failed for ${locationName}:`, response.status);
            return null;
        }

        const data = await response.json();
        const parsed = OpenMeteoGeocodeSchema.safeParse(data);
        if (!parsed.success) {
            console.error(`Invalid geocoding payload for ${locationName}:`, parsed.error.flatten());
            return null;
        }

        if (!parsed.data.results || parsed.data.results.length === 0) {
            console.warn(`No geocoding results for: ${locationName}`);
            return null;
        }

        const result = parsed.data.results[0];
        return {
            lat: result.latitude,
            lon: result.longitude,
            name: result.name,
        };
    } catch (error) {
        console.error(`Geocoding error for ${locationName}:`, error);
        return null;
    }
}

/**
 * Fetch 7-day weather forecast for coordinates
 */
async function fetchWeatherForecast(
    latitude: number,
    longitude: number,
    days: number = 7
): Promise<WeatherForecast[]> {
    try {
        const response = await fetchWithRetry(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&forecast_days=${days}&timezone=auto`,
            undefined,
            { retries: 2, timeoutMs: 5000 }
        );

        if (!response.ok) {
            console.error(`Weather API failed:`, response.status);
            return [];
        }

        const data = await response.json();
        const parsed = OpenMeteoForecastSchema.safeParse(data);
        if (!parsed.success) {
            console.error("Invalid weather payload:", parsed.error.flatten());
            return [];
        }

        const daily = parsed.data.daily;
        const lengths = [
            daily.time.length,
            daily.temperature_2m_max.length,
            daily.temperature_2m_min.length,
            daily.precipitation_sum.length,
            daily.weathercode.length,
        ];
        const minLength = Math.min(...lengths);
        if (minLength === 0) return [];

        const forecasts: WeatherForecast[] = [];
        for (let i = 0; i < minLength; i++) {
            const code = daily.weathercode[i];
            forecasts.push({
                date: daily.time[i],
                tempMax: Math.round(daily.temperature_2m_max[i]),
                tempMin: Math.round(daily.temperature_2m_min[i]),
                precipitation: daily.precipitation_sum[i],
                weatherCode: code,
                weatherDescription: weatherCodeDescriptions[code] || "Unknown",
            });
        }

        return forecasts;
    } catch (error) {
        console.error(`Weather fetch error:`, error);
        return [];
    }
}

/**
 * Get weather forecast for a location by name
 */
export async function getWeatherForLocation(
    locationName: string,
    days: number = 7
): Promise<LocationWeather | null> {
    const coords = await geocodeLocation(locationName);

    if (!coords) {
        return null;
    }

    const forecast = await fetchWeatherForecast(coords.lat, coords.lon, days);

    return {
        location: coords.name,
        latitude: coords.lat,
        longitude: coords.lon,
        timezone: "auto",
        forecast,
    };
}

/**
 * Get weather forecast for multiple locations
 */
export async function getWeatherForLocations(
    locationNames: string[],
    days: number = 7
): Promise<Record<string, LocationWeather>> {
    const results: Record<string, LocationWeather> = {};

    // Deduplicate and fetch in parallel
    const uniqueLocations = [...new Set(locationNames)];

    await Promise.all(
        uniqueLocations.map(async (location) => {
            const weather = await getWeatherForLocation(location, days);
            if (weather) {
                results[location] = weather;
            }
        })
    );

    return results;
}

/**
 * Get weather icon based on weather code
 */
export function getWeatherIcon(code: number): string {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 57) return "🌧️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code <= 86) return "🌨️";
    if (code >= 95) return "⛈️";
    return "🌡️";
}
