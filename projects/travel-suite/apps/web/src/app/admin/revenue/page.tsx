'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { GlassButton } from '@/components/glass/GlassButton';
import { useToast } from '@/components/ui/toast';

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
  monthKey: string;
  month: string;
  revenue: number;
  invoices: number;
}

interface SubscriptionRow {
  total_amount: number | string | null;
  billing_cycle: string | null;
  status: string | null;
}

interface InvoiceRow {
  total_amount: number | string | null;
  status: string | null;
  created_at: string | null;
}

interface AddOnRelation {
  name: string | null;
  category: string | null;
  organization_id: string;
}

interface AddOnPurchaseRow {
  amount_paid: number | string | null;
  add_on_id: string | null;
  add_ons: AddOnRelation | AddOnRelation[] | null;
}

const EMPTY_METRICS: RevenueMetrics = {
  mrr: 0,
  totalRevenue: 0,
  invoiceRevenue: 0,
  addonRevenue: 0,
  activeSubscriptions: 0,
  totalInvoices: 0,
  paidInvoices: 0,
  pendingInvoices: 0,
  totalClients: 0,
};

function asNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toMonthKey(dateValue: string | null): string | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getAddOnMeta(value: AddOnPurchaseRow['add_ons']): AddOnRelation | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

export default function RevenueDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RevenueMetrics>(EMPTY_METRICS);
  const [addonData, setAddonData] = useState<AddOnRevenue[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);

  const loadData = useCallback(
    async (showRefreshToast = false) => {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error('Unauthorized access');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (profileError || !profile?.organization_id) {
          throw new Error('Unable to resolve organization');
        }

        const orgId = profile.organization_id;
        const purchasedAfter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

        const [subscriptionsResult, invoicesResult, addonsResult, clientsResult] = await Promise.all([
          supabase
            .from('subscriptions')
            .select('total_amount,billing_cycle,status')
            .eq('organization_id', orgId)
            .eq('status', 'active'),
          supabase
            .from('invoices')
            .select('total_amount,status,created_at')
            .eq('organization_id', orgId),
          supabase
            .from('client_add_ons')
            .select('amount_paid,add_on_id,add_ons!inner(name,category,organization_id)')
            .eq('status', 'confirmed')
            .eq('add_ons.organization_id', orgId)
            .gte('purchased_at', purchasedAfter),
          supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId),
        ]);

        if (subscriptionsResult.error) throw subscriptionsResult.error;
        if (invoicesResult.error) throw invoicesResult.error;
        if (addonsResult.error) throw addonsResult.error;
        if (clientsResult.error) throw clientsResult.error;

        const subscriptions = (subscriptionsResult.data || []) as SubscriptionRow[];
        const invoices = (invoicesResult.data || []) as InvoiceRow[];
        const addOnPurchases = (addonsResult.data || []) as AddOnPurchaseRow[];

        let mrr = 0;
        let activeSubscriptions = 0;
        for (const subscription of subscriptions) {
          activeSubscriptions += 1;
          const amount = asNumber(subscription.total_amount);
          const billingCycle = (subscription.billing_cycle || '').toLowerCase();
          mrr += billingCycle === 'annual' ? amount / 12 : amount;
        }

        let invoiceRevenue = 0;
        let paidInvoices = 0;
        let pendingInvoices = 0;
        const monthlyMap = new Map<string, MonthlyTrend>();

        for (const invoice of invoices) {
          const status = (invoice.status || '').toLowerCase();
          const amount = asNumber(invoice.total_amount);

          if (status === 'paid') {
            invoiceRevenue += amount;
            paidInvoices += 1;
            const monthKey = toMonthKey(invoice.created_at);
            if (monthKey) {
              const existing = monthlyMap.get(monthKey);
              if (existing) {
                existing.revenue += amount;
                existing.invoices += 1;
              } else {
                monthlyMap.set(monthKey, {
                  monthKey,
                  month: monthLabel(monthKey),
                  revenue: amount,
                  invoices: 1,
                });
              }
            }
          } else if (status !== 'void' && status !== 'cancelled') {
            pendingInvoices += 1;
          }
        }

        let addonRevenue = 0;
        const addonMap = new Map<string, AddOnRevenue>();
        for (const purchase of addOnPurchases) {
          const addOnId = purchase.add_on_id;
          const addOnMeta = getAddOnMeta(purchase.add_ons);
          if (!addOnId || !addOnMeta) continue;

          const amount = asNumber(purchase.amount_paid);
          addonRevenue += amount;

          const existing = addonMap.get(addOnId);
          if (existing) {
            existing.total_revenue += amount;
            existing.total_sales += 1;
            existing.avg_price = existing.total_revenue / existing.total_sales;
          } else {
            addonMap.set(addOnId, {
              id: addOnId,
              name: addOnMeta.name || 'Unnamed add-on',
              category: addOnMeta.category || 'General',
              total_revenue: amount,
              total_sales: 1,
              avg_price: amount,
            });
          }
        }

        const addonArray = Array.from(addonMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);
        const trendsArray = Array.from(monthlyMap.values())
          .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
          .slice(-6);

        setMetrics({
          mrr,
          totalRevenue: mrr + invoiceRevenue + addonRevenue,
          invoiceRevenue,
          addonRevenue,
          activeSubscriptions,
          totalInvoices: invoices.length,
          paidInvoices,
          pendingInvoices,
          totalClients: Number(clientsResult.count || 0),
        });

        setAddonData(addonArray);
        setMonthlyTrends(trendsArray);

        if (showRefreshToast) {
          toast({
            title: 'Revenue refreshed',
            description: 'Latest financial metrics are loaded.',
            variant: 'success',
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load revenue dashboard';
        setError(message);
        setMetrics(EMPTY_METRICS);
        setAddonData([]);
        setMonthlyTrends([]);
        toast({
          title: 'Revenue load failed',
          description: message,
          variant: 'error',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase, toast]
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  function formatCurrency(amount: number) {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <GlassSkeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <GlassSkeleton className="h-32" />
          <GlassSkeleton className="h-32" />
          <GlassSkeleton className="h-32" />
          <GlassSkeleton className="h-32" />
        </div>
        <GlassSkeleton className="h-96" />
      </div>
    );
  }

  const avgInvoiceValue = metrics.paidInvoices > 0 ? metrics.invoiceRevenue / metrics.paidInvoices : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/20">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Revenue</span>
            <h1 className="text-3xl font-serif text-secondary dark:text-white">Revenue Dashboard</h1>
            <p className="mt-1 text-text-secondary">Complete business metrics and performance</p>
          </div>
        </div>
        <GlassButton variant="outline" size="sm" loading={refreshing} onClick={() => void loadData(true)}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </GlassButton>
      </div>

      {error ? (
        <GlassCard padding="lg" rounded="2xl" className="border border-rose-200/70 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-900/20">
          <p className="text-sm text-rose-700 dark:text-rose-300">Unable to load revenue data: {error}</p>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <GlassCard padding="lg" rounded="2xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-primary">MRR</div>
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.mrr)}</div>
          <div className="mt-2 text-xs text-text-secondary">
            {metrics.activeSubscriptions} active subscription{metrics.activeSubscriptions !== 1 ? 's' : ''}
          </div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-primary">Total Revenue</div>
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="mt-2 text-xs text-text-secondary">All revenue streams</div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-primary">Invoice Revenue</div>
            <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(metrics.invoiceRevenue)}</div>
          <div className="mt-2 text-xs text-text-secondary">{metrics.paidInvoices} paid invoices</div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-primary">Add-on Revenue</div>
            <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(metrics.addonRevenue)}</div>
          <div className="mt-2 text-xs text-text-secondary">Upsell & extras</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-text-secondary">Total Clients</div>
              <div className="text-2xl font-bold text-secondary dark:text-white">{metrics.totalClients}</div>
            </div>
            <Users className="h-8 w-8 text-primary opacity-50" />
          </div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-text-secondary">Avg Invoice Value</div>
              <div className="text-2xl font-bold text-secondary dark:text-white">{formatCurrency(avgInvoiceValue)}</div>
            </div>
            <Calendar className="h-8 w-8 text-primary opacity-50" />
          </div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-text-secondary">Pending Invoices</div>
              <div className="text-2xl font-bold text-secondary dark:text-white">{metrics.pendingInvoices}</div>
            </div>
            <Package className="h-8 w-8 text-primary opacity-50" />
          </div>
        </GlassCard>
      </div>

      {monthlyTrends.length > 0 ? (
        <GlassCard padding="lg" rounded="2xl">
          <h2 className="mb-6 text-lg font-serif text-secondary dark:text-white">Revenue Trend (Last 6 Months)</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            {monthlyTrends.map((trend, index) => {
              const previousRevenue = index > 0 ? monthlyTrends[index - 1].revenue : trend.revenue;
              const growth = previousRevenue > 0 ? ((trend.revenue - previousRevenue) / previousRevenue) * 100 : 0;
              const isPositive = growth >= 0;

              return (
                <div key={trend.monthKey} className="text-center">
                  <div className="mb-2 text-xs text-text-secondary">{trend.month}</div>
                  <div className="mb-1 text-lg font-bold text-secondary dark:text-white">{formatCurrency(trend.revenue)}</div>
                  <div className="mb-2 text-xs text-text-secondary">
                    {trend.invoices} invoice{trend.invoices !== 1 ? 's' : ''}
                  </div>
                  {index > 0 ? (
                    <div
                      className={`flex items-center justify-center gap-1 text-xs font-semibold ${
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(growth).toFixed(1)}%
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </GlassCard>
      ) : null}

      {addonData.length > 0 ? (
        <GlassCard padding="none" rounded="2xl">
          <div className="border-b border-white/10 p-6">
            <h2 className="text-lg font-serif text-secondary dark:text-white">Top Performing Add-ons</h2>
            <p className="mt-1 text-sm text-text-secondary">By total revenue</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/40 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">Add-on</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Total Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Sales</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Avg. Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {addonData.slice(0, 10).map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-white/10 dark:hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-secondary dark:text-white">{item.name}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <GlassBadge variant="info" size="sm">
                        {item.category}
                      </GlassBadge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.total_revenue)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-secondary dark:text-white">{item.total_sales}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-text-secondary">
                      {formatCurrency(item.avg_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : null}

      {metrics.totalRevenue === 0 ? (
        <GlassCard padding="lg" rounded="2xl" className="py-12 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-text-secondary opacity-50" />
          <h3 className="mt-4 text-sm font-semibold text-secondary dark:text-white">No revenue data yet</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Revenue appears once subscriptions, invoices, or add-on purchases are recorded.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/admin/billing"
              className="inline-flex items-center rounded-lg border border-primary/30 bg-primary/20 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/30"
            >
              View Billing
            </a>
            <a
              href="/admin/add-ons"
              className="inline-flex items-center rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-white/30 dark:text-white"
            >
              Manage Add-ons
            </a>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
