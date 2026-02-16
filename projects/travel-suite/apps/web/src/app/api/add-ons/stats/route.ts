/**
 * Add-ons Stats API
 *
 * GET /api/add-ons/stats - Revenue and analytics for add-ons
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

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

    // Calculate start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get sales data for current month
    const { data: sales, error: salesError } = await supabase
      .from('client_add_ons')
      .select('amount_paid, add_on_id, add_ons!inner(name, organization_id)')
      .eq('add_ons.organization_id', profile.organization_id)
      .gte('purchased_at', startOfMonth)
      .eq('status', 'confirmed');

    if (salesError) {
      console.error('Error fetching sales:', salesError);
      return NextResponse.json({ error: salesError.message }, { status: 500 });
    }

    // Calculate total revenue
    const totalRevenue = sales?.reduce((sum, sale) => {
      return sum + (parseFloat(sale.amount_paid as any) || 0);
    }, 0) || 0;

    // Calculate most popular add-ons
    const addOnCounts = new Map<string, { name: string; count: number }>();
    sales?.forEach((sale: any) => {
      const addOnId = sale.add_on_id;
      const addOnName = sale.add_ons?.name || 'Unknown';

      if (addOnCounts.has(addOnId)) {
        const existing = addOnCounts.get(addOnId)!;
        existing.count += 1;
      } else {
        addOnCounts.set(addOnId, { name: addOnName, count: 1 });
      }
    });

    // Get top add-on
    let topAddOn = 'None';
    let maxCount = 0;
    addOnCounts.forEach((value) => {
      if (value.count > maxCount) {
        maxCount = value.count;
        topAddOn = value.name;
      }
    });

    // Get total count of add-ons
    const { count: totalAddOns } = await supabase
      .from('add_ons')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id);

    // Get active add-ons count
    const { count: activeAddOns } = await supabase
      .from('add_ons')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true);

    return NextResponse.json({
      totalRevenue,
      totalSales: sales?.length || 0,
      topAddOn,
      totalAddOns: totalAddOns || 0,
      activeAddOns: activeAddOns || 0,
      popularAddOns: Array.from(addOnCounts.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    });
  } catch (error) {
    console.error('Error in GET /api/add-ons/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
