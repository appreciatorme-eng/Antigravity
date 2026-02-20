/**
 * Geocoding with database caching
 * Server-side only - uses Supabase for persistent caching
 */

import { createClient } from '@supabase/supabase-js';

interface Coordinate {
    lat: number;
    lng: number;
}

interface GeocodeResult {
    coordinates: Coordinate;
    formattedAddress: string;
}

interface GeocodeError {
    error: string;
}

/**
 * Get geocoding result from database cache
 */
async function getFromCache(location: string): Promise<GeocodeResult | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const normalizedLocation = location.toLowerCase().trim();

    const { data, error } = await supabase
        .from('geocoding_cache')
        .select('latitude, longitude, formatted_address')
        .eq('location_query', normalizedLocation)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        coordinates: {
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
        },
        formattedAddress: data.formatted_address,
    };
}

/**
 * Save geocoding result to database cache
 */
async function saveToCache(
    location: string,
    result: GeocodeResult,
    provider: string = 'mapbox'
): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const normalizedLocation = location.toLowerCase().trim();

    await supabase.from('geocoding_cache').upsert(
        {
            location_query: normalizedLocation,
            latitude: result.coordinates.lat,
            longitude: result.coordinates.lng,
            formatted_address: result.formattedAddress,
            provider,
        },
        {
            onConflict: 'location_query',
        }
    );
}

/**
 * Geocode using Mapbox API
 */
async function geocodeWithMapbox(
    location: string,
    proximity?: [number, number]
): Promise<GeocodeResult | null> {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
        console.warn('NEXT_PUBLIC_MAPBOX_TOKEN not configured');
        return null;
    }

    try {
        const encodedLocation = encodeURIComponent(location);
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${mapboxToken}&limit=1`;

        if (proximity) {
            url += `&proximity=${proximity[0]},${proximity[1]}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Mapbox geocoding failed: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            return null;
        }

        const feature = data.features[0];
        const [lng, lat] = feature.center;

        return {
            coordinates: { lat, lng },
            formattedAddress: feature.place_name,
        };
    } catch (error) {
        console.error('Mapbox geocoding error:', error);
        return null;
    }
}

/**
 * Geocode a location with database caching
 * @param location - Location string to geocode
 * @param proximity - Optional proximity hint [lng, lat]
 * @returns GeocodeResult or null
 */
export async function geocodeLocation(
    location: string,
    proximity?: [number, number]
): Promise<GeocodeResult | null> {
    if (!location || location.trim().length === 0) {
        return null;
    }

    // Try cache first
    const cached = await getFromCache(location);
    if (cached) {
        return cached;
    }

    // Geocode with Mapbox
    const result = await geocodeWithMapbox(location, proximity);

    if (result) {
        // Save to cache for future use
        await saveToCache(location, result);
    }

    return result;
}

/**
 * Batch geocode locations with caching
 */
export async function batchGeocodeLocations(
    locations: string[],
    proximity?: [number, number]
): Promise<(GeocodeResult | null)[]> {
    const results: (GeocodeResult | null)[] = [];

    for (let i = 0; i < locations.length; i++) {
        const result = await geocodeLocation(locations[i], proximity);
        results.push(result);

        // Small delay between uncached requests
        if (i < locations.length - 1 && !result) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return results;
}

/**
 * Get city center coordinates
 */
export async function getCityCenter(cityName: string): Promise<[number, number] | null> {
    const result = await geocodeLocation(cityName);
    if (!result) return null;
    return [result.coordinates.lng, result.coordinates.lat];
}
