import { NextRequest, NextResponse } from "next/server";
import { geocodeLocation } from "@/lib/geocoding-with-cache";
import {
    diagnosticsUnauthorizedResponse,
    isDiagnosticsTokenAuthorized,
} from "@/lib/security/diagnostics-auth";

/**
 * Test endpoint to verify geocoding is working
 * GET /api/test-geocoding?location=Tokyo
 */
export async function GET(req: NextRequest) {
    if (!isDiagnosticsTokenAuthorized(req)) {
        return diagnosticsUnauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location") || "Senso-ji Temple, Tokyo";

    try {
        const result = await geocodeLocation(location);

        return NextResponse.json({
            success: true,
            location,
            result,
            message: result
                ? `Successfully geocoded: ${location}`
                : "Geocoding returned null - check logs for details",
        });
    } catch (error) {
        console.error("Geocoding test error:", error);
        return NextResponse.json(
            {
                success: false,
                location,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
