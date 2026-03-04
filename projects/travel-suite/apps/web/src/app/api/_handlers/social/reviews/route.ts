import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
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

        const { data: reviews, error } = await supabase
            .from('social_reviews')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json({ reviews });
    } catch (error: any) {
        console.error('Error fetching social reviews:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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

        const body = await req.json();
        const { reviewer_name, trip_name, destination, rating, comment } = body;

        const { data: review, error } = await supabase
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
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ review });
    } catch (error: any) {
        console.error('Error creating manual review:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
