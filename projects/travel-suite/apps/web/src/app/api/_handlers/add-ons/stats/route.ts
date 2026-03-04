/**
 * Add-ons Stats API
 *
 * GET /api/add-ons/stats - Revenue and analytics for add-ons
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AddOnSaleRelation {
  name: string | null;
  organization_id: string;
}

interface AddOnSaleRow {
  amount_paid: number | string | null;
  add_on_id: string | null;
  add_ons: AddOnSaleRelation | AddOnSaleRelation[] | null;
}

function asNumber(value: number | string | null | undefined): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getRelation(value: AddOnSaleRow['add_ons']): AddOnSaleRelation | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

export async function GET() {
  try {
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
    const typedSales = (sales || []) as AddOnSaleRow[];

    const totalRevenue = typedSales.reduce((sum, sale) => {
      return sum + asNumber(sale.amount_paid);
    }, 0) || 0;

    // Calculate most popular add-ons
    const addOnCounts = new Map<string, { name: string; count: number }>();
    typedSales.forEach((sale) => {
      const addOnId = sale.add_on_id;
      if (!addOnId) return;
      const addOnName = getRelation(sale.add_ons)?.name || 'Unknown';

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
      totalSales: typedSales.length,
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
