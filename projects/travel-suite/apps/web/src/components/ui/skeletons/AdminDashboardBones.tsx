"use client";

import type { ReactNode } from "react";
import { Skeleton } from "boneyard-js/react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassSkeleton } from "@/components/glass/GlassSkeleton";

function DashboardBoneShell({
  name,
  loading = true,
  fallback,
  fixture,
  className,
}: {
  name: string;
  loading?: boolean;
  fallback: ReactNode;
  fixture: ReactNode;
  className?: string;
}) {
  return (
    <Skeleton
      name={name}
      loading={loading}
      animate="shimmer"
      transition
      stagger
      fallback={fallback}
      fixture={fixture}
      className={className}
    >
      {fixture}
    </Skeleton>
  );
}

function MorningBriefingFallback() {
  return (
    <div className="space-y-3">
      <GlassSkeleton className="h-12 w-72" />
      <GlassSkeleton className="h-5 w-96" />
    </div>
  );
}

function MorningBriefingFixture() {
  return (
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div className="space-y-2">
        <div className="h-12 w-80 rounded-2xl bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-emerald-200" />
          <div className="h-4 w-72 rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="flex h-12 w-56 shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 shadow-sm">
        <div className="h-4 w-4 rounded-full bg-slate-200" />
        <div className="h-4 flex-1 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

export function AdminMorningBriefingBone({ loading = true }: { loading?: boolean }) {
  return (
    <DashboardBoneShell
      name="admin-morning-briefing"
      loading={loading}
      fallback={<MorningBriefingFallback />}
      fixture={<MorningBriefingFixture />}
    />
  );
}

function KpiStripFallback() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <GlassSkeleton key={index} className="h-32 w-48 shrink-0 rounded-2xl" />
      ))}
    </div>
  );
}

function KpiStripFixture() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="w-48 shrink-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-slate-200" />
            <div className="h-3 w-3 rounded-full bg-slate-100" />
          </div>
          <div className="h-2.5 w-20 rounded-full bg-slate-200" />
          <div className="mt-2 h-8 w-24 rounded-xl bg-slate-300" />
          <div className="mt-3 h-2.5 w-16 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function AdminKpiStripBone({ loading = true }: { loading?: boolean }) {
  return (
    <DashboardBoneShell
      name="admin-kpi-strip"
      loading={loading}
      fallback={<KpiStripFallback />}
      fixture={<KpiStripFixture />}
    />
  );
}

function SmartActionQueueFallback() {
  return (
    <GlassCard padding="xl">
      <div className="mb-6 flex items-center gap-3">
        <GlassSkeleton className="h-5 w-5 rounded" />
        <GlassSkeleton className="h-6 w-48" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <GlassSkeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </GlassCard>
  );
}

function SmartActionQueueFixture() {
  return (
    <GlassCard padding="xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-5 w-5 rounded bg-amber-200" />
        <div className="h-6 w-48 rounded-full bg-slate-200" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, groupIndex) => (
          <div key={groupIndex}>
            <div className="flex items-center gap-2.5 px-1 py-2">
              <div className="h-4 w-4 rounded-full bg-slate-200" />
              <div className="h-3 w-24 rounded-full bg-slate-200" />
              <div className="h-5 w-6 rounded-lg bg-slate-100" />
            </div>
            <div className="space-y-2 pb-3">
              {Array.from({ length: 2 }).map((_, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white/50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3.5 w-48 rounded-full bg-slate-200" />
                    <div className="h-3 w-36 rounded-full bg-slate-100" />
                  </div>
                  <div className="h-5 w-16 rounded-lg bg-amber-100" />
                  <div className="h-3.5 w-3.5 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function AdminSmartActionQueueBone({ loading = true }: { loading?: boolean }) {
  return (
    <DashboardBoneShell
      name="admin-smart-action-queue"
      loading={loading}
      fallback={<SmartActionQueueFallback />}
      fixture={<SmartActionQueueFixture />}
    />
  );
}

function CalendarPreviewFallback() {
  return (
    <GlassCard padding="xl" className="h-full">
      <GlassSkeleton className="mb-4 h-5 w-40" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <GlassSkeleton key={index} className="h-16 rounded-lg" />
        ))}
      </div>
    </GlassCard>
  );
}

function CalendarPreviewFixture() {
  return (
    <GlassCard padding="xl" className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-slate-200" />
          <div className="h-4 w-24 rounded-full bg-slate-200" />
        </div>
        <div className="h-3 w-14 rounded-full bg-slate-100" />
      </div>
      <div className="mb-3 flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <div className="h-2.5 w-12 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center rounded-xl bg-white/50 px-1 py-2"
          >
            <div className="h-2.5 w-5 rounded-full bg-slate-100" />
            <div className="mt-1 h-6 w-6 rounded-full bg-slate-200" />
            <div className="mt-2 flex gap-1">
              {index % 3 === 0 &&
                Array.from({ length: 2 }).map((__, dotIndex) => (
                  <div key={dotIndex} className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function AdminCalendarPreviewBone({ loading = true }: { loading?: boolean }) {
  return (
    <DashboardBoneShell
      name="admin-calendar-preview"
      loading={loading}
      fallback={<CalendarPreviewFallback />}
      fixture={<CalendarPreviewFixture />}
    />
  );
}

function RevenueIntelligenceFallback() {
  return (
    <GlassCard padding="xl">
      <GlassSkeleton className="mb-4 h-6 w-48" />
      <GlassSkeleton className="h-64 w-full rounded-xl" />
    </GlassCard>
  );
}

function RevenueIntelligenceFixture() {
  return (
    <GlassCard padding="xl">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-slate-200" />
            <div className="h-6 w-44 rounded-full bg-slate-200" />
          </div>
          <div className="h-3 w-72 rounded-full bg-slate-100" />
        </div>
        <div className="flex items-center rounded-full border border-gray-200 bg-gray-50/80 p-0.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="mx-0.5 h-8 w-20 rounded-full bg-white"
            />
          ))}
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2"
          >
            <div className="h-3 w-20 rounded-full bg-slate-100" />
            <div className="h-4 w-16 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="mb-4 flex items-center gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`h-8 rounded-full ${index === 2 ? "w-12 bg-emerald-100" : "w-10 bg-slate-100"}`}
          />
        ))}
      </div>
      <div className="aspect-[21/9] w-full rounded-2xl border border-gray-100 bg-white px-4 py-4">
        <div className="flex h-full items-end gap-3">
          {Array.from({ length: 16 }).map((_, index) => (
            <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
              <div
                className="w-full rounded-t-full bg-blue-200"
                style={{ height: `${index === 12 ? 72 : index % 5 === 0 ? 20 : 10}px` }}
              />
              <div className="h-2 w-full rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export function AdminRevenueIntelligenceBone({ loading = true }: { loading?: boolean }) {
  return (
    <DashboardBoneShell
      name="admin-revenue-intelligence"
      loading={loading}
      fallback={<RevenueIntelligenceFallback />}
      fixture={<RevenueIntelligenceFixture />}
    />
  );
}

function CustomerPulseFallback() {
  return (
    <GlassCard padding="xl" className="h-full">
      <GlassSkeleton className="mb-4 h-5 w-36" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <GlassSkeleton key={index} className="h-14 rounded-xl" />
        ))}
      </div>
    </GlassCard>
  );
}

function CustomerPulseFixture() {
  return (
    <GlassCard padding="xl" className="h-full">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-4 rounded-full bg-rose-200" />
        <div className="h-4 w-32 rounded-full bg-slate-200" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-2.5 w-20 rounded-full bg-slate-100" />
              <div className="h-5 w-12 rounded-full bg-slate-200" />
            </div>
            <div className="h-3.5 w-3.5 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center">
        <div className="h-3 w-32 rounded-full bg-slate-100" />
      </div>
    </GlassCard>
  );
}

export function AdminCustomerPulseBone({ loading = true }: { loading?: boolean }) {
  return (
    <DashboardBoneShell
      name="admin-customer-pulse"
      loading={loading}
      fallback={<CustomerPulseFallback />}
      fixture={<CustomerPulseFixture />}
    />
  );
}

function PipelineFunnelFallback() {
  return (
    <GlassCard padding="xl">
      <GlassSkeleton className="mb-4 h-5 w-44" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <GlassSkeleton key={index} className="h-10 rounded-lg" />
        ))}
      </div>
    </GlassCard>
  );
}

function PipelineFunnelFixture() {
  return (
    <GlassCard padding="xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-slate-200" />
          <div className="h-4 w-28 rounded-full bg-slate-200" />
        </div>
        <div className="h-3 w-12 rounded-full bg-slate-100" />
      </div>
      <div className="mb-4 flex gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-5 w-16 rounded-lg bg-slate-100" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-2.5 w-16 rounded-full bg-slate-100" />
            <div className="flex-1 overflow-hidden rounded-lg bg-gray-100/50">
              <div
                className="flex h-8 items-center rounded-lg bg-slate-200 px-2"
                style={{ width: `${100 - index * 16}%` }}
              >
                <div className="h-3 w-4 rounded-full bg-slate-300" />
              </div>
            </div>
            <div className="h-3 w-14 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function AdminPipelineFunnelBone({ loading = true }: { loading?: boolean }) {
  return (
    <DashboardBoneShell
      name="admin-pipeline-funnel"
      loading={loading}
      fallback={<PipelineFunnelFallback />}
      fixture={<PipelineFunnelFixture />}
    />
  );
}

function AiInsightsFallback() {
  return (
    <GlassCard padding="xl">
      <GlassSkeleton className="mb-4 h-5 w-40" />
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <GlassSkeleton key={index} className="h-40 w-56 shrink-0 rounded-xl" />
        ))}
      </div>
    </GlassCard>
  );
}

function AiInsightsFixture() {
  return (
    <GlassCard padding="xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-slate-200" />
          <div className="h-4 w-24 rounded-full bg-slate-200" />
        </div>
        <div className="h-3 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="w-56 shrink-0 rounded-xl border border-gray-100 bg-white/50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-8 w-8 rounded-lg bg-slate-200" />
              <div className="h-4 w-12 rounded-md bg-slate-100" />
            </div>
            <div className="mb-1 h-4 w-36 rounded-full bg-slate-200" />
            <div className="mb-2 h-4 w-16 rounded-full bg-emerald-100" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-slate-100" />
              <div className="h-3 w-5/6 rounded-full bg-slate-100" />
            </div>
            <div className="mt-3 h-2.5 w-24 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function AdminAiInsightsBone({ loading = true }: { loading?: boolean }) {
  return (
    <DashboardBoneShell
      name="admin-ai-insights"
      loading={loading}
      fallback={<AiInsightsFallback />}
      fixture={<AiInsightsFixture />}
    />
  );
}

function PerformanceScorecardFallback() {
  return (
    <GlassCard padding="lg">
      <GlassSkeleton className="h-6 w-52" />
    </GlassCard>
  );
}

function PerformanceScorecardFixture() {
  return (
    <GlassCard padding="lg">
      <div className="flex w-full items-center gap-3">
        <div className="h-4 w-4 rounded-full bg-slate-200" />
        <div className="h-4 w-40 rounded-full bg-slate-200" />
        <div className="flex-1" />
        <div className="h-4 w-4 rounded-full bg-slate-100" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-100 bg-white/50 px-4 py-3"
          >
            <div className="h-2.5 w-20 rounded-full bg-slate-100" />
            <div className="mt-2 flex items-center justify-between">
              <div className="h-6 w-14 rounded-full bg-slate-200" />
              <div className="h-3 w-8 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function AdminPerformanceScorecardBone({ loading = true }: { loading?: boolean }) {
  return (
    <DashboardBoneShell
      name="admin-performance-scorecard"
      loading={loading}
      fallback={<PerformanceScorecardFallback />}
      fixture={<PerformanceScorecardFixture />}
    />
  );
}
