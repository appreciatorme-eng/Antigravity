import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { guardCostEndpoint, withCostGuardHeaders } from "@/lib/security/cost-endpoint-guard";
import type { CostEndpointCategory } from "@/lib/security/cost-endpoint-guard";
import { fal } from "@fal-ai/client";
import { logError } from "@/lib/observability/logger";

/**
 * POST /api/social/ai-image
 * Generates AI images for poster templates using FAL.ai Flux models.
 *
 * Supports two modes:
 *   - "background" (default): Generates a background photo (flux/dev or flux-pro)
 *   - "poster": Generates a complete composed poster with text baked in
 *     (always flux-pro, higher steps & guidance for text quality)
 *
 * Body: { prompt, width?, height?, count?, mode?: "background" | "poster" }
 * Returns: { images, requested, generated, tier_limit, mode }
 */

export const maxDuration = 60;

fal.config({ credentials: process.env.FAL_KEY });

type GenerationMode = "background" | "poster";

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

function selectModel(tier: "free" | "pro" | "enterprise", mode: GenerationMode): string {
    if (mode === "poster") return "fal-ai/flux-pro/v1.1-ultra";
    if (tier === "enterprise") return "fal-ai/flux-pro/v1.1-ultra";
    return "fal-ai/flux/dev";
}

function getCostCategory(mode: GenerationMode): CostEndpointCategory {
    return mode === "poster" ? "ai_poster" : "ai_image";
}

interface GenerationConfig {
    numInferenceSteps: number;
    guidanceScale: number;
}

function getGenerationConfig(mode: GenerationMode, model: string): GenerationConfig {
    if (mode === "poster") {
        return { numInferenceSteps: 50, guidanceScale: 4.5 };
    }
    const isEnterprise = model.includes("flux-pro");
    if (isEnterprise) {
        return { numInferenceSteps: 40, guidanceScale: 3.5 };
    }
    return { numInferenceSteps: 30, guidanceScale: 3.5 };
}

async function generateImage(
    model: string,
    prompt: string,
    width: number,
    height: number,
    config: GenerationConfig,
): Promise<string | null> {
    try {
        const result = await fal.subscribe(model, {
            input: {
                prompt,
                image_size: { width, height },
                num_images: 1,
                enable_safety_checker: true,
                num_inference_steps: config.numInferenceSteps,
                guidance_scale: config.guidanceScale,
            },
        });

        const images = result.data?.images;
        if (!Array.isArray(images) || images.length === 0) return null;

        const url = images[0]?.url;
        return typeof url === "string" ? url : null;
    } catch (err) {
        logError("[ai-image] FAL generation error", err);
        return null;
    }
}

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return apiError("Invalid JSON body", 400);
    }

    const mode: GenerationMode =
        body?.mode === "poster" ? "poster" : "background";

    const costCategory = getCostCategory(mode);
    const guard = await guardCostEndpoint(req, costCategory);
    if (!guard.ok) return guard.response;

    try {
        const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

        if (!prompt) {
            return withCostGuardHeaders(
                NextResponse.json({ error: "prompt is required" }, { status: 400 }),
                guard.context
            );
        }

        const width = clampDimension(body?.width, 1080);
        const height = clampDimension(body?.height, 1080);

        // Poster mode: always 1 image (premium quality over quantity)
        const tierMax = mode === "poster" ? 1 : maxCountByTier(guard.context.tier);
        const requestedCount = Number(body?.count);
        const count = mode === "poster"
            ? 1
            : Number.isFinite(requestedCount)
                ? Math.min(Math.max(Math.floor(requestedCount), 1), tierMax)
                : Math.min(1, tierMax);

        const model = selectModel(guard.context.tier, mode);
        const config = getGenerationConfig(mode, model);

        const results = await Promise.allSettled(
            Array.from({ length: count }, () =>
                generateImage(model, prompt, width, height, config)
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
                mode,
            }),
            guard.context
        );
    } catch (err: unknown) {
        logError(`[ai-${mode}] Error`, err);
        return withCostGuardHeaders(
            NextResponse.json({ error: "Image generation failed" }, { status: 500 }),
            guard.context
        );
    }
}
