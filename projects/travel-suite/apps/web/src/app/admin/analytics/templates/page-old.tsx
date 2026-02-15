/**
 * Template Analytics Dashboard
 *
 * View top-performing templates and usage trends
 */

'use client';

import { useState, useEffect } from 'react';
import { getTopTemplatesByUsage, type TopTemplate } from '@/lib/analytics/template-analytics';
import { TrendingUp, Eye, Target, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function TemplateAnalyticsPage() {
  const [templates, setTemplates] = useState<TopTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<7 | 30 | 90>(30);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizationId();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadTemplates();
    }
  }, [organizationId, timePeriod]);

  const loadOrganizationId = async () => {
    // TODO: Get from auth context or session
    // For now, using placeholder
    setOrganizationId('org-placeholder');
  };

  const loadTemplates = async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    const result = await getTopTemplatesByUsage(organizationId, 20, timePeriod);

    if (result.success && result.data) {
      setTemplates(result.data);
    } else {
      setError(result.error || 'Failed to load templates');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Template Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track which tour templates are most popular and convert best
        </p>
      </div>

      {/* Time Period Selector */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm font-semibold text-gray-700">Time Period:</span>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimePeriod(days as 7 | 30 | 90)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timePeriod === days
                  ? 'bg-[#9c7c46] text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-[#9c7c46]'
              }`}
            >
              Last {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading analytics...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Templates List */}
      {!loading && !error && templates.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No template usage data yet for this time period</p>
          <p className="text-sm text-gray-500 mt-2">
            Start using templates to create proposals to see analytics here
          </p>
        </div>
      )}

      {!loading && !error && templates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-700">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Template</div>
            <div className="col-span-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Uses
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <Eye className="w-4 h-4" />
              Views
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <Target className="w-4 h-4" />
              Conversion
            </div>
            <div className="col-span-1"></div>
          </div>

          {/* Template Rows */}
          {templates.map((template, index) => (
            <div
              key={template.template_id}
              className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center">
                <span
                  className={`text-lg font-bold ${
                    index === 0
                      ? 'text-yellow-600'
                      : index === 1
                      ? 'text-gray-400'
                      : index === 2
                      ? 'text-orange-600'
                      : 'text-gray-500'
                  }`}
                >
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </span>
              </div>

              {/* Template Info */}
              <div className="col-span-4 flex flex-col justify-center">
                <p className="font-semibold text-gray-900">{template.template_name}</p>
                <p className="text-sm text-gray-600">{template.destination}</p>
              </div>

              {/* Uses */}
              <div className="col-span-2 flex items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">{template.total_uses}</span>
                  {template.total_uses > 0 && index === 0 && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                      Top
                    </span>
                  )}
                </div>
              </div>

              {/* Views */}
              <div className="col-span-2 flex items-center">
                <span className="text-lg font-semibold text-blue-600">{template.total_views}</span>
              </div>

              {/* Conversion Rate */}
              <div className="col-span-2 flex items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-purple-600">
                    {template.conversion_rate}%
                  </span>
                  {template.conversion_rate >= 50 && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                      High
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end">
                <Link
                  href={`/admin/tour-templates/${template.template_id}/edit`}
                  className="text-sm text-[#9c7c46] hover:underline"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {!loading && !error && templates.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">📊 Insights</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Your top template has been used <strong>{templates[0]?.total_uses}</strong>{' '}
                  times in the last {timePeriod} days
                </li>
                <li>
                  • Average conversion rate:{' '}
                  <strong>
                    {Math.round(
                      templates.reduce((sum, t) => sum + Number(t.conversion_rate), 0) /
                        templates.length
                    )}
                    %
                  </strong>
                </li>
                <li>
                  • Total views across all templates:{' '}
                  <strong>
                    {templates.reduce((sum, t) => sum + Number(t.total_views), 0)}
                  </strong>
                </li>
                <li>
                  • Templates with &gt;50% conversion rate:{' '}
                  <strong>
                    {templates.filter((t) => Number(t.conversion_rate) >= 50).length}
                  </strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
