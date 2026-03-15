/**
 * Add-ons API Routes
 *
 * Endpoints for managing add-ons (upsell products)
 * GET /api/add-ons - List all add-ons
 * POST /api/add-ons - Create new add-on
 */

import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { ADD_ON_SELECT } from "@/lib/business/selects";
import { createClient } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/security/sanitize';
import type { Database } from '@/lib/database.types';

type AddOnRow = Database["public"]["Tables"]["add_ons"]["Row"];

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
    const cursor = searchParams.get("cursor") || null;
    const limitRaw = Number(searchParams.get("limit") || "50");
    const limit = Math.min(Math.max(1, Number.isNaN(limitRaw) ? 50 : limitRaw), 100);

    // Build query
    let query = supabase
      .from('add_ons')
      .select(ADD_ON_SELECT)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    // Filter by category if provided
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: addOnsData, error } = await query.limit(limit);
    const addOns = addOnsData as unknown as AddOnRow[] | null;

    if (error) {
      console.error('Error fetching add-ons:', error);
      return apiError("Failed to fetch add-ons", 500);
    }

    const rows = addOns ?? [];
    const nextCursor = rows.length === limit ? rows[rows.length - 1]?.created_at ?? null : null;
    return NextResponse.json({ addOns: rows, nextCursor, hasMore: nextCursor !== null });
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
    const { data: addonData, error } = await supabase
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
      .select(ADD_ON_SELECT)
      .single();
    const addon = addonData as unknown as AddOnRow | null;

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
