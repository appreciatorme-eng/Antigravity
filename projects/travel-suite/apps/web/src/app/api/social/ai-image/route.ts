import { NextResponse } from "next/server";

/**
 * POST /api/social/ai-image
 * Generates AI background images for poster templates.
 *
 * Providers (in priority order):
 *  1. Pollinations – completely free, no API key, URL-based
 *  2. Together AI  – free tier FLUX.1 schnell, needs TOGETHER_API_KEY
 *
 * Body: { prompt: string, width?: number, height?: number, provider?: "pollinations" | "together", count?: number }
 * Returns: { images: { url: string; provider: string }[] }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            prompt,
            width = 1080,
            height = 1080,
            provider = "pollinations",
            count = 4,
        } = body;

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "prompt is required" }, { status: 400 });
        }

        const images: { url: string; provider: string }[] = [];

        if (provider === "together" && process.env.TOGETHER_API_KEY) {
            // Together AI – FLUX.1 schnell (free tier)
            const togetherRes = await fetch("https://api.together.xyz/v1/images/generations", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "black-forest-labs/FLUX.1-schnell-Free",
                    prompt,
                    width,
                    height,
                    steps: 4,
                    n: Math.min(count, 4),
                }),
            });

            if (togetherRes.ok) {
                const data = await togetherRes.json();
                for (const img of data.data || []) {
                    if (img.url) images.push({ url: img.url, provider: "together" });
                }
            }
        }

        // Pollinations fallback / primary – URL IS the image, no fetch needed
        if (provider === "pollinations" || images.length < count) {
            const needed = count - images.length;
            for (let i = 0; i < needed; i++) {
                // Each variation uses a unique seed for diversity
                const seed = Date.now() + i * 1000 + Math.floor(Math.random() * 10000);
                const encoded = encodeURIComponent(prompt);
                const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;
                images.push({ url, provider: "pollinations" });
            }
        }

        return NextResponse.json({ images });
    } catch (err: any) {
        console.error("[ai-image] Error:", err);
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    }
}
