import { NextResponse } from "next/server";

/**
 * POST /api/social/ai-image
 * Generates AI background images for poster templates.
 *
 * Fetches images server-side from Pollinations to avoid client-side
 * CORS/timeout issues, and returns base64 data URLs that display instantly.
 *
 * Body: { prompt: string, width?: number, height?: number, count?: number }
 * Returns: { images: { url: string; provider: string }[] }
 */

// Allow up to 60 seconds for AI image generation
export const maxDuration = 60;

function buildPollinationsUrl(prompt: string, width: number, height: number, seed: number): string {
    const encoded = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
}

async function fetchImageAsDataUrl(url: string, timeoutMs = 45000): Promise<string | null> {
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
        if (buffer.byteLength < 1000) return null; // Too small to be a real image
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const base64 = Buffer.from(buffer).toString("base64");
        return `data:${contentType};base64,${base64}`;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            prompt,
            width = 1080,
            height = 1080,
            count = 4,
        } = body;

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "prompt is required" }, { status: 400 });
        }

        // Generate unique seeds for image diversity
        const seeds = Array.from({ length: count }, (_, i) =>
            Date.now() + i * 7919 + Math.floor(Math.random() * 10000)
        );

        // Fetch all images from Pollinations in parallel (server-side)
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

        return NextResponse.json({ images });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal error";
        console.error("[ai-image] Error:", err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
