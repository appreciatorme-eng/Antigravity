"use client";

import { PlannerItineraryCardBone } from "@/components/ui/skeletons/PlannerItineraryCardBone";
import { TripTileBone } from "@/components/ui/skeletons/TripTileBone";
import { InboxShellBone } from "@/components/ui/skeletons/InboxShellBone";
import {
  AdminAiInsightsBone,
  AdminCalendarPreviewBone,
  AdminCustomerPulseBone,
  AdminKpiStripBone,
  AdminMorningBriefingBone,
  AdminPerformanceScorecardBone,
  AdminPipelineFunnelBone,
  AdminRevenueIntelligenceBone,
  AdminSmartActionQueueBone,
} from "@/components/ui/skeletons/AdminDashboardBones";

export function BoneyardCaptureGallery() {
  return (
    <div className="min-h-screen bg-white p-8 text-slate-900">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Planner Skeleton Capture</h2>
            <p className="text-sm text-slate-500">Captured from the planner card shell used during itinerary loading.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <PlannerItineraryCardBone key={index} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Trips Skeleton Capture</h2>
            <p className="text-sm text-slate-500">Captured from the tile-first trips workspace.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <TripTileBone key={index} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Inbox Skeleton Capture</h2>
            <p className="text-sm text-slate-500">Only the outer 3-column shell is captured for inbox loading.</p>
          </div>
          <div className="min-h-[680px] overflow-hidden rounded-3xl border border-slate-200">
            <InboxShellBone />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Admin Home Skeleton Capture</h2>
            <p className="text-sm text-slate-500">Layout-accurate homepage loading bones for the operator dashboard.</p>
          </div>

          <div className="space-y-8 rounded-[32px] border border-slate-200 bg-[#f8fafc] p-8">
            <AdminMorningBriefingBone />
            <AdminKpiStripBone />

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <AdminSmartActionQueueBone />
              </div>
              <div className="xl:col-span-4">
                <AdminCalendarPreviewBone />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <AdminRevenueIntelligenceBone />
              </div>
              <div className="xl:col-span-4">
                <AdminCustomerPulseBone />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <AdminPipelineFunnelBone />
              <AdminAiInsightsBone />
            </div>

            <AdminPerformanceScorecardBone />
          </div>
        </section>
      </div>
    </div>
  );
}
