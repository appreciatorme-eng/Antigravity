import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from '@/lib/security/safe-error';
import { getTripAdvisorLocationDetails, getTripAdvisorReviews } from '@/lib/external/tripadvisor.server';
import { logError } from "@/lib/observability/logger";

const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY;

// POST /api/integrations/tripadvisor — save location ID and validate it
export async function POST(req: Request) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: true });
        if (!admin.ok) {
            return admin.response;
        }
        if (!admin.organizationId) {
            return apiError('No organization found', 403);
        }

        if (!TRIPADVISOR_API_KEY) {
            return apiError('TRIPADVISOR_API_KEY not configured', 500);
        }

        const body = (await req.json()) as { locationId?: string };
        const locationId = body.locationId?.trim();

        if (!locationId || !/^\d+$/.test(locationId)) {
            return apiError('Invalid location ID — must be a numeric TripAdvisor location ID', 400);
        }

        // Validate by hitting the TripAdvisor API
        let locationDetails;
        try {
            locationDetails = await getTripAdvisorLocationDetails(TRIPADVISOR_API_KEY, locationId);
        } catch {
            return apiError('Invalid location ID or TripAdvisor API error', 400);
        }

        const supabaseAdmin = admin.adminClient;
        const { error: upsertError } = await supabaseAdmin.from('organization_settings').upsert(
            {
                organization_id: admin.organizationId,
                tripadvisor_location_id: locationId,
                tripadvisor_connected_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id' }
        );
        if (upsertError) {
            return apiError('Failed to save TripAdvisor settings', 500);
        }

        return NextResponse.json({
            success: true,
            locationName: locationDetails.name,
            rating: locationDetails.rating,
            numReviews: locationDetails.num_reviews,
        });
    } catch (error: unknown) {
        logError('TripAdvisor connect error', error);
        return apiError(safeErrorMessage(error, "Request failed"), 500);
    }
}

// GET /api/integrations/tripadvisor — fetch recent reviews for the org
export async function GET(request: Request) {
    try {
        const admin = await requireAdmin(request, { requireOrganization: true });
        if (!admin.ok) {
            return admin.response;
        }
        if (!admin.organizationId) {
            return apiError('No organization found', 403);
        }

        if (!TRIPADVISOR_API_KEY) {
            return apiError('TRIPADVISOR_API_KEY not configured', 500);
        }

        const supabaseAdmin = admin.adminClient;

        const { data: settings } = await supabaseAdmin
            .from('organization_settings')
            .select('tripadvisor_location_id')
            .eq('organization_id', admin.organizationId)
            .single();

        if (!settings?.tripadvisor_location_id) {
            return NextResponse.json({ reviews: [], connected: false });
        }

        const reviews = await getTripAdvisorReviews(TRIPADVISOR_API_KEY, settings.tripadvisor_location_id);
        return NextResponse.json({ reviews, connected: true });
    } catch (error: unknown) {
        logError('TripAdvisor reviews fetch error', error);
        return apiError(safeErrorMessage(error, "Request failed"), 500);
    }
}
