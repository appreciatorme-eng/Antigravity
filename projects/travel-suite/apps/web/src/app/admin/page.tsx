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

export default function AdminDashboard() {
  const data = useDashboardV2();

  return (
    <div className="space-y-8 pb-20">
      {/* Setup Checklist — onboarding widget */}
      <SetupChecklist />

      {/* Zone 0: Morning Briefing */}
      <MorningBriefing data={data} />

      {/* Zone 1: KPI Ticker Strip */}
      <KPITickerStrip data={data} />

      {/* Zone 2: Action Queue + Calendar */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <SmartActionQueue data={data} />
        </div>
        <div className="xl:col-span-4">
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
