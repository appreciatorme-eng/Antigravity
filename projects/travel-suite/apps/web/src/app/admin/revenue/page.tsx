'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';

/**
 * Revenue Dashboard - Complete Business Metrics
 *
 * Shows tour operators:
 * - MRR (Monthly Recurring Revenue) from subscriptions
 * - Total invoice revenue
 * - Add-on upsell revenue
 * - Conversion rates
 * - Growth trends
 * - Top performers
 */

interface RevenueMetrics {
  mrr: number;
  totalRevenue: number;
  invoiceRevenue: number;
  addonRevenue: number;
  activeSubscriptions: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  totalClients: number;
}

interface AddOnRevenue {
  id: string;
  name: string;
  category: string;
  total_revenue: number;
  total_sales: number;
  avg_price: number;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  invoices: number;
}

export default function RevenueDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    mrr: 0,
    totalRevenue: 0,
    invoiceRevenue: 0,
    addonRevenue: 0,
    activeSubscriptions: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    totalClients: 0,
  });
  const [addonData, setAddonData] = useState<AddOnRevenue[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get organization ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      const orgId = profile.organization_id;

      // Load all metrics in parallel
      const [
        subscriptionsResult,
        invoicesResult,
        addonsResult,
        clientsResult,
      ] = await Promise.all([
        // Subscriptions (MRR)
        supabase
          .from('subscriptions')
          .select('total_amount, billing_cycle, status')
          .eq('organization_id', orgId)
          .eq('status', 'active'),

        // Invoices
        supabase
          .from('invoices')
          .select('total_amount, status, created_at')
          .eq('organization_id', orgId),

        // Add-ons
        supabase
          .from('client_add_ons')
          .select('amount_paid, add_on_id, add_ons(name, category)')
          .eq('status', 'confirmed')
          .gte('purchased_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),

        // Clients
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),
      ]);

      // Calculate MRR from subscriptions
      let mrr = 0;
      let activeSubscriptions = 0;
      if (subscriptionsResult.data) {
        subscriptionsResult.data.forEach((sub) => {
          activeSubscriptions++;
          const amount = parseFloat(sub.total_amount?.toString() || '0');
          if (sub.billing_cycle === 'annual') {
            mrr += amount / 12; // Convert annual to monthly
          } else {
            mrr += amount;
          }
        });
      }

      // Calculate invoice metrics
      let invoiceRevenue = 0;
      let paidInvoices = 0;
      let pendingInvoices = 0;
      const monthlyMap = new Map<string, MonthlyTrend>();

      if (invoicesResult.data) {
        invoicesResult.data.forEach((inv) => {
          const amount = parseFloat(inv.total_amount?.toString() || '0');

          if (inv.status === 'paid') {
            invoiceRevenue += amount;
            paidInvoices++;

            // Track monthly trend
            const date = new Date(inv.created_at || new Date().toISOString());
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            if (monthlyMap.has(monthKey)) {
              const existing = monthlyMap.get(monthKey)!;
              existing.revenue += amount;
              existing.invoices++;
            } else {
              monthlyMap.set(monthKey, {
                month: monthName,
                revenue: amount,
                invoices: 1,
              });
            }
          } else if (inv.status === 'pending') {
            pendingInvoices++;
          }
        });
      }

      // Calculate add-on revenue
      let addonRevenue = 0;
      const addonMap = new Map<string, AddOnRevenue>();

      if (addonsResult.data) {
        addonsResult.data.forEach((purchase: any) => {
          const amount = parseFloat(purchase.amount_paid || '0');
          addonRevenue += amount;

          const addOnId = purchase.add_on_id;
          if (addonMap.has(addOnId)) {
            const existing = addonMap.get(addOnId)!;
            existing.total_revenue += amount;
            existing.total_sales += 1;
            existing.avg_price = existing.total_revenue / existing.total_sales;
          } else if (purchase.add_ons) {
            addonMap.set(addOnId, {
              id: addOnId,
              name: purchase.add_ons.name,
              category: purchase.add_ons.category,
              total_revenue: amount,
              total_sales: 1,
              avg_price: amount,
            });
          }
        });
      }

      const addonArray = Array.from(addonMap.values()).sort(
        (a, b) => b.total_revenue - a.total_revenue
      );

      // Sort monthly trends
      const trendsArray = Array.from(monthlyMap.values())
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months

      setMetrics({
        mrr,
        totalRevenue: mrr + invoiceRevenue + addonRevenue,
        invoiceRevenue,
        addonRevenue,
        activeSubscriptions,
        totalInvoices: invoicesResult.data?.length || 0,
        paidInvoices,
        pendingInvoices,
        totalClients: clientsResult.count || 0,
      });

      setAddonData(addonArray);
      setMonthlyTrends(trendsArray);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number) {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <GlassSkeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <GlassSkeleton className="h-32" />
          <GlassSkeleton className="h-32" />
          <GlassSkeleton className="h-32" />
          <GlassSkeleton className="h-32" />
        </div>
        <GlassSkeleton className="h-96" />
      </div>
    );
  }

  const avgInvoiceValue = metrics.paidInvoices > 0
    ? metrics.invoiceRevenue / metrics.paidInvoices
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-xs uppercase tracking-widest text-primary font-bold">Revenue</span>
          <h1 className="text-3xl font-serif text-secondary dark:text-white">Revenue Dashboard</h1>
          <p className="text-text-secondary mt-1">Complete business metrics and performance</p>
        </div>
      </div>

      {/* Top-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-primary">MRR</div>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.mrr)}
          </div>
          <div className="text-xs text-text-secondary mt-2">
            {metrics.activeSubscriptions} active subscription{metrics.activeSubscriptions !== 1 ? 's' : ''}
          </div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-primary">Total Revenue</div>
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(metrics.totalRevenue)}
          </div>
          <div className="text-xs text-text-secondary mt-2">
            All revenue streams
          </div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-primary">Invoice Revenue</div>
            <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(metrics.invoiceRevenue)}
          </div>
          <div className="text-xs text-text-secondary mt-2">
            {metrics.paidInvoices} paid invoices
          </div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-primary">Add-on Revenue</div>
            <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(metrics.addonRevenue)}
          </div>
          <div className="text-xs text-text-secondary mt-2">
            Upsell & extras
          </div>
        </GlassCard>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-text-secondary mb-1">
                Total Clients
              </div>
              <div className="text-2xl font-bold text-secondary dark:text-white">
                {metrics.totalClients}
              </div>
            </div>
            <Users className="w-8 h-8 text-primary opacity-50" />
          </div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-text-secondary mb-1">
                Avg Invoice Value
              </div>
              <div className="text-2xl font-bold text-secondary dark:text-white">
                {formatCurrency(avgInvoiceValue)}
              </div>
            </div>
            <Calendar className="w-8 h-8 text-primary opacity-50" />
          </div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-text-secondary mb-1">
                Pending Invoices
              </div>
              <div className="text-2xl font-bold text-secondary dark:text-white">
                {metrics.pendingInvoices}
              </div>
            </div>
            <Package className="w-8 h-8 text-primary opacity-50" />
          </div>
        </GlassCard>
      </div>

      {/* Monthly Trends */}
      {monthlyTrends.length > 0 && (
        <GlassCard padding="lg" rounded="2xl">
          <h2 className="text-lg font-serif text-secondary dark:text-white mb-6">
            Revenue Trend (Last 6 Months)
          </h2>
          <div className="grid grid-cols-6 gap-4">
            {monthlyTrends.map((trend, index) => {
              const prevRevenue = index > 0 ? monthlyTrends[index - 1].revenue : trend.revenue;
              const growth = prevRevenue > 0
                ? ((trend.revenue - prevRevenue) / prevRevenue) * 100
                : 0;
              const isPositive = growth >= 0;

              return (
                <div key={trend.month} className="text-center">
                  <div className="text-xs text-text-secondary mb-2">{trend.month}</div>
                  <div className="text-lg font-bold text-secondary dark:text-white mb-1">
                    {formatCurrency(trend.revenue)}
                  </div>
                  <div className="text-xs text-text-secondary mb-2">
                    {trend.invoices} invoice{trend.invoices !== 1 ? 's' : ''}
                  </div>
                  {index > 0 && (
                    <div className={`flex items-center justify-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                      {isPositive ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(growth).toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Top Performing Add-ons */}
      {addonData.length > 0 && (
        <GlassCard padding="none" rounded="2xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-serif text-secondary dark:text-white">
              Top Performing Add-ons
            </h2>
            <p className="text-sm text-text-secondary mt-1">By total revenue</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/40 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wide">
                    Add-on
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-primary uppercase tracking-wide">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-primary uppercase tracking-wide">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-primary uppercase tracking-wide">
                    Avg. Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {addonData.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary dark:text-white">
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <GlassBadge variant="info" size="sm">
                        {item.category}
                      </GlassBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.total_revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-secondary dark:text-white">
                      {item.total_sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-text-secondary">
                      {formatCurrency(item.avg_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Empty State */}
      {metrics.totalRevenue === 0 && (
        <GlassCard padding="lg" rounded="2xl" className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-text-secondary opacity-50" />
          <h3 className="mt-4 text-sm font-semibold text-secondary dark:text-white">
            No revenue data yet
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Revenue will appear here once you start receiving payments from subscriptions and invoices.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <a
              href="/admin/billing"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-sm font-semibold text-primary hover:bg-primary/30 transition-colors"
            >
              View Billing
            </a>
            <a
              href="/admin/add-ons"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-sm font-semibold text-secondary dark:text-white hover:bg-white/30 transition-colors"
            >
              Manage Add-ons
            </a>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
