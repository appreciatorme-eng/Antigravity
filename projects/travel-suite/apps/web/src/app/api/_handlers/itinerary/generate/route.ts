import { NextRequest, NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { z } from 'zod';
import { createClient as createServerClient } from "@/lib/supabase/server";
import { generateItineraryForActor } from "@/lib/itinerary/generate-shared";

export const maxDuration = 60;

// Schema for input validation
const RequestSchema = z.object({
    prompt: z.string().min(2, "Prompt must be at least 2 characters"),
    days: z.number().min(1).max(14).default(3),
});


async function handleGenerateItineraryPost(req: NextRequest) {
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    if (!user) {
        return apiError("Unauthorized", 401);
    }

    let body: unknown = null;
    try {
        body = await req.json();
    } catch {
        return apiError("Invalid JSON body", 400);
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { prompt, days } = parsed.data;
    const { data: operatorProfile } = await serverClient
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    const organizationId = operatorProfile?.organization_id ?? null;

    try {
        const itinerary = await generateItineraryForActor({
            prompt,
            days,
            userId: user.id,
            organizationId,
            source: "planner_route",
        });
        return NextResponse.json(itinerary);
    } catch (error) {
        const status = typeof (error as { status?: unknown }).status === "number"
            ? (error as { status: number }).status
            : 500;
        const message = error instanceof Error ? error.message : "Failed to generate itinerary.";
        return apiError(message, status);
    }
}

export async function POST(req: NextRequest) {
    return handleGenerateItineraryPost(req);
}
