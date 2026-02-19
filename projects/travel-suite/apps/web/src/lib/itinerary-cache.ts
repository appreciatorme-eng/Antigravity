/**
 * Itinerary Cache Utilities
 * Provides functions to interact with the itinerary cache system
 * for cost optimization by reducing Gemini API calls
 */

import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for cache operations
function getCacheClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase not configured - cache system disabled');
        return null;
    }

    return createClient(supabaseUrl, supabaseKey);
}

export interface CacheKey {
    destination: string;
    days: number;
    budget?: string;
    interests?: string[];
}

/**
 * Look up a cached itinerary by query parameters
 * Returns the cached itinerary data or null if cache miss
 */
export async function getCachedItinerary(
    destination: string,
    days: number,
    budget?: string,
    interests?: string[]
): Promise<any | null> {
    const client = getCacheClient();
    if (!client) return null;

    try {
        // Call the database function to get cached itinerary
        const { data, error } = await client.rpc('get_cached_itinerary', {
            p_destination: destination,
            p_days: days,
            p_budget: budget || null,
            p_interests: interests || null,
        });

        if (error) {
            console.error('Cache lookup error:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Cache lookup exception:', err);
        return null;
    }
}

/**
 * Save a generated itinerary to the cache
 * Returns the cache entry ID or null on failure
 */
export async function saveItineraryToCache(
    destination: string,
    days: number,
    budget: string | undefined,
    interests: string[] | undefined,
    itineraryData: any,
    userId?: string
): Promise<string | null> {
    const client = getCacheClient();
    if (!client) return null;

    try {
        // Call the database function to save itinerary
        const { data, error } = await client.rpc('save_itinerary_to_cache', {
            p_destination: destination,
            p_days: days,
            p_budget: budget || null,
            p_interests: interests || null,
            p_itinerary_data: itineraryData,
            p_created_by: userId || null,
        });

        if (error) {
            console.error('Cache save error:', error);
            return null;
        }

        return data; // Returns the cache_id
    } catch (err) {
        console.error('Cache save exception:', err);
        return null;
    }
}

/**
 * Get cache statistics for monitoring
 * Returns hit rate, API calls avoided, cost savings, etc.
 */
export async function getCacheStats(days: number = 30): Promise<any> {
    const client = getCacheClient();
    if (!client) return null;

    try {
        const { data, error } = await client.rpc('get_cache_stats', {
            p_days: days,
        });

        if (error) {
            console.error('Cache stats error:', error);
            return null;
        }

        return data?.[0] || null;
    } catch (err) {
        console.error('Cache stats exception:', err);
        return null;
    }
}

/**
 * Extract cache parameters from user prompt and parsed data
 * Normalizes inputs for consistent cache key generation
 */
export function extractCacheParams(prompt: string, itinerary: any): CacheKey {
    return {
        destination: itinerary.destination || extractDestinationFromPrompt(prompt),
        days: itinerary.duration_days || 3,
        budget: itinerary.budget || undefined,
        interests: Array.isArray(itinerary.interests) && itinerary.interests.length > 0
            ? itinerary.interests
            : undefined,
    };
}

function extractDestinationFromPrompt(prompt: string): string {
    // Best-effort: try to extract the first "for <destination>" clause.
    const m = prompt.match(/\bfor\s+([^.\n"]{2,80})/i);
    return (m?.[1] || prompt).trim().slice(0, 80);
}
