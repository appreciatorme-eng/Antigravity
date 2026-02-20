/**
 * Geocoding utilities for converting location names to coordinates
 * Uses Mapbox Geocoding API with caching to minimize API calls
 */

interface Coordinate {
    lat: number;
    lng: number;
}

interface GeocodeResult {
    coordinates: Coordinate;
    formattedAddress: string;
}

// In-memory cache to avoid redundant API calls during a session
const geocodeCache = new Map<string, GeocodeResult>();

/**
 * Geocode a location string to coordinates using Mapbox API
 * @param location - Location string (e.g., "Marina Beach, Chennai")
 * @param proximity - Optional proximity hint [lng, lat] to bias results
 * @returns Coordinates and formatted address, or null if geocoding fails
 */
export async function geocodeLocation(
    location: string,
    proximity?: [number, number]
): Promise<GeocodeResult | null> {
    if (!location || location.trim().length === 0) {
        return null;
    }

    const cacheKey = `${location.toLowerCase()}|${proximity?.join(',') || ''}`;

    // Check in-memory cache first
    if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey)!;
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
        console.warn('NEXT_PUBLIC_MAPBOX_TOKEN not configured. Geocoding disabled.');
        return null;
    }

    try {
        const encodedLocation = encodeURIComponent(location);
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${mapboxToken}&limit=1`;

        // Add proximity bias if provided (helps with ambiguous locations)
        if (proximity) {
            url += `&proximity=${proximity[0]},${proximity[1]}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Mapbox geocoding failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            console.warn(`No geocoding results found for: ${location}`);
            return null;
        }

        const feature = data.features[0];
        const [lng, lat] = feature.center;

        const result: GeocodeResult = {
            coordinates: { lat, lng },
            formattedAddress: feature.place_name,
        };

        // Cache the result
        geocodeCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Batch geocode multiple locations
 * @param locations - Array of location strings
 * @param proximity - Optional proximity hint to bias all results
 * @returns Array of results in same order (null for failures)
 */
export async function batchGeocodeLocations(
    locations: string[],
    proximity?: [number, number]
): Promise<(GeocodeResult | null)[]> {
    // Geocode with small delay between requests to respect rate limits
    const results: (GeocodeResult | null)[] = [];

    for (let i = 0; i < locations.length; i++) {
        const result = await geocodeLocation(locations[i], proximity);
        results.push(result);

        // Small delay to avoid hitting rate limits (1 req/sec is safe)
        if (i < locations.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return results;
}

/**
 * Get city center coordinates from city name
 * Useful for getting a proximity hint for more accurate geocoding
 */
export async function getCityCenter(cityName: string): Promise<[number, number] | null> {
    const result = await geocodeLocation(cityName);
    if (!result) return null;
    return [result.coordinates.lng, result.coordinates.lat];
}

/**
 * Clear the geocoding cache (useful for testing)
 */
export function clearGeocodeCache(): void {
    geocodeCache.clear();
}
