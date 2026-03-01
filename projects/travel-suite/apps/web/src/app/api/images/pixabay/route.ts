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

    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
        return withCostGuardHeaders(NextResponse.json({ url: null }, { status: 200 }), guard.context);
    }

    try {
        const response = await fetch(
            `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3&safesearch=true`,
            {
                next: { revalidate: 86400 }, // Cache for 24 hours
            }
        );

        if (!response.ok) {
            console.error("Pixabay API error:", response.status);
            return withCostGuardHeaders(NextResponse.json({ url: null }, { status: 200 }), guard.context);
        }

        const data = await response.json();

        if (data.hits && data.hits.length > 0) {
            const photo = data.hits[0];
            const imageUrl = photo.webformatURL;
            return withCostGuardHeaders(NextResponse.json({ url: imageUrl }), guard.context);
        }

        return withCostGuardHeaders(NextResponse.json({ url: null }, { status: 200 }), guard.context);
    } catch (error) {
        console.error("Pixabay fetch error:", error);
        return withCostGuardHeaders(NextResponse.json({ url: null }, { status: 200 }), guard.context);
    }
}
