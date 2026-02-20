import { createClient as createServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-builds",
});

export async function getSemanticMatch(prompt: string, destination: string, days: number) {
    if (!process.env.OPENAI_API_KEY) {
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

        // 2. Query Supabase for semantic match
        // similarity threshold = 0.90 (highly similar)
        const { data, error } = await (supabase as any).rpc('match_itineraries', {
            query_embedding: embedding,
            match_threshold: 0.90,
            match_count: 1,
            filter_destination: destination,
            filter_days: days
        });

        if (error) {
            console.error("Supabase RPC match_itineraries error:", error);
            return null;
        }

        if (data && Array.isArray(data) && data.length > 0) {
            return (data as any)[0].itinerary_data;
        }

        return null;
    } catch (error) {
        console.error("Semantic match extraction failed:", error);
        return null;
    }
}

export async function saveSemanticMatch(prompt: string, destination: string, days: number, itineraryData: any) {
    if (!process.env.OPENAI_API_KEY) {
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
        const { error } = await (supabase as any).from('itinerary_embeddings').insert({
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
