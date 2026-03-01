import { NextRequest, NextResponse } from "next/server";
import { guardCostEndpoint, withCostGuardHeaders } from "@/lib/security/cost-endpoint-guard";

/**
 * POST /api/social/ai-image
 * Generates AI background images for poster templates.
 *
 * Body: { prompt: string, width?: number, height?: number, count?: number }
 * Returns: { images: { url: string; provider: string }[] }
 */

export const maxDuration = 60;

function buildPollinationsUrl(prompt: string, width: number, height: number, seed: number): string {
    const encoded = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
}

async function fetchImageAsDataUrl(url: string, timeoutMs = 45_000): Promise<string | null> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: "image/*" },
        });
        clearTimeout(timer);
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength < 1000) return null;
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const base64 = Buffer.from(buffer).toString("base64");
        return `data:${contentType};base64,${base64}`;
    } catch {
        return null;
    }
}

function maxCountByTier(tier: "free" | "pro" | "enterprise"): number {
    if (tier === "enterprise") return 8;
    if (tier === "pro") return 4;
    return 1;
}

function clampDimension(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(Math.max(Math.floor(parsed), 512), 1536);
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
            : Math.min(4, tierMax);

        const seeds = Array.from({ length: count }, (_, i) =>
            Date.now() + i * 7919 + Math.floor(Math.random() * 10000)
        );

        const results = await Promise.allSettled(
            seeds.map((seed) => {
                const url = buildPollinationsUrl(prompt, width, height, seed);
                return fetchImageAsDataUrl(url);
            })
        );

        const images: { url: string; provider: string }[] = [];
        for (const result of results) {
            if (result.status === "fulfilled" && result.value) {
                images.push({ url: result.value, provider: "pollinations" });
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
