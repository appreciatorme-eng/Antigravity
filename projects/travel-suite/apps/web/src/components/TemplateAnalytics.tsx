/**
 * Template Analytics Component
 *
 * Display analytics for a specific template
 */

'use client';

import { useEffect, useState } from 'react';
import { getTemplateAnalytics, type TemplateAnalytics } from '@/lib/analytics/template-analytics';
import { Eye, TrendingUp, Calendar, Target, BarChart3 } from 'lucide-react';

interface TemplateAnalyticsProps {
  templateId: string;
  organizationId: string;
}

export default function TemplateAnalyticsComponent({
  templateId,
  organizationId,
}: TemplateAnalyticsProps) {
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [templateId, organizationId]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    const result = await getTemplateAnalytics(templateId, organizationId);

    if (result.success && result.data) {
      setAnalytics(result.data);
    } else {
      setError(result.error || 'Failed to load analytics');
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">{error || 'No analytics data available'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_views}</p>
            </div>
          </div>
        </div>

        {/* Total Uses */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Uses</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_uses}</p>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversion</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.conversion_rate}%</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Last 7 Days</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.views_last_7_days} views
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#9c7c46]" />
          <h3 className="font-semibold text-gray-900">Activity Breakdown</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Last 7 Days */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">Last 7 Days</p>
            <div className="space-y-1">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">{analytics.views_last_7_days}</span> views
              </p>
              <p className="text-sm text-blue-700">
                <span className="font-semibold">{analytics.uses_last_7_days}</span> uses
              </p>
            </div>
          </div>

          {/* Last 30 Days */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-semibold text-purple-900 mb-2">Last 30 Days</p>
            <div className="space-y-1">
              <p className="text-sm text-purple-700">
                <span className="font-semibold">{analytics.views_last_30_days}</span> views
              </p>
              <p className="text-sm text-purple-700">
                <span className="font-semibold">{analytics.uses_last_30_days}</span> uses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Last Activity</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Last Viewed:</span>
            <span className="font-medium text-gray-900">
              {analytics.last_viewed_at
                ? new Date(analytics.last_viewed_at).toLocaleString()
                : 'Never'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Last Used:</span>
            <span className="font-medium text-gray-900">
              {analytics.last_used_at
                ? new Date(analytics.last_used_at).toLocaleString()
                : 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
