"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plane } from "lucide-react";

import { TripDetailHeader } from "@/features/trip-detail/TripDetailHeader";
import { TripDetailTabBar } from "@/features/trip-detail/TripDetailTabBar";
import { OverviewTab } from "@/features/trip-detail/tabs/OverviewTab";
import { ItineraryTab } from "@/features/trip-detail/tabs/ItineraryTab";
import { FinancialsTab } from "@/features/trip-detail/tabs/FinancialsTab";
import { ClientCommsTab } from "@/features/trip-detail/tabs/ClientCommsTab";
import { buildDaySchedule } from "@/features/trip-detail/utils";
import type { TripDetailTab, Day } from "@/features/trip-detail/types";

import { useTripDetail, useSaveTripItinerary } from "@/lib/queries/trip-detail";
import { useCloneTrip } from "@/lib/queries/trips";

import { GroupManager } from "@/components/trips/GroupManager";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput, GlassTextarea } from "@/components/glass/GlassInput";
import { GlassModal } from "@/components/glass/GlassModal";
import { useToast } from "@/components/ui/toast";

// ---------------------------------------------------------------------------
// Trip Detail Page (thin shell)
// ---------------------------------------------------------------------------

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const { toast } = useToast();

  // --- Data fetching ---
  const { data, isLoading } = useTripDetail(tripId);
  const saveMutation = useSaveTripItinerary();
  const cloneMutation = useCloneTrip();

  // --- Local UI state ---
  const [activeTab, setActiveTab] = useState<TripDetailTab>("overview");
  const [activeDay, setActiveDay] = useState(1);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("Trip Update");
  const [notificationBody, setNotificationBody] = useState("");

  // --- Derived data ---
  const trip = data?.trip ?? null;
  const invoiceSummary = data?.invoiceSummary ?? null;

  const itineraryDays: readonly Day[] = useMemo(
    () =>
      (trip?.itineraries?.raw_data?.days ?? []).map(buildDaySchedule),
    [trip?.itineraries?.raw_data?.days],
  );

  // --- Handlers ---
  const handleSave = () => {
    if (!trip?.itineraries) return;
    saveMutation.mutate(
      { tripId, itineraryId: trip.itineraries.id, days: [...itineraryDays] },
      {
        onSuccess: () =>
          toast({ title: "Trip updated", description: "Trip details saved successfully.", variant: "success" }),
        onError: () =>
          toast({ title: "Sync error", description: "Failed to save trip changes.", variant: "error" }),
      },
    );
  };

  const handleDuplicate = () => {
    cloneMutation.mutate(tripId, {
      onSuccess: (result) => {
        toast({ title: "Trip Duplicated", description: result.message, variant: "success" });
        router.push(`/trips/${result.tripId}`);
      },
      onError: (error: unknown) => {
        toast({
          title: "Duplication Failed",
          description: error instanceof Error ? error.message : "Unable to duplicate trip",
          variant: "error",
        });
      },
    });
  };

  const handleNotify = () => setNotificationOpen(true);

  // --- Loading / error states ---
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Plane className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!trip) {
    return <div className="p-20 text-center text-text-muted">Trip not found.</div>;
  }

  // --- Tab content ---
  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            trip={trip}
            invoiceSummary={invoiceSummary}
            loading={isLoading}
            onTabChange={setActiveTab}
          />
        );
      case "itinerary":
        return (
          <ItineraryTab
            trip={trip}
            itineraryDays={itineraryDays}
            activeDay={activeDay}
            onActiveDayChange={setActiveDay}
            drivers={data?.drivers ?? []}
            assignments={data?.assignments ?? {}}
            accommodations={data?.accommodations ?? {}}
            reminderStatusByDay={data?.reminderStatusByDay ?? {}}
            latestDriverLocation={data?.latestDriverLocation ?? null}
            busyDriversByDay={data?.busyDriversByDay ?? {}}
          />
        );
      case "financials":
        return (
          <FinancialsTab
            trip={trip}
            invoiceSummary={invoiceSummary}
          />
        );
      case "comms":
        return <ClientCommsTab trip={trip} />;
      case "group":
        return (
          <GroupManager
            tripId={tripId}
            tripName={trip.itineraries?.trip_title || trip.destination}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <TripDetailHeader
        trip={trip}
        onSave={handleSave}
        saving={saveMutation.isPending}
        onDuplicate={handleDuplicate}
        duplicating={cloneMutation.isPending}
        onNotify={handleNotify}
      />

      <TripDetailTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {renderTab()}

      {/* Notification modal */}
      <GlassModal
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        title="Dispatch Alert"
        description="Send a notification to the traveler."
      >
        <div className="space-y-6 py-4">
          <GlassInput
            label="Dispatch Key"
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
          />
          <GlassTextarea
            label="Broadcast Content"
            rows={4}
            value={notificationBody}
            onChange={(e) => setNotificationBody(e.target.value)}
            placeholder="Enter notification details..."
          />
          <GlassButton
            variant="primary"
            className="w-full h-12"
            onClick={() => setNotificationOpen(false)}
          >
            Send Notification
          </GlassButton>
        </div>
      </GlassModal>
    </div>
  );
}
