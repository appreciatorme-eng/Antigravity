/**
 * Template Analytics Dashboard
 *
 * View top-performing templates and usage trends
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTopTemplatesByUsage, type TopTemplate } from '@/lib/analytics/template-analytics';
import { TrendingUp, Eye, Target, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export default function TemplateAnalyticsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TopTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<7 | 30 | 90>(30);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const resolveOrganizationId = useCallback(async () => {
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

    return profile.organization_id;
  }, [supabase]);

  const loadTemplates = useCallback(async (showToast = false) => {
    if (showToast) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const resolvedOrgId = organizationId || (await resolveOrganizationId());
      if (!organizationId) {
        setOrganizationId(resolvedOrgId);
      }

      const result = await getTopTemplatesByUsage(resolvedOrgId, 20, timePeriod);
      if (!result.success) {
        throw new Error(result.error || 'Failed to load templates');
      }

      setTemplates(result.data || []);

      if (showToast) {
        toast({
          title: 'Template analytics refreshed',
          description: 'Latest usage and conversion stats are loaded.',
          variant: 'success',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load templates';
      setError(message);
      setTemplates([]);
      toast({
        title: 'Template analytics failed',
        description: message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [organizationId, resolveOrganizationId, timePeriod, toast]);

  useEffect(() => {
    void loadTemplates(false);
  }, [loadTemplates]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-xs uppercase tracking-widest text-primary font-bold">Analytics</span>
          <h1 className="text-3xl font-serif text-secondary dark:text-white">Template Analytics</h1>
          <p className="text-text-secondary mt-1">
            Track which tour templates are most popular and convert best
          </p>
        </div>
        <div className="ml-auto">
          <GlassButton variant="outline" size="sm" loading={refreshing} onClick={() => void loadTemplates(true)}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </GlassButton>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-semibold text-secondary dark:text-white">Time Period:</span>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <GlassButton
              key={days}
              variant={timePeriod === days ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimePeriod(days as 7 | 30 | 90)}
            >
              Last {days} Days
            </GlassButton>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <GlassCard padding="lg">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-text-secondary">Loading analytics...</div>
          </div>
        </GlassCard>
      )}

      {/* Error State */}
      {error && (
        <GlassCard padding="lg" className="bg-red-100/50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </GlassCard>
      )}

      {/* Empty State */}
      {!loading && !error && templates.length === 0 && (
        <GlassCard padding="lg">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <p className="text-secondary dark:text-white font-semibold">No template usage data yet for this time period</p>
            <p className="text-sm text-text-secondary mt-2">
              Start using templates to create proposals to see analytics here
            </p>
          </div>
        </GlassCard>
      )}

      {/* Templates List */}
      {!loading && !error && templates.length > 0 && (
        <GlassCard padding="none" rounded="2xl">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-white/10 dark:bg-white/5 border-b border-white/10 font-semibold text-sm text-secondary dark:text-white">
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
          <div className="divide-y divide-white/10">
            {templates.map((template, index) => (
              <div
                key={template.template_id}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center">
                  <span
                    className={`text-lg font-bold ${
                      index === 0
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : index === 1
                        ? 'text-gray-400 dark:text-gray-500'
                        : index === 2
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-text-secondary'
                    }`}
                  >
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </span>
                </div>

                {/* Template Info */}
                <div className="col-span-4 flex flex-col justify-center">
                  <p className="font-semibold text-secondary dark:text-white">{template.template_name}</p>
                  <p className="text-sm text-text-secondary">{template.destination}</p>
                </div>

                {/* Uses */}
                <div className="col-span-2 flex items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{template.total_uses}</span>
                    {template.total_uses > 0 && index === 0 && (
                      <GlassBadge variant="success" size="sm">Top</GlassBadge>
                    )}
                  </div>
                </div>

                {/* Views */}
                <div className="col-span-2 flex items-center">
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">{template.total_views}</span>
                </div>

                {/* Conversion Rate */}
                <div className="col-span-2 flex items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {template.conversion_rate}%
                    </span>
                    {template.conversion_rate >= 50 && (
                      <GlassBadge variant="secondary" size="sm">High</GlassBadge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end">
                  <Link href={`/admin/tour-templates/${template.template_id}/edit`}>
                    <GlassButton variant="ghost" size="sm">
                      View
                    </GlassButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Insights */}
      {!loading && !error && templates.length > 0 && (
        <GlassCard padding="lg" className="bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📊 Insights</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
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
        </GlassCard>
      )}
    </div>
  );
}
