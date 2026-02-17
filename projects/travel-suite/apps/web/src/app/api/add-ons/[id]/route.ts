/**
 * Add-on Detail API Routes
 *
 * Endpoints for individual add-on operations
 * PUT /api/add-ons/[id] - Update add-on
 * DELETE /api/add-ons/[id] - Delete add-on
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();

    // Update add-on
    const { data: addon, error } = await supabase
      .from('add_ons')
      .update({
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        category: body.category,
        image_url: body.image_url,
        duration: body.duration,
        is_active: body.is_active,
      })
      .eq('id', id)
      .eq('organization_id', profile.organization_id) // Security: ensure user owns this add-on
      .select()
      .single();

    if (error) {
      console.error('Error updating add-on:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!addon) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
    }

    return NextResponse.json({ addon });
  } catch (error) {
    console.error('Error in PUT /api/add-ons/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check if add-on has purchases
    const { data: purchases } = await supabase
      .from('client_add_ons')
      .select('id')
      .eq('add_on_id', id)
      .limit(1);

    if (purchases && purchases.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete add-on with existing purchases. Consider deactivating it instead.',
        },
        { status: 400 }
      );
    }

    // Delete add-on
    const { error } = await supabase
      .from('add_ons')
      .delete()
      .eq('id', id)
      .eq('organization_id', profile.organization_id); // Security: ensure user owns this add-on

    if (error) {
      console.error('Error deleting add-on:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/add-ons/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
