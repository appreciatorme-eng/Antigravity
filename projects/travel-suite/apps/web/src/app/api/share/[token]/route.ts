import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        // Fetch comments and approval status
        const { data: share, error: shareError } = await supabaseAdmin
            .from('shared_itineraries')
            .select('*')
            .eq('share_code', token)
            .single();

        if (shareError || !share) {
            return NextResponse.json({ error: 'Share not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: share.status || 'viewed',
            approved_by: share.approved_by,
            approved_at: share.approved_at,
            comments: share.client_comments || []
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const body = await request.json();
        const { action } = body;

        const { data: share, error: shareError } = await supabaseAdmin
            .from('shared_itineraries')
            .select('id, itinerary_id, client_comments')
            .eq('share_code', token)
            .single();

        if (shareError || !share) {
            return NextResponse.json({ error: 'Share not found' }, { status: 404 });
        }

        if (action === 'comment') {
            const { author, comment } = body;
            const existingComments = share.client_comments || [];
            const newComment = {
                id: Math.random().toString(36).substr(2, 9),
                author,
                comment,
                created_at: new Date().toISOString()
            };

            const { error: updateError } = await supabaseAdmin
                .from('shared_itineraries')
                .update({
                    client_comments: [...existingComments, newComment],
                    status: 'commented'
                })
                .eq('id', share.id);

            if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
            return NextResponse.json({ success: true, comment: newComment });
        }

        if (action === 'approve') {
            const { name } = body;

            const { error: updateError } = await supabaseAdmin
                .from('shared_itineraries')
                .update({
                    status: 'approved',
                    approved_by: name,
                    approved_at: new Date().toISOString()
                })
                .eq('id', share.id);

            if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

            // Update parent itinerary status if it exists
            if (share.itinerary_id) {
                await supabaseAdmin
                    .from('itineraries')
                    .update({ status: 'approved' })
                    .eq('id', share.itinerary_id);
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
