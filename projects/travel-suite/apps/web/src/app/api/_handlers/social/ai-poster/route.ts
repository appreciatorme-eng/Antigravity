import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createClient as createServerClient } from "@/lib/supabase/server";

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
    try {
        const serverClient = await createServerClient();
        const { data: { user } } = await serverClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
        }

        const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

        if (!geminiApiKey) {
            return NextResponse.json({
                destination: "Custom Trip",
                price: "$1,299",
                offer: "Limited Time Offer",
                season: "Special Edition",
                services: ["Hotels", "Flights", "Tours"],
                bulletPoints: ["All Inclusive", "Luxury Stay"],
                suggestedUnsplashQuery: "travel"
            });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: posterSchema as any,
            },
        });

        const aiPrompt = `Generate travel template details based on this requirement: "${prompt}". 
    Create a catchy destination/headline, price, offer, and list of services/bullet points. 
    Also suggest a specific Unsplash query (e.g. 'switzerland landscape') that would fit well.`;

        const result = await model.generateContent(aiPrompt);
        const response = JSON.parse(result.response.text());

        return NextResponse.json(response);

    } catch (error) {
        console.error("AI Poster Error:", error);
        return NextResponse.json({ error: "Failed to generate poster" }, { status: 500 });
    }
}
