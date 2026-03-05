import { createClient as createServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const DEFAULT_MATCH_THRESHOLD = 0.8;

function resolveSemanticMatchThreshold(): number {
    const raw = Number(process.env.SEMANTIC_CACHE_MATCH_THRESHOLD);
    if (Number.isFinite(raw) && raw > 0) {
        return Math.max(0.5, Math.min(raw, 0.98));
    }
    return DEFAULT_MATCH_THRESHOLD;
}

export async function getSemanticMatch(prompt: string, destination: string, days: number) {
    if (!openai) {
        return null;
    }

    try {
        const supabase = await createServerClient();

        // 1. Generate embedding for the prompt
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: prompt,
            dimensions: 1536,
        });

        const embedding = embeddingResponse.data[0].embedding;

        // 2. Query Supabase for semantic match.
        // Lower threshold to increase cache reuse and reduce LLM cost.
        // The 'match_itineraries' RPC is not in the generated Supabase types,
        // so we cast through unknown to call it with proper params.
        const rpc = supabase.rpc as unknown as (
            fn: string,
            params: Record<string, unknown>
        ) => Promise<{ data: Array<{ itinerary_data: unknown }> | null; error: { message: string } | null }>;

        const { data, error } = await rpc('match_itineraries', {
            query_embedding: embedding,
            match_threshold: resolveSemanticMatchThreshold(),
            match_count: 1,
            filter_destination: destination,
            filter_days: days
        });

        if (error) {
            console.error("Supabase RPC match_itineraries error:", error);
            return null;
        }

        if (data && Array.isArray(data) && data.length > 0) {
            return (data as Array<{ itinerary_data: unknown }>)[0].itinerary_data;
        }

        return null;
    } catch (error) {
        console.error("Semantic match extraction failed:", error);
        return null;
    }
}

export async function saveSemanticMatch(prompt: string, destination: string, days: number, itineraryData: unknown) {
    if (!openai) {
        return null;
    }

    try {
        const supabase = await createServerClient();

        // 1. Generate embedding
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: prompt,
            dimensions: 1536,
        });

        const embedding = embeddingResponse.data[0].embedding;

        // 2. Insert into Supabase
        // The 'itinerary_embeddings' table is not in the generated Supabase types.
        const fromFn = supabase.from as unknown as (
            table: string
        ) => { insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };

        const { error } = await fromFn('itinerary_embeddings').insert({
            query_text: prompt,
            destination,
            duration_days: days,
            embedding,
            itinerary_data: itineraryData
        });

        if (error) {
            console.error("Failed to insert semantic itinerary:", error);
        }
    } catch (error) {
        console.error("Failed to save semantic match:", error);
    }
}
