import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { createClient } from '@/lib/supabase/server';
import { safeErrorMessage } from "@/lib/security/safe-error";

export async function POST() {
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

        const orgId: string = profile.organization_id;

        // Fetch marketplace reviews
        const { data: marketplaceReviews, error: mError } = await supabase
            .from('marketplace_reviews')
            .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer_org:organizations!marketplace_reviews_reviewer_org_id_fkey(name)
      `)
            .eq('target_org_id', orgId);

        if (mError) throw mError;

        if (!marketplaceReviews || marketplaceReviews.length === 0) {
            return NextResponse.json({ message: 'No marketplace reviews found to import' });
        }

        const { data: existingReviews } = await supabase
            .from('social_reviews')
            .select('reviewer_name, comment')
            .eq('organization_id', orgId)
            .eq('source', 'marketplace');

        const existingSet = new Set(
            (existingReviews || []).map((r) => `${r.reviewer_name}::${r.comment}`)
        );

        const toInsert = marketplaceReviews
            .filter((review) => {
                if (!review.comment) return false;
                const reviewerOrg = review.reviewer_org as { name: string } | null;
                const reviewerName = reviewerOrg?.name || 'Marketplace Partner';
                return !existingSet.has(`${reviewerName}::${review.comment}`);
            })
            .map((review) => {
                const reviewerOrg = review.reviewer_org as { name: string } | null;
                return {
                    organization_id: orgId,
                    reviewer_name: reviewerOrg?.name || 'Marketplace Partner',
                    trip_name: 'Marketplace Collaboration',
                    rating: review.rating || 5,
                    comment: review.comment,
                    source: 'marketplace' as const,
                    created_at: review.created_at || new Date().toISOString(),
                };
            });

        if (toInsert.length > 0) {
            await supabase.from('social_reviews').insert(toInsert);
        }

        const importedCount = toInsert.length;

        return NextResponse.json({ message: `Successfully imported ${importedCount} reviews` });
    } catch (error: unknown) {
        console.error('Error importing reviews:', error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
