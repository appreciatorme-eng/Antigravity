import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

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
            .eq('target_org_id', profile.organization_id);

        if (mError) throw mError;

        if (!marketplaceReviews || marketplaceReviews.length === 0) {
            return NextResponse.json({ message: 'No marketplace reviews found to import' });
        }

        let importedCount = 0;

        for (const review of marketplaceReviews) {
            // Check if we already imported this one by looking for a matching comment/reviewer
            const reviewerName = (review.reviewer_org as any)?.name || 'Marketplace Partner';

            const { data: existing } = await supabase
                .from('social_reviews')
                .select('id')
                .eq('organization_id', profile.organization_id)
                .eq('reviewer_name', reviewerName)
                .eq('source', 'marketplace')
                .eq('comment', review.comment || '')
                .maybeSingle();

            if (!existing && review.comment) { // Only import if it has text
                await supabase.from('social_reviews').insert({
                    organization_id: profile.organization_id,
                    reviewer_name: reviewerName,
                    trip_name: 'Marketplace Collaboration',
                    rating: review.rating || 5,
                    comment: review.comment,
                    source: 'marketplace',
                    created_at: review.created_at || new Date().toISOString(),
                });
                importedCount++;
            }
        }

        return NextResponse.json({ message: `Successfully imported ${importedCount} reviews` });
    } catch (error: any) {
        console.error('Error importing reviews:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
