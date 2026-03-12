/**
 * Add-ons API Routes
 *
 * Endpoints for managing add-ons (upsell products)
 * GET /api/add-ons - List all add-ons
 * POST /api/add-ons - Create new add-on
 */

import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api-response";
import { createClient } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/security/sanitize';

export async function GET(request: Request) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Build query
    let query = supabase
      .from('add_ons')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    // Filter by category if provided
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data: addOns, error } = await query;

    if (error) {
      console.error('Error fetching add-ons:', error);
      return apiError("Failed to fetch add-ons", 500);
    }

    return NextResponse.json({ addOns });
  } catch (error) {
    console.error('Error in GET /api/add-ons:', error);
    return apiError('Internal server error', 500);
  }
}

export async function POST(request: Request) {
  try {
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

    const name = sanitizeText(body.name, { maxLength: 200, stripHtml: true });
    const description = body.description
      ? sanitizeText(body.description, { maxLength: 1000, stripHtml: true })
      : null;
    const price = parseFloat(body.price);

    if (!name || isNaN(price) || !body.category) {
      return apiError('Missing required fields: name, price, category', 400);
    }

    if (price < 0) {
      return apiError('Price must be zero or greater', 400);
    }

    // Create new add-on
    const { data: addon, error } = await supabase
      .from('add_ons')
      .insert({
        organization_id: profile.organization_id,
        name,
        description,
        price,
        category: body.category,
        image_url: body.image_url || null,
        duration: body.duration || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating add-on:', error);
      return apiError("Failed to create add-on", 500);
    }

    return NextResponse.json({ addon }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/add-ons:', error);
    return apiError('Internal server error', 500);
  }
}
