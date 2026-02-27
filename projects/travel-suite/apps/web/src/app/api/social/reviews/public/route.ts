import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const supabaseAdmin = createAdminClient();
        const body = await req.json();
        const { token, rating, comment, trip_name, destination, reviewer_name } = body;

        if (!rating || !comment || !reviewer_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let organization_id = null;

        // 1. Try to find organization via shared itinerary (since portal uses tokens)
        if (token) {
            // Look up shared itinerary
            const { data: share } = await supabaseAdmin
                .from('shared_itineraries')
                .select('itinerary_id')
                .eq('share_code', token)
                .maybeSingle();

            if (share?.itinerary_id) {
                // Find org from itinerary
                const { data: itinerary } = await supabaseAdmin
                    .from('itineraries')
                    .select('user_id')
                    .eq('id', share.itinerary_id)
                    .maybeSingle();

                if (itinerary?.user_id) {
                    const { data: profile } = await supabaseAdmin
                        .from('profiles')
                        .select('organization_id')
                        .eq('id', itinerary.user_id)
                        .maybeSingle();

                    if (profile?.organization_id) {
                        organization_id = profile.organization_id;
                    }
                }
            }

            // 2. Try proposals if not found
            if (!organization_id) {
                const { data: proposal } = await supabaseAdmin
                    .from('proposals')
                    .select('created_by')
                    .eq('share_token', token)
                    .maybeSingle();

                if (proposal?.created_by) {
                    const { data: profile } = await supabaseAdmin
                        .from('profiles')
                        .select('organization_id')
                        .eq('id', proposal.created_by)
                        .maybeSingle();

                    if (profile?.organization_id) {
                        organization_id = profile.organization_id;
                    }
                }
            }
        }

        // Fallback for demo purposes if we couldn't resolve from token or token was missing
        // Since portal uses MOCK_TRIP right now, no real tokens exist for those.
        if (!organization_id) {
            const { data: anyOrg } = await supabaseAdmin
                .from('organizations')
                .select('id')
                .limit(1)
                .single();

            if (anyOrg?.id) {
                organization_id = anyOrg.id;
            } else {
                return NextResponse.json({ error: 'No organization found to attach review to' }, { status: 400 });
            }
        }

        // Insert into social_reviews
        const { data: review, error } = await supabaseAdmin
            .from('social_reviews')
            .insert({
                organization_id,
                reviewer_name,
                trip_name,
                destination,
                rating,
                comment,
                source: 'client_portal',
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Auto-generate post if 4+ stars
        if (rating >= 4) {
            // Pick a random review template ID (e.g., social_review_1, social_review_2)
            const reviewTemplateIds = ['social_review_1', 'social_review_2'];
            const template_id = reviewTemplateIds[Math.floor(Math.random() * reviewTemplateIds.length)];

            const template_data = {
                rating,
                reviewerName: reviewer_name,
                reviewText: comment,
                tripName: trip_name,
                destination,
            };

            // Create draft post
            const { error: postError } = await supabaseAdmin
                .from('social_posts')
                .insert({
                    organization_id,
                    template_id,
                    template_data,
                    source: 'auto_review',
                    status: 'draft',
                });

            if (postError) {
                console.error('Failed to auto-generate post for review:', postError);
            }
        }

        return NextResponse.json({ success: true, review });
    } catch (error: any) {
        console.error('Error submitting public review:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
