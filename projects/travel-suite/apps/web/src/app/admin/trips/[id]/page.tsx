"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    User,
    Car,
    Hotel,
    Clock,
    Phone,
    MessageCircle,
    Send,
    Save,
    Bell,
} from "lucide-react";
import { getDriverWhatsAppLink, formatDriverAssignmentMessage } from "@/lib/notifications";

interface Driver {
    id: string;
    full_name: string;
    phone: string;
    vehicle_type: string;
    vehicle_plate: string;
}

interface DriverAssignment {
    id?: string;
    day_number: number;
    external_driver_id: string | null;
    pickup_time: string;
    pickup_location: string;
    notes: string;
}

interface Accommodation {
    id?: string;
    day_number: number;
    hotel_name: string;
    address: string;
    check_in_time: string;
    contact_phone: string;
}

interface Activity {
    title: string;
    duration_minutes: number;
}

interface Day {
    day_number: number;
    theme: string;
    activities: Activity[];
}

interface Trip {
    id: string;
    status: string;
    start_date: string;
    end_date: string;
    destination: string;
    profiles: {
        id: string;
        full_name: string;
        email: string;
    } | null;
    itineraries: {
        trip_title: string;
        duration_days: number;
        raw_data: {
            days: Day[];
        };
    } | null;
}

export default function TripDetailPage() {
    const params = useParams();
    const router = useRouter();
    const tripId = params.id as string;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [assignments, setAssignments] = useState<Record<number, DriverAssignment>>({});
    const [accommodations, setAccommodations] = useState<Record<number, Accommodation>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeDay, setActiveDay] = useState(1);

    const supabase = createClientComponentClient();

    useEffect(() => {
        if (tripId) {
            fetchData();
        }
    }, [tripId]);

    const fetchData = async () => {
        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
            .from("trips")
            .select(`
                id,
                status,
                start_date,
                end_date,
                destination,
                profiles!trips_user_id_fkey (
                    id,
                    full_name,
                    email
                ),
                itineraries (
                    trip_title,
                    duration_days,
                    raw_data
                )
            `)
            .eq("id", tripId)
            .single();

        if (tripError) {
            console.error("Error fetching trip:", tripError);
            return;
        }

        setTrip(tripData as unknown as Trip);

        // Fetch drivers
        const { data: driversData } = await supabase
            .from("external_drivers")
            .select("*")
            .eq("is_active", true)
            .order("full_name");

        setDrivers(driversData || []);

        // Fetch existing assignments
        const { data: assignmentsData } = await supabase
            .from("trip_driver_assignments")
            .select("*")
            .eq("trip_id", tripId);

        if (assignmentsData) {
            const assignmentsMap: Record<number, DriverAssignment> = {};
            assignmentsData.forEach((a: any) => {
                assignmentsMap[a.day_number] = {
                    id: a.id,
                    day_number: a.day_number,
                    external_driver_id: a.external_driver_id,
                    pickup_time: a.pickup_time || "",
                    pickup_location: a.pickup_location || "",
                    notes: a.notes || "",
                };
            });
            setAssignments(assignmentsMap);
        }

        // Fetch existing accommodations
        const { data: accommodationsData } = await supabase
            .from("trip_accommodations")
            .select("*")
            .eq("trip_id", tripId);

        if (accommodationsData) {
            const accommodationsMap: Record<number, Accommodation> = {};
            accommodationsData.forEach((a: any) => {
                accommodationsMap[a.day_number] = {
                    id: a.id,
                    day_number: a.day_number,
                    hotel_name: a.hotel_name || "",
                    address: a.address || "",
                    check_in_time: a.check_in_time || "15:00",
                    contact_phone: a.contact_phone || "",
                };
            });
            setAccommodations(accommodationsMap);
        }

        setLoading(false);
    };

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

    const saveChanges = async () => {
        setSaving(true);

        try {
            // Save driver assignments
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

            // Save accommodations
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

            // Refresh data
            await fetchData();
            alert("Changes saved successfully!");
        } catch (error) {
            console.error("Error saving:", error);
            alert("Error saving changes");
        }

        setSaving(false);
    };

    const sendNotificationToClient = async () => {
        if (!trip?.profiles?.id) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/notifications/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    tripId,
                    userId: trip.profiles.id,
                    type: "itinerary_update",
                    title: "Trip Updated",
                    body: `Your trip to ${trip.destination} has been updated with new details.`,
                }),
            });

            if (response.ok) {
                alert("Notification sent to client!");
            } else {
                alert("Failed to send notification");
            }
        } catch (error) {
            console.error("Error sending notification:", error);
            alert("Error sending notification");
        }
    };

    const getWhatsAppLinkForDay = (dayNumber: number) => {
        const assignment = assignments[dayNumber];
        if (!assignment?.external_driver_id) return null;

        const driver = drivers.find((d) => d.id === assignment.external_driver_id);
        if (!driver) return null;

        const day = trip?.itineraries?.raw_data?.days?.find((d) => d.day_number === dayNumber);
        const accommodation = accommodations[dayNumber];

        const message = formatDriverAssignmentMessage({
            clientName: trip?.profiles?.full_name || "Client",
            pickupTime: assignment.pickup_time || "TBD",
            pickupLocation: assignment.pickup_location || trip?.destination || "TBD",
            activities: day?.activities || [],
            hotelName: accommodation?.hotel_name || "TBD",
        });

        return getDriverWhatsAppLink(driver.phone, message);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/trips"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {trip.itineraries?.trip_title || trip.destination}
                        </h1>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {trip.profiles?.full_name}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(trip.start_date)}
                            </span>
                            <span>{durationDays} days</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={sendNotificationToClient}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Bell className="h-4 w-4" />
                        Notify Client
                    </button>
                    <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* Day Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: durationDays }, (_, i) => i + 1).map((day) => (
                    <button
                        key={day}
                        onClick={() => setActiveDay(day)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeDay === day
                                ? "bg-primary text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        Day {day}
                        {assignments[day]?.external_driver_id && (
                            <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Day Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Driver Assignment */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Car className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Driver Assignment</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Driver
                            </label>
                            <select
                                value={assignments[activeDay]?.external_driver_id || ""}
                                onChange={(e) =>
                                    updateAssignment(activeDay, "external_driver_id", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="">No driver assigned</option>
                                {drivers.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.full_name} - {driver.vehicle_type} ({driver.vehicle_plate})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    Pickup Time
                                </label>
                                <input
                                    type="time"
                                    value={assignments[activeDay]?.pickup_time || ""}
                                    onChange={(e) =>
                                        updateAssignment(activeDay, "pickup_time", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <MapPin className="h-3 w-3 inline mr-1" />
                                    Pickup Location
                                </label>
                                <input
                                    type="text"
                                    value={assignments[activeDay]?.pickup_location || ""}
                                    onChange={(e) =>
                                        updateAssignment(activeDay, "pickup_location", e.target.value)
                                    }
                                    placeholder="Hotel lobby, airport..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes for Driver
                            </label>
                            <textarea
                                value={assignments[activeDay]?.notes || ""}
                                onChange={(e) => updateAssignment(activeDay, "notes", e.target.value)}
                                placeholder="Special instructions..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        {assignments[activeDay]?.external_driver_id && (
                            <div className="pt-4 border-t border-gray-100">
                                <a
                                    href={getWhatsAppLinkForDay(activeDay) || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Send to Driver via WhatsApp
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Accommodation */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Hotel className="h-5 w-5 text-secondary" />
                        <h2 className="text-lg font-semibold">Accommodation</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hotel Name
                            </label>
                            <input
                                type="text"
                                value={accommodations[activeDay]?.hotel_name || ""}
                                onChange={(e) =>
                                    updateAccommodation(activeDay, "hotel_name", e.target.value)
                                }
                                placeholder="Enter hotel name"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <input
                                type="text"
                                value={accommodations[activeDay]?.address || ""}
                                onChange={(e) =>
                                    updateAccommodation(activeDay, "address", e.target.value)
                                }
                                placeholder="Hotel address"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Check-in Time
                                </label>
                                <input
                                    type="time"
                                    value={accommodations[activeDay]?.check_in_time || "15:00"}
                                    onChange={(e) =>
                                        updateAccommodation(activeDay, "check_in_time", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="h-3 w-3 inline mr-1" />
                                    Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    value={accommodations[activeDay]?.contact_phone || ""}
                                    onChange={(e) =>
                                        updateAccommodation(activeDay, "contact_phone", e.target.value)
                                    }
                                    placeholder="+1 234 567 8900"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Day Activities (Read-only) */}
            {days.find((d) => d.day_number === activeDay) && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        Day {activeDay}: {days.find((d) => d.day_number === activeDay)?.theme}
                    </h2>
                    <div className="space-y-3">
                        {days
                            .find((d) => d.day_number === activeDay)
                            ?.activities.map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{activity.title}</p>
                                    </div>
                                    {activity.duration_minutes && (
                                        <span className="text-sm text-gray-500">
                                            {activity.duration_minutes} mins
                                        </span>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
