"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import ItineraryMap from "@/components/map/ItineraryMap";
import { getDriverWhatsAppLink, formatDriverAssignmentMessage } from "@/lib/notifications.shared";
import { useToast } from "@/components/ui/toast";
import type { Json } from "@/lib/database.types";
import {
    TripHeader,
    DayTabs,
    DriverAssignmentCard,
    AccommodationCard,
    DayActivities,
} from "./_components";
import type {
    Trip,
    Driver,
    DriverAssignment,
    Accommodation,
    Activity,
    Day,
    HotelSuggestion,
    ReminderDayStatus,
    DriverLocationSnapshot,
    TripDetailApiPayload,
    ErrorPayload,
    OverpassResponse,
} from "./_components/types";
import {
    enrichDayDurations,
    buildDaySchedule,
    minutesToTime,
    haversineKm,
} from "./_components/utils";

export default function TripDetailPage() {
    const params = useParams();
    const tripId = params.id as string;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [assignments, setAssignments] = useState<Record<number, DriverAssignment>>({});
    const [accommodations, setAccommodations] = useState<Record<number, Accommodation>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeDay, setActiveDay] = useState(1);
    const [itineraryDays, setItineraryDays] = useState<Day[]>([]);
    const [hotelSuggestions, setHotelSuggestions] = useState<Record<number, HotelSuggestion[]>>({});
    const [hotelLoadingByDay, setHotelLoadingByDay] = useState<Record<number, boolean>>({});
    const [liveLocationUrl, setLiveLocationUrl] = useState<string>("");
    const [creatingLiveLink, setCreatingLiveLink] = useState(false);
    const [reminderStatusByDay, setReminderStatusByDay] = useState<Record<number, ReminderDayStatus>>({});
    const [busyDriversByDay, setBusyDriversByDay] = useState<Record<number, string[]>>({});
    const [latestDriverLocation, setLatestDriverLocation] = useState<DriverLocationSnapshot | null>(null);

    const { toast } = useToast();
    const geocodeCacheRef = useRef(new Map<string, { lat: number; lng: number }>());
    const hotelSearchDebounceRef = useRef<Record<number, number | null>>({});
    const timeOptions = useMemo(
        () => Array.from({ length: 48 }, (_, i) => minutesToTime(i * 30)),
        []
    );

    const supabase = createClient();

    // --- Data fetching ---

    const fetchData = useCallback(async () => {
        if (!tripId) return;

        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            await supabase.auth.refreshSession();
            ({ data: { session } } = await supabase.auth.getSession());
        }
        const headers: Record<string, string> = {};
        if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`/api/admin/trips/${tripId}`, { headers });

        if (!response.ok) {
            let error: ErrorPayload = {};
            try {
                error = (await response.json()) as ErrorPayload;
            } catch {
                error = { error: `HTTP ${response.status}` };
            }
            console.error("Error fetching trip:", error);
            setLoading(false);
            return;
        }

        const payload = (await response.json()) as TripDetailApiPayload;
        const mappedTrip = payload.trip as Trip;
        setTrip(mappedTrip);
        setItineraryDays((mappedTrip.itineraries?.raw_data?.days || []).map(enrichDayDurations).map(buildDaySchedule));
        setDrivers(payload.drivers || []);
        setAssignments(payload.assignments || {});
        setAccommodations(payload.accommodations || {});
        setReminderStatusByDay(payload.reminderStatusByDay || {});
        setBusyDriversByDay(payload.busyDriversByDay || {});
        setLatestDriverLocation(payload.latestDriverLocation || null);
        setLoading(false);
    }, [supabase, tripId]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    useEffect(() => {
        const loadExistingShare = async () => {
            if (!tripId) return;
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const response = await fetch(`/api/location/share?tripId=${tripId}&dayNumber=${activeDay}`, {
                    headers: { Authorization: `Bearer ${session?.access_token || ""}` },
                });
                if (!response.ok) return;
                const payload = await response.json();
                setLiveLocationUrl(payload?.share?.live_url || "");
            } catch {
                // non-blocking
            }
        };
        void loadExistingShare();
    }, [activeDay, tripId, supabase.auth]);

    useEffect(() => {
        const timers = hotelSearchDebounceRef.current;
        return () => {
            Object.values(timers).forEach((timerId) => {
                if (timerId) window.clearTimeout(timerId);
            });
        };
    }, []);

    // --- Geocoding ---

    const geocodeLocation = async (location: string, destinationHint?: string) => {
        const query = [location, destinationHint].filter(Boolean).join(", ");
        if (!query.trim()) return undefined;

        const cached = geocodeCacheRef.current.get(query);
        if (cached) return cached;

        try {
            const url = new URL("https://nominatim.openstreetmap.org/search");
            url.searchParams.set("format", "json");
            url.searchParams.set("limit", "1");
            url.searchParams.set("q", query);

            const response = await fetch(url.toString(), {
                headers: { "Accept": "application/json" },
            });
            if (!response.ok) return undefined;
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) return undefined;

            const lat = Number(data[0].lat);
            const lng = Number(data[0].lon);
            if (Number.isNaN(lat) || Number.isNaN(lng)) return undefined;

            const coords = { lat, lng };
            geocodeCacheRef.current.set(query, coords);
            return coords;
        } catch (error) {
            console.error("Geocode error:", error);
            return undefined;
        }
    };

    useEffect(() => {
        const activeDayData = itineraryDays.find((d) => d.day_number === activeDay);
        if (!activeDayData) return;

        activeDayData.activities.forEach((activity, index) => {
            if (activity.location && !activity.coordinates) {
                void (async () => {
                    const coords = await geocodeLocation(activity.location || "", trip?.destination);
                    if (coords) {
                        updateActivityCoordinates(activeDay, index, coords);
                    }
                })();
            }
        });
    }, [activeDay, itineraryDays, trip?.destination]);

    // --- Updaters ---

    const updateAssignment = (dayNumber: number, field: keyof DriverAssignment, value: string) => {
        setAssignments((prev) => ({
            ...prev,
            [dayNumber]: {
                ...prev[dayNumber],
                day_number: dayNumber,
                [field]: value,
            },
        }));
    };

    const updateAccommodation = (dayNumber: number, field: keyof Accommodation, value: string) => {
        setAccommodations((prev) => ({
            ...prev,
            [dayNumber]: {
                ...prev[dayNumber],
                day_number: dayNumber,
                [field]: value,
            },
        }));
    };

    const updateDayTheme = (dayNumber: number, newTheme: string) => {
        setItineraryDays((prev) =>
            prev.map((day) =>
                day.day_number === dayNumber ? { ...day, theme: newTheme } : day
            )
        );
    };

    const updateActivity = (
        dayNumber: number,
        activityIndex: number,
        field: keyof Activity,
        value: string | number
    ) => {
        setItineraryDays((prev) =>
            prev.map((day) => {
                if (day.day_number === dayNumber) {
                    const newActivities = [...day.activities];
                    newActivities[activityIndex] = {
                        ...newActivities[activityIndex],
                        [field]: value,
                    };
                    return buildDaySchedule({ ...day, activities: newActivities });
                }
                return day;
            })
        );
    };

    const updateActivityCoordinates = (
        dayNumber: number,
        activityIndex: number,
        coordinates: { lat: number; lng: number } | undefined
    ) => {
        setItineraryDays((prev) =>
            prev.map((day) => {
                if (day.day_number === dayNumber) {
                    const newActivities = [...day.activities];
                    newActivities[activityIndex] = {
                        ...newActivities[activityIndex],
                        coordinates,
                    };
                    return buildDaySchedule({ ...day, activities: newActivities });
                }
                return day;
            })
        );
    };

    const handleLocationBlur = async (dayNumber: number, activityIndex: number, location?: string) => {
        const cleanLocation = (location || "").trim();
        if (!cleanLocation) {
            updateActivityCoordinates(dayNumber, activityIndex, undefined);
            return;
        }
        const coords = await geocodeLocation(cleanLocation, trip?.destination);
        if (coords) {
            updateActivityCoordinates(dayNumber, activityIndex, coords);
        }
    };

    const addActivity = (dayNumber: number) => {
        setItineraryDays((prev) =>
            prev.map((day) => {
                if (day.day_number === dayNumber) {
                    return buildDaySchedule({
                        ...day,
                        activities: [
                            ...day.activities,
                            { title: "New Activity", start_time: "", duration_minutes: 90, location: "" },
                        ],
                    });
                }
                return day;
            })
        );
    };

    const removeActivity = (dayNumber: number, activityIndex: number) => {
        setItineraryDays((prev) =>
            prev.map((day) => {
                if (day.day_number === dayNumber) {
                    const newActivities = day.activities.filter((_, index) => index !== activityIndex);
                    return buildDaySchedule({ ...day, activities: newActivities });
                }
                return day;
            })
        );
    };

    // --- Hotels ---

    const fillAccommodationFromSuggestion = (dayNumber: number, suggestion: HotelSuggestion) => {
        updateAccommodation(dayNumber, "hotel_name", suggestion.name);
        updateAccommodation(dayNumber, "address", suggestion.address);
        if (suggestion.phone) {
            updateAccommodation(dayNumber, "contact_phone", suggestion.phone);
        }
    };

    const fetchNearbyHotels = async (dayNumber: number, searchTerm?: string) => {
        const day = itineraryDays.find((d) => d.day_number === dayNumber);
        if (!day) return;

        const cleanSearchTerm = (searchTerm || "").trim().toLowerCase();

        let center: { lat: number; lng: number } | undefined =
            day.activities.find((a) => a.coordinates)?.coordinates;

        if (!center) {
            const firstLocation = day.activities.find((a) => a.location?.trim())?.location;
            if (firstLocation) {
                center = await geocodeLocation(firstLocation, trip?.destination);
            }
        }

        if (!center && trip?.destination) {
            center = await geocodeLocation(trip.destination);
        }

        if (!center) return;

        setHotelLoadingByDay((prev) => ({ ...prev, [dayNumber]: true }));
        try {
            const overpassQuery = `
[out:json][timeout:25];
(
  node["tourism"="hotel"](around:9000,${center.lat},${center.lng});
  way["tourism"="hotel"](around:9000,${center.lat},${center.lng});
  node["tourism"="guest_house"](around:9000,${center.lat},${center.lng});
  way["tourism"="guest_house"](around:9000,${center.lat},${center.lng});
);
out center tags 80;
                `.trim();

            const response = await fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=UTF-8" },
                body: overpassQuery,
            });

            if (!response.ok) return;
            const payload = (await response.json()) as OverpassResponse;
            const elements = Array.isArray(payload?.elements) ? payload.elements : [];

            const suggestions: HotelSuggestion[] = elements
                .map((element) => {
                    const tags = element.tags || {};
                    const name = String(tags.name || "").trim();
                    if (!name) return null;

                    const lat = Number(element.lat ?? element.center?.lat);
                    const lng = Number(element.lon ?? element.center?.lon);
                    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

                    const addressParts = [
                        tags["addr:housenumber"],
                        tags["addr:street"],
                        tags["addr:suburb"],
                        tags["addr:city"],
                    ].filter(Boolean);
                    const address =
                        String(tags["addr:full"] || "").trim() ||
                        (addressParts.length ? addressParts.join(", ") : "Address not available");

                    return {
                        name,
                        address,
                        phone: String(tags.phone || tags["contact:phone"] || "").trim() || undefined,
                        lat,
                        lng,
                        distanceKm: haversineKm(center!, { lat, lng }),
                    } as HotelSuggestion;
                })
                .filter((item: HotelSuggestion | null): item is HotelSuggestion => !!item)
                .filter((item) =>
                    cleanSearchTerm ? item.name.toLowerCase().includes(cleanSearchTerm) : true
                )
                .sort((a, b) => a.distanceKm - b.distanceKm)
                .slice(0, 8);

            setHotelSuggestions((prev) => ({ ...prev, [dayNumber]: suggestions }));

            if (!searchTerm && suggestions[0]) {
                fillAccommodationFromSuggestion(dayNumber, suggestions[0]);
            }
        } catch (error) {
            console.error("Hotel lookup error:", error);
        } finally {
            setHotelLoadingByDay((prev) => ({ ...prev, [dayNumber]: false }));
        }
    };

    // --- Save ---

    const saveChanges = async () => {
        setSaving(true);

        try {
            for (const [dayNumber, assignment] of Object.entries(assignments)) {
                if (assignment.external_driver_id) {
                    const data = {
                        trip_id: tripId,
                        day_number: parseInt(dayNumber),
                        external_driver_id: assignment.external_driver_id,
                        pickup_time: assignment.pickup_time || null,
                        pickup_location: assignment.pickup_location || null,
                        notes: assignment.notes || null,
                    };

                    if (assignment.id) {
                        await supabase
                            .from("trip_driver_assignments")
                            .update(data)
                            .eq("id", assignment.id);
                    } else {
                        await supabase.from("trip_driver_assignments").insert(data);
                    }
                }
            }

            for (const [dayNumber, accommodation] of Object.entries(accommodations)) {
                if (accommodation.hotel_name) {
                    const data = {
                        trip_id: tripId,
                        day_number: parseInt(dayNumber),
                        hotel_name: accommodation.hotel_name,
                        address: accommodation.address || null,
                        check_in_time: accommodation.check_in_time || "15:00",
                        contact_phone: accommodation.contact_phone || null,
                    };

                    if (accommodation.id) {
                        await supabase
                            .from("trip_accommodations")
                            .update(data)
                            .eq("id", accommodation.id);
                    } else {
                        await supabase.from("trip_accommodations").insert(data);
                    }
                }
            }

            if (trip?.itineraries?.id) {
                await supabase
                    .from("itineraries")
                    .update({
                        raw_data: { days: itineraryDays } as unknown as Json,
                    })
                    .eq("id", trip.itineraries.id);
            }

            await fetchData();
            toast({
                title: "Changes saved",
                description: "Trip updates were saved successfully.",
                variant: "success",
            });
        } catch (error) {
            console.error("Error saving:", error);
            toast({
                title: "Save failed",
                description: "Error saving changes",
                variant: "error",
            });
        }

        setSaving(false);
    };

    // --- Live location ---

    const createLiveLocationShare = async () => {
        if (!tripId) return;

        setCreatingLiveLink(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/location/share", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
                body: JSON.stringify({
                    tripId,
                    dayNumber: activeDay,
                    expiresHours: 48,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                toast({
                    title: "Live link failed",
                    description: payload?.error || "Failed to create live location link",
                    variant: "error",
                });
                return;
            }

            const url = payload?.share?.live_url || "";
            setLiveLocationUrl(url);
            if (url) {
                await navigator.clipboard.writeText(url);
                toast({
                    title: "Live link created",
                    description: "Live location link created and copied to clipboard.",
                    variant: "success",
                });
            }
        } catch (error) {
            console.error("Live location share error:", error);
            toast({
                title: "Live link failed",
                description: "Failed to create live location share",
                variant: "error",
            });
        } finally {
            setCreatingLiveLink(false);
        }
    };

    const revokeLiveLocationShare = async () => {
        if (!tripId || !liveLocationUrl) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(
                `/api/location/share?tripId=${tripId}&dayNumber=${activeDay}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${session?.access_token || ""}` },
                }
            );

            const payload = await response.json();
            if (!response.ok) {
                toast({
                    title: "Revoke failed",
                    description: payload?.error || "Failed to revoke live link",
                    variant: "error",
                });
                return;
            }
            setLiveLocationUrl("");
            toast({
                title: "Live links revoked",
                description: `Revoked ${payload.revoked || 0} active live link(s)`,
                variant: "success",
            });
        } catch (error) {
            console.error("Revoke live link error:", error);
            toast({
                title: "Revoke failed",
                description: "Failed to revoke live link",
                variant: "error",
            });
        }
    };

    // --- WhatsApp ---

    const getWhatsAppLinkForDay = (dayNumber: number) => {
        const assignment = assignments[dayNumber];
        if (!assignment?.external_driver_id) return null;

        const driver = drivers.find((d) => d.id === assignment.external_driver_id);
        if (!driver || !driver.phone) return null;

        const day = trip?.itineraries?.raw_data?.days?.find((d) => d.day_number === dayNumber);
        const accommodation = accommodations[dayNumber];

        const baseMessage = formatDriverAssignmentMessage({
            clientName: trip?.profiles?.full_name || "Client",
            pickupTime: assignment.pickup_time || "TBD",
            pickupLocation: assignment.pickup_location || trip?.destination || "TBD",
            activities: day?.activities || [],
            hotelName: accommodation?.hotel_name || "TBD",
        });

        const liveLinkSuffix =
            liveLocationUrl && dayNumber === activeDay
                ? `\n\nLive location link:\n${liveLocationUrl}`
                : "";

        const message = `${baseMessage}${liveLinkSuffix}`;
        return getDriverWhatsAppLink(driver.phone, message);
    };

    // --- Render ---

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Trip not found</p>
            </div>
        );
    }

    const days = trip.itineraries?.raw_data?.days || [];
    const durationDays = trip.itineraries?.duration_days || days.length || 1;
    const activeDayData = itineraryDays.find((d) => d.day_number === activeDay);

    return (
        <div className="space-y-6">
            <TripHeader
                trip={trip}
                durationDays={durationDays}
                saving={saving}
                liveLocationUrl={liveLocationUrl}
                creatingLiveLink={creatingLiveLink}
                onSave={saveChanges}
                onCreateLiveLink={createLiveLocationShare}
                onRevokeLiveLink={revokeLiveLocationShare}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <DayTabs
                        durationDays={durationDays}
                        activeDay={activeDay}
                        assignments={assignments}
                        onDayChange={setActiveDay}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DriverAssignmentCard
                            activeDay={activeDay}
                            assignment={assignments[activeDay]}
                            drivers={drivers}
                            busyDriverIds={busyDriversByDay[activeDay] || []}
                            whatsAppLink={getWhatsAppLinkForDay(activeDay)}
                            onUpdateAssignment={updateAssignment}
                        />
                        <AccommodationCard
                            activeDay={activeDay}
                            accommodation={accommodations[activeDay]}
                            hotelSuggestions={hotelSuggestions[activeDay] || []}
                            hotelLoading={hotelLoadingByDay[activeDay] || false}
                            onUpdateAccommodation={updateAccommodation}
                            onFillFromSuggestion={fillAccommodationFromSuggestion}
                            onFetchNearbyHotels={fetchNearbyHotels}
                        />
                    </div>

                    <DayActivities
                        activeDay={activeDay}
                        activeDayData={activeDayData}
                        reminderStatus={reminderStatusByDay[activeDay]}
                        latestDriverLocation={latestDriverLocation}
                        timeOptions={timeOptions}
                        onUpdateDayTheme={updateDayTheme}
                        onUpdateActivity={updateActivity}
                        onAddActivity={addActivity}
                        onRemoveActivity={removeActivity}
                        onLocationBlur={handleLocationBlur}
                    />
                </div>

                <div className="hidden xl:block h-[calc(100vh-100px)] sticky top-6">
                    <ItineraryMap
                        activities={activeDayData?.activities || []}
                    />
                </div>
            </div>
        </div>
    );
}
