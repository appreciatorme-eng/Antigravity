/**
 * Add-on Detail API Routes
 *
 * Endpoints for individual add-on operations
 * GET /api/add-ons/[id] - Get single add-on
 * PUT /api/add-ons/[id] - Update add-on
 * PATCH /api/add-ons/[id] - Partial update add-on
 * DELETE /api/add-ons/[id] - Delete add-on
 */

import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api-response";
import { createClient } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/security/sanitize';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return apiError('No organization found', 404);
    }

    const { data: addon, error } = await supabase
      .from('add_ons')
      .select('id, name, description, price, category, image_url, duration, is_active, created_at, updated_at')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (error || !addon) {
      return apiError('Add-on not found', 404);
    }

    return NextResponse.json({ addon });
  } catch (error) {
    console.error('Error in GET /api/add-ons/[id]:', error);
    return apiError('Internal server error', 500);
  }
}

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
      return apiError('Unauthorized', 401);
    }

    // Get organization ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError('No organization found', 404);
    }

    const body = await request.json();

    const updatePayload: Record<string, unknown> = {};
    if (body.name !== undefined) {
      updatePayload.name = sanitizeText(body.name, { maxLength: 200, stripHtml: true });
    }
    if (body.description !== undefined) {
      updatePayload.description = body.description
        ? sanitizeText(body.description, { maxLength: 1000, stripHtml: true })
        : null;
    }
    if (body.price !== undefined) {
      const price = parseFloat(body.price);
      if (isNaN(price) || price < 0) {
        return apiError('Price must be zero or greater', 400);
      }
      updatePayload.price = price;
    }
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.image_url !== undefined) updatePayload.image_url = body.image_url;
    if (body.duration !== undefined) updatePayload.duration = body.duration;
    if (body.is_active !== undefined) updatePayload.is_active = body.is_active;

    // Update add-on
    const { data: addon, error } = await supabase
      .from('add_ons')
      .update(updatePayload)
      .eq('id', id)
      .eq('organization_id', profile.organization_id) // Security: ensure user owns this add-on
      .select()
      .single();

    if (error) {
      console.error('Error updating add-on:', error);
      return apiError("Failed to update add-on", 500);
    }

    if (!addon) {
      return apiError('Add-on not found', 404);
    }

    return NextResponse.json({ addon });
  } catch (error) {
    console.error('Error in PUT /api/add-ons/[id]:', error);
    return apiError('Internal server error', 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
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
      return apiError('Unauthorized', 401);
    }

    // Get organization ID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError('No organization found', 404);
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
      return apiError("Failed to delete add-on", 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/add-ons/[id]:', error);
    return apiError('Internal server error', 500);
  }
}
