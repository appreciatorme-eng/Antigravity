"use client";

import type { ComponentProps } from "react";
import { Skeleton } from "boneyard-js/react";
import { PastItineraryCard } from "@/app/planner/PastItineraryCard";

type PlannerFixtureItinerary = ComponentProps<typeof PastItineraryCard>["itinerary"];

const FIXTURE_ITINERARY: PlannerFixtureItinerary = {
  id: "bone-planner-itinerary",
  trip_title: "Thailand Discovery Escape",
  destination: "Phuket, Thailand",
  duration_days: 7,
  created_at: "2026-04-07T10:00:00.000Z",
  budget: "94400",
  client_id: "client-bone",
  summary: "Island hopping, transfer logistics, and cultural highlights.",
  interests: ["Beaches", "Luxury", "Adventure"],
  client: { full_name: "Avi Travels" },
  share_code: "demo-share-code",
  share_status: "viewed",
  trip_id: "trip-bone",
  proposal_id: "proposal-bone",
  proposal_status: "approved",
  proposal_share_token: "proposal-token",
  proposal_title: "Thailand Discovery Escape",
  client_comments: [],
  client_preferences: null,
  wishlist_items: [],
  viewed_at: "2026-04-08T08:30:00.000Z",
  approved_by: null,
  approved_at: null,
  self_service_status: null,
  hero_image:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
};

function PlannerItineraryCardFallback() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="h-44 animate-pulse bg-slate-200" />
      <div className="space-y-4 p-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-2.5 w-10 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="h-4 w-16 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export function PlannerItineraryCardBone({ loading = true }: { loading?: boolean }) {
  return (
    <Skeleton
      name="planner-past-itinerary-card"
      loading={loading}
      animate="shimmer"
      transition
      stagger
      fallback={<PlannerItineraryCardFallback />}
      fixture={<PastItineraryCard itinerary={FIXTURE_ITINERARY} />}
      className="h-full"
    >
      <PastItineraryCard itinerary={FIXTURE_ITINERARY} />
    </Skeleton>
  );
}
