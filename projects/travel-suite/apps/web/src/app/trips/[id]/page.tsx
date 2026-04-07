"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plane } from "lucide-react";

import { TripDetailHeader } from "@/features/trip-detail/TripDetailHeader";
import { TripDetailTabBar } from "@/features/trip-detail/TripDetailTabBar";
import { OverviewTab } from "@/features/trip-detail/tabs/OverviewTab";
import { ItineraryTab } from "@/features/trip-detail/tabs/ItineraryTab";
import { FinancialsTab } from "@/features/trip-detail/tabs/FinancialsTab";
import { ClientCommsTab } from "@/features/trip-detail/tabs/ClientCommsTab";
import { buildDaySchedule } from "@/features/trip-detail/utils";
import type { TripDetailTab, Day, TripItineraryRawData, TripPricing } from "@/features/trip-detail/types";

import { useTripDetail, useSaveTripItinerary } from "@/lib/queries/trip-detail";
import { authedFetch } from "@/lib/api/authed-fetch";
import { useCloneTrip } from "@/lib/queries/trips";

import { GroupManager } from "@/components/trips/GroupManager";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput, GlassTextarea } from "@/components/glass/GlassInput";
import { GlassModal } from "@/components/glass/GlassModal";
import { useToast } from "@/components/ui/toast";
import { GuidedTour } from "@/components/tour/GuidedTour";
import ShareTripModal from "@/components/ShareTripModal";

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
  const [deletingTrip, setDeletingTrip] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [editableRawData, setEditableRawData] = useState<TripItineraryRawData | null>(null);

  // --- Derived data ---
  const trip = data?.trip ?? null;
  const invoiceSummary = data?.invoiceSummary ?? null;

  useEffect(() => {
    if (!trip?.itineraries?.raw_data) {
      setEditableRawData(null);
      return;
    }

    setEditableRawData(
      JSON.parse(JSON.stringify(trip.itineraries.raw_data)) as TripItineraryRawData,
    );
  }, [trip?.id, trip?.itineraries?.id, trip?.itineraries?.raw_data]);

  const tripWithDraft = useMemo(() => {
    if (!trip) return null;
    if (!trip.itineraries || !editableRawData) return trip;
    return {
      ...trip,
      itineraries: {
        ...trip.itineraries,
        raw_data: editableRawData,
      },
    };
  }, [editableRawData, trip]);

  const itineraryDays: readonly Day[] = useMemo(
    () =>
      (editableRawData?.days ?? trip?.itineraries?.raw_data?.days ?? []).map(buildDaySchedule),
    [editableRawData?.days, trip?.itineraries?.raw_data?.days],
  );

  // --- Handlers ---
  const handleSave = () => {
    if (!trip?.itineraries || !editableRawData) return;
    saveMutation.mutate(
      {
        tripId,
        itineraryId: trip.itineraries.id,
        days: [...itineraryDays],
        rawData: {
          ...editableRawData,
          days: [...itineraryDays],
        },
      },
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
  const handleShare = () => setIsShareOpen(true);
  const handleOptimizeRoute = () => {
    toast({
      title: "Coming Soon",
      description: "AI Route Optimization will be available in a future update.",
      variant: "info",
    });
  };

  const handleDeleteTrip = async () => {
    if (deletingTrip || !confirm("Delete this trip? All trip data will be permanently removed.")) {
      return;
    }

    setDeletingTrip(true);
    try {
      const response = await authedFetch(`/api/trips/${tripId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete trip");
      }
      toast({
        title: "Trip deleted",
        description: "The trip has been removed.",
        variant: "success",
      });
      router.push("/trips");
    } catch {
      toast({
        title: "Delete failed",
        description: "Unable to delete this trip right now.",
        variant: "error",
      });
    } finally {
      setDeletingTrip(false);
    }
  };

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
            trip={tripWithDraft ?? trip}
            invoiceSummary={invoiceSummary}
            loading={isLoading}
            onTabChange={setActiveTab}
          />
        );
      case "itinerary":
        return (
          <ItineraryTab
            trip={tripWithDraft ?? trip}
            itineraryDays={itineraryDays}
            onItineraryDaysChange={(days) =>
              setEditableRawData((current) =>
                current ? { ...current, days } : current,
              )
            }
            activeDay={activeDay}
            onActiveDayChange={setActiveDay}
            drivers={data?.drivers ?? []}
            assignments={data?.assignments ?? {}}
            accommodations={data?.accommodations ?? {}}
            reminderStatusByDay={data?.reminderStatusByDay ?? {}}
            latestDriverLocation={data?.latestDriverLocation ?? null}
            busyDriversByDay={data?.busyDriversByDay ?? {}}
            onDeleteTrip={handleDeleteTrip}
            deletingTrip={deletingTrip}
          />
        );
      case "financials":
        return (
          <FinancialsTab
            trip={tripWithDraft ?? trip}
            invoiceSummary={invoiceSummary}
            onPricingChange={(pricing: TripPricing) =>
              setEditableRawData((current) =>
                current ? { ...current, pricing: { ...pricing } } : current,
              )
            }
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
      <GuidedTour />
      <TripDetailHeader
        trip={trip}
        linkedProposal={data?.linkedProposal ?? null}
        onSave={handleSave}
        saving={saveMutation.isPending}
        onDuplicate={handleDuplicate}
        duplicating={cloneMutation.isPending}
        onNotify={handleNotify}
        onShare={handleShare}
        onOptimizeRoute={handleOptimizeRoute}
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

      {/* Share trip modal */}
      <ShareTripModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        tripTitle={trip.itineraries?.trip_title || trip.destination || "Trip"}
        itineraryId={trip.itineraries?.id}
      />
    </div>
  );
}
