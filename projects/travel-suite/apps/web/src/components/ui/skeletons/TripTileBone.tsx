"use client";

import { Skeleton } from "boneyard-js/react";
import { TripGridCard } from "@/app/trips/TripGridCard";
import type { EnrichedTrip } from "@/app/trips/types";

const FIXTURE_TRIP: EnrichedTrip = {
  id: "bone-trip-card",
  client_id: "client-bone",
  status: "pending",
  start_date: "2026-04-20",
  end_date: "2026-04-27",
  destination: "Phuket, Thailand",
  created_at: "2026-04-07T08:00:00.000Z",
  organization_id: "org-bone",
  profiles: {
    full_name: "Avinash Reddy",
    email: "avi@example.com",
  },
  itineraries: {
    id: "itinerary-bone",
    trip_title: "Thailand Tour Package",
    duration_days: 7,
    destination: "Phuket, Thailand",
  },
  itinerary_id: "itinerary-bone",
  hero_image:
    "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80",
  share_code: "trip-share-code",
  share_status: "viewed",
  viewed_at: "2026-04-08T09:00:00.000Z",
  approved_at: null,
  approved_by: null,
  self_service_status: null,
  client_comments: [],
  client_preferences: null,
  wishlist_items: [],
  proposal_id: "proposal-bone",
  proposal_status: "approved",
  proposal_share_token: "proposal-token",
  proposal_title: "Thailand Tour Package",
  invoice: {
    total_amount: 94400,
    paid_amount: 0,
    balance_amount: 94400,
    payment_status: "unpaid",
  },
  driver_coverage: {
    covered_days: 2,
    total_days: 7,
  },
  accommodation_coverage: {
    covered_days: 3,
    total_days: 7,
  },
  has_itinerary: true,
  days_until_departure: 7,
};

function TripTileFallback() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
      <div className="h-52 animate-pulse bg-slate-200" />
      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <div className="h-3 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-1.5 w-10 animate-pulse rounded-full bg-slate-200" />
            ))}
          </div>
          <div className="h-3 w-28 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="flex flex-wrap gap-2.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-8 w-28 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
        <div className="rounded-[24px] border border-slate-100 p-4">
          <div className="space-y-3">
            <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-11 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-11 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TripTileBone({ loading = true }: { loading?: boolean }) {
  return (
    <Skeleton
      name="trip-grid-tile"
      loading={loading}
      animate="shimmer"
      transition
      stagger
      fallback={<TripTileFallback />}
      fixture={<TripGridCard trip={FIXTURE_TRIP} />}
      className="h-full"
    >
      <TripGridCard trip={FIXTURE_TRIP} />
    </Skeleton>
  );
}
