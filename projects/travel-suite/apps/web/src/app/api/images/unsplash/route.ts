import { NextRequest, NextResponse } from "next/server";
import { guardCostEndpoint, withCostGuardHeaders } from "@/lib/security/cost-endpoint-guard";

export async function GET(req: NextRequest) {
    const guard = await guardCostEndpoint(req, "image_search");
    if (!guard.ok) return guard.response;

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query) {
        return withCostGuardHeaders(
            NextResponse.json({ error: "Query parameter is required" }, { status: 400 }),
            guard.context
        );
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
        return withCostGuardHeaders(NextResponse.json({ url: null }, { status: 200 }), guard.context);
    }

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
            {
                headers: {
                    Authorization: `Client-ID ${accessKey}`,
                    "Accept-Version": "v1",
                },
                next: { revalidate: 86400 }, // Cache for 24 hours
            }
        );

        if (!response.ok) {
            console.error("Unsplash API error:", response.status);
            return withCostGuardHeaders(NextResponse.json({ url: null }, { status: 200 }), guard.context);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const photo = data.results[0];
            const imageUrl = photo.urls.regular;
            return withCostGuardHeaders(NextResponse.json({ url: imageUrl }), guard.context);
        }

        return withCostGuardHeaders(NextResponse.json({ url: null }, { status: 200 }), guard.context);
    } catch (error) {
        console.error("Unsplash fetch error:", error);
        return withCostGuardHeaders(NextResponse.json({ url: null }, { status: 200 }), guard.context);
    }
}
