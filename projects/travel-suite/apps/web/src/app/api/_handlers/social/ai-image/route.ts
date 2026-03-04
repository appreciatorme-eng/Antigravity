import { NextRequest, NextResponse } from "next/server";
import { guardCostEndpoint, withCostGuardHeaders } from "@/lib/security/cost-endpoint-guard";
import { fal } from "@fal-ai/client";

/**
 * POST /api/social/ai-image
 * Generates AI background images for poster templates using FAL.ai Flux models.
 *
 * Body: { prompt: string, width?: number, height?: number, count?: number }
 * Returns: { images: { url: string; provider: string }[], requested, generated, tier_limit }
 */

export const maxDuration = 30;

fal.config({ credentials: process.env.FAL_KEY });

function maxCountByTier(tier: "free" | "pro" | "enterprise"): number {
    if (tier === "enterprise") return 8;
    if (tier === "pro") return 4;
    return 1;
}

function clampDimension(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(Math.max(Math.floor(parsed), 1024), 1536);
}

function selectModel(tier: "free" | "pro" | "enterprise"): string {
    if (tier === "enterprise") return "fal-ai/flux-pro/v1.1-ultra";
    return "fal-ai/flux/dev";
}

async function generateImage(
    model: string,
    prompt: string,
    width: number,
    height: number,
): Promise<string | null> {
    try {
        const isEnterprise = model.includes("flux-pro");
        const result = await fal.subscribe(model, {
            input: {
                prompt,
                image_size: { width, height },
                num_images: 1,
                enable_safety_checker: false,
                ...(isEnterprise
                    ? {}
                    : {
                          num_inference_steps: 30,
                          guidance_scale: 3.5,
                      }),
            },
        });

        const images = result.data?.images;
        if (!Array.isArray(images) || images.length === 0) return null;

        const url = images[0]?.url;
        return typeof url === "string" ? url : null;
    } catch (err) {
        console.error("[ai-image] FAL generation error:", err);
        return null;
    }
}

export async function POST(req: NextRequest) {
    const guard = await guardCostEndpoint(req, "ai_image");
    if (!guard.ok) return guard.response;

    try {
        const body = await req.json();
        const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

        if (!prompt) {
            return withCostGuardHeaders(
                NextResponse.json({ error: "prompt is required" }, { status: 400 }),
                guard.context
            );
        }

        const width = clampDimension(body?.width, 1080);
        const height = clampDimension(body?.height, 1080);
        const tierMax = maxCountByTier(guard.context.tier);
        const requestedCount = Number(body?.count);
        const count = Number.isFinite(requestedCount)
            ? Math.min(Math.max(Math.floor(requestedCount), 1), tierMax)
            : Math.min(1, tierMax);

        const model = selectModel(guard.context.tier);

        const results = await Promise.allSettled(
            Array.from({ length: count }, () =>
                generateImage(model, prompt, width, height)
            )
        );

        const images: { url: string; provider: string }[] = [];
        for (const result of results) {
            if (result.status === "fulfilled" && result.value) {
                images.push({ url: result.value, provider: "fal" });
            }
        }

        return withCostGuardHeaders(
            NextResponse.json({
                images,
                requested: count,
                generated: images.length,
                tier_limit: tierMax,
            }),
            guard.context
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal error";
        console.error("[ai-image] Error:", err);
        return withCostGuardHeaders(
            NextResponse.json({ error: message }, { status: 500 }),
            guard.context
        );
    }
}
