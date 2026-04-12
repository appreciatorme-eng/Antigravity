/**
 * Admin Dashboard v2 — Tour Operator Mission Control
 *
 * 6-zone layout: Morning briefing, KPI strip, smart action queue + calendar,
 * revenue intelligence + customer pulse, pipeline + AI insights, scorecard.
 *
 * Two-phase data loading: critical (above-the-fold) renders first,
 * AI insights load in the background.
 */

'use client';

import { AlertTriangle } from 'lucide-react';
import { SetupChecklist } from '@/components/dashboard/SetupChecklist';
import { AIInsightsCarousel } from './_components/v2/AIInsightsCarousel';
import { CalendarPreview } from './_components/v2/CalendarPreview';
import { CustomerPulse } from './_components/v2/CustomerPulse';
import { KPITickerStrip } from './_components/v2/KPITickerStrip';
import { MorningBriefing } from './_components/v2/MorningBriefing';
import { PerformanceScorecard } from './_components/v2/PerformanceScorecard';
import { PipelineFunnel } from './_components/v2/PipelineFunnel';
import { RevenueIntelligence } from './_components/v2/RevenueIntelligence';
import { SmartActionQueue } from './_components/v2/SmartActionQueue';
import { useDashboardV2 } from './_components/v2/useDashboardV2';
import { GuidedTour } from '@/components/tour/GuidedTour';

export default function AdminDashboard() {
  const data = useDashboardV2();

  return (
    <div className="space-y-8 pb-20">
      <GuidedTour />

      {/* Setup Checklist — onboarding widget */}
      <div data-tour="setup-checklist">
        <SetupChecklist />
      </div>

      {/* Zone 0: Morning Briefing */}
      <div data-tour="morning-briefing">
        <MorningBriefing data={data} />
      </div>

      {data.phase === 'ready' && data.overview && data.overview.health.overall !== 'ok' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Dashboard is showing partial business data.</p>
            <div className="mt-1 space-y-1 text-xs font-medium">
              {(data.overview?.health.issues?.length
                ? data.overview.health.issues
                : [{ source: 'unknown', message: 'One or more data sources did not load, so some cards may be partial.' }]
              ).map((issue) => (
                <p key={`${issue.source}-${issue.message}`}>{issue.message}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zone 1: KPI Ticker Strip */}
      <div data-tour="kpi-strip">
        <KPITickerStrip data={data} />
      </div>

      {/* Zone 2: Action Queue + Calendar */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <SmartActionQueue data={data} />
        </div>
        <div className="xl:col-span-4" data-tour="calendar-preview">
          <CalendarPreview data={data} />
        </div>
      </div>

      {/* Zone 3: Revenue Intelligence + Customer Pulse */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <RevenueIntelligence data={data} />
        </div>
        <div className="xl:col-span-4">
          <CustomerPulse data={data} />
        </div>
      </div>

      {/* Zone 4: Pipeline Funnel + AI Insights */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <PipelineFunnel data={data} />
        <AIInsightsCarousel data={data} />
      </div>

      {/* Zone 5: Performance Scorecard (collapsible) */}
      <PerformanceScorecard data={data} />
    </div>
  );
}
