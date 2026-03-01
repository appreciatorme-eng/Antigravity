
import { NextRequest, NextResponse } from 'next/server';
import { getWikimediaImage } from '@/lib/external/wikimedia';
import { guardCostEndpoint, withCostGuardHeaders } from "@/lib/security/cost-endpoint-guard";

export async function GET(req: NextRequest) {
    const guard = await guardCostEndpoint(req, "image_search");
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
        return withCostGuardHeaders(
            NextResponse.json({ error: "Missing query" }, { status: 400 }),
            guard.context
        );
    }

    const imageUrl = await getWikimediaImage(query);

    return withCostGuardHeaders(NextResponse.json({ url: imageUrl }), guard.context);
}
