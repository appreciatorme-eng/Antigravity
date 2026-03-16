import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
import { guardCostEndpoint, withCostGuardHeaders } from "@/lib/security/cost-endpoint-guard";
import { logError } from "@/lib/observability/logger";

export const maxDuration = 60;

const posterSchema = {
    type: SchemaType.OBJECT,
    properties: {
        destination: { type: SchemaType.STRING },
        price: { type: SchemaType.STRING },
        offer: { type: SchemaType.STRING },
        season: { type: SchemaType.STRING },
        services: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        },
        bulletPoints: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        },
        suggestedUnsplashQuery: { type: SchemaType.STRING }
    },
    required: ['destination', 'price', 'suggestedUnsplashQuery'],
};

export async function POST(req: NextRequest) {
    const guard = await guardCostEndpoint(req, "ai_poster");
    if (!guard.ok) return guard.response;

    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return withCostGuardHeaders(
                NextResponse.json({ error: "No prompt provided" }, { status: 400 }),
                guard.context
            );
        }

        const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

        if (!geminiApiKey) {
            logError("[ai-poster] GOOGLE_API_KEY not configured", undefined);
            return withCostGuardHeaders(
                NextResponse.json({ error: "AI service is not configured" }, { status: 503 }),
                guard.context
            );
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: posterSchema as ResponseSchema,
            },
        });

        const aiPrompt = `Generate travel template details based on this requirement: "${prompt}".
    Create a catchy destination/headline, price, offer, and list of services/bullet points.
    Also suggest a specific Unsplash query (e.g. 'switzerland landscape') that would fit well.`;

        const result = await model.generateContent(aiPrompt);
        const response = JSON.parse(result.response.text());

        return withCostGuardHeaders(
            NextResponse.json(response),
            guard.context
        );

    } catch (error) {
        logError("[ai-poster] Error", error);
        return withCostGuardHeaders(
            NextResponse.json({ error: "Failed to generate poster" }, { status: 500 }),
            guard.context
        );
    }
}
