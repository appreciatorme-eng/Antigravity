'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Revenue Dashboard - Upsell Metrics & Performance
 *
 * Shows tour operators:
 * - Total add-on revenue
 * - Conversion rates
 * - Top performing add-ons
 * - Trending items
 */

interface ConversionMetric {
  add_on_id: string;
  add_on_name: string;
  views: number;
  purchases: number;
  conversion_rate: number;
}

interface AddOnRevenue {
  id: string;
  name: string;
  category: string;
  total_revenue: number;
  total_sales: number;
  avg_price: number;
}

export default function RevenueDashboard() {
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [conversionMetrics, setConversionMetrics] = useState<
    ConversionMetric[]
  >([]);
  const [revenueData, setRevenueData] = useState<AddOnRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

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
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      setOrganizationId(profile.organization_id);

      // Load conversion metrics
      const { data: metrics } = await supabase.rpc(
        'get_addon_conversion_rate',
        {
          p_organization_id: profile.organization_id,
          p_days: 30,
        }
      );

      if (metrics) {
        setConversionMetrics(metrics);
      }

      // Load revenue data
      const { data: purchases } = await supabase
        .from('client_add_ons')
        .select('amount_paid, add_on_id, add_ons(name, category)')
        .eq('add_ons.organization_id', profile.organization_id)
        .gte(
          'purchased_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        );

      if (purchases) {
        // Calculate revenue by add-on
        const revenueMap = new Map<string, AddOnRevenue>();
        let total = 0;

        purchases.forEach((purchase: any) => {
          const addOnId = purchase.add_on_id;
          const amount = parseFloat(purchase.amount_paid);
          total += amount;

          if (revenueMap.has(addOnId)) {
            const existing = revenueMap.get(addOnId)!;
            existing.total_revenue += amount;
            existing.total_sales += 1;
            existing.avg_price = existing.total_revenue / existing.total_sales;
          } else if (purchase.add_ons) {
            revenueMap.set(addOnId, {
              id: addOnId,
              name: purchase.add_ons.name,
              category: purchase.add_ons.category,
              total_revenue: amount,
              total_sales: 1,
              avg_price: amount,
            });
          }
        });

        const revenueArray = Array.from(revenueMap.values()).sort(
          (a, b) => b.total_revenue - a.total_revenue
        );

        setRevenueData(revenueArray);
        setTotalRevenue(total);
        setTotalSales(purchases.length);
      }
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Add-on upsell performance and conversion metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Revenue (30d)</div>
          <div className="text-3xl font-bold text-green-600">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            From {totalSales} add-on sales
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Sales (30d)</div>
          <div className="text-3xl font-bold text-blue-600">{totalSales}</div>
          <div className="text-xs text-gray-500 mt-2">
            Across {revenueData.length} add-ons
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">
            Avg. Conversion Rate
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {conversionMetrics.length > 0
              ? (
                  conversionMetrics.reduce(
                    (sum, m) => sum + m.conversion_rate,
                    0
                  ) / conversionMetrics.length
                ).toFixed(1)
              : 0}
            %
          </div>
          <div className="text-xs text-gray-500 mt-2">Views to purchases</div>
        </div>
      </div>

      {/* Top Performing Add-ons */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Top Performing Add-ons
          </h2>
          <p className="text-sm text-gray-600 mt-1">By total revenue (30 days)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Add-on
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avg. Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {revenueData.slice(0, 10).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    ${item.total_revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.total_sales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    ${item.avg_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Conversion Metrics
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            View-to-purchase conversion rates
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Add-on
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Purchases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {conversionMetrics
                .sort((a, b) => b.conversion_rate - a.conversion_rate)
                .slice(0, 10)
                .map((metric) => (
                  <tr key={metric.add_on_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {metric.add_on_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {metric.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.purchases}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2 max-w-[100px]">
                          <div
                            className="h-2 bg-purple-600 rounded-full"
                            style={{
                              width: `${Math.min(metric.conversion_rate, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-purple-600">
                          {metric.conversion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {totalSales === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center mt-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No revenue data yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add-on purchases will appear here once travelers start booking.
          </p>
          <div className="mt-6">
            <a
              href="/admin/add-ons"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Manage Add-ons
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
