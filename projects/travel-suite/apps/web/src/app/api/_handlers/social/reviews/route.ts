import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { SOCIAL_REVIEW_SELECT } from "@/lib/social/selects";
import { createClient } from '@/lib/supabase/server';
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { Database } from "@/lib/database.types";
import { logError } from "@/lib/observability/logger";

type SocialReviewRow = Database["public"]["Tables"]["social_reviews"]["Row"];

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return apiError('Unauthorized', 401);
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return apiError('No organization found', 400);
        }

        const { data: reviewsData, error } = await supabase
            .from('social_reviews')
            .select(SOCIAL_REVIEW_SELECT)
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });
        const reviews = reviewsData as unknown as SocialReviewRow[] | null;

        if (error) {
            throw error;
        }

        return NextResponse.json({ reviews });
    } catch (error: unknown) {
        logError('Error fetching social reviews', error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return apiError('Unauthorized', 401);
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return apiError('No organization found', 400);
        }

        const body = await req.json();
        const { reviewer_name, trip_name, destination, rating, comment } = body;

        const { data: reviewData, error } = await supabase
            .from('social_reviews')
            .insert({
                organization_id: profile.organization_id,
                reviewer_name,
                trip_name,
                destination,
                rating,
                comment,
                source: 'manual',
            })
            .select(SOCIAL_REVIEW_SELECT)
            .single();
        const review = reviewData as unknown as SocialReviewRow | null;

        if (error) throw error;

        return NextResponse.json({ review });
    } catch (error: unknown) {
        logError('Error creating manual review', error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
