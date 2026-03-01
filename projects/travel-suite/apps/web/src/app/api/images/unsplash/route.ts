import { NextRequest, NextResponse } from "next/server";
import { guardCostEndpoint, withCostGuardHeaders } from "@/lib/security/cost-endpoint-guard";

type UnsplashSearchResult = {
    id: string;
    urls?: {
        regular?: string;
    };
};

function clampPerPage(value: number): number {
    if (!Number.isFinite(value)) return 8;
    return Math.max(1, Math.min(8, Math.floor(value)));
}

export async function GET(req: NextRequest) {
    const guard = await guardCostEndpoint(req, "image_search");
    if (!guard.ok) return guard.response;

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query");
    const perPage = clampPerPage(Number(searchParams.get("per_page") || "8"));

    if (!query) {
        return withCostGuardHeaders(
            NextResponse.json({ error: "Query parameter is required" }, { status: 400 }),
            guard.context
        );
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
        return withCostGuardHeaders(
            NextResponse.json({
                url: null,
                results: [],
            }),
            guard.context
        );
    }

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
            {
                headers: {
                    Authorization: `Client-ID ${accessKey}`,
                    "Accept-Version": "v1",
                },
                next: { revalidate: 86400 },
            }
        );

        if (!response.ok) {
            console.error("Unsplash API error:", response.status);
            return withCostGuardHeaders(
                NextResponse.json({
                    url: null,
                    results: [],
                }),
                guard.context
            );
        }

        const data = (await response.json()) as { results?: UnsplashSearchResult[] };
        const normalizedResults = (Array.isArray(data.results) ? data.results : [])
            .map((photo) => {
                const url = photo.urls?.regular;
                if (!photo.id || !url) return null;
                return {
                    id: photo.id,
                    url,
                };
            })
            .filter((photo): photo is { id: string; url: string } => Boolean(photo));

        return withCostGuardHeaders(
            NextResponse.json({
                url: normalizedResults[0]?.url || null,
                results: normalizedResults,
            }),
            guard.context
        );
    } catch (error: unknown) {
        console.error("Unsplash fetch error:", error);
        return withCostGuardHeaders(
            NextResponse.json({
                url: null,
                results: [],
            }),
            guard.context
        );
    }
}
