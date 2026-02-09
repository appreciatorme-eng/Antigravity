import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../../src/lib/supabase";
import { Colors } from "../../../src/constants/Colors";
import {
    MapPin,
    Phone,
    Car,
    Hotel,
    Clock,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    Plane,
} from "lucide-react-native";
import { notifyClientLanded } from "../../../src/lib/notifications";

interface Activity {
    time: string;
    title: string;
    description: string;
    location?: string;
    duration_minutes?: number;
}

interface Day {
    day_number: number;
    theme: string;
    activities: Activity[];
}

interface Driver {
    id: string;
    full_name: string;
    phone: string;
    vehicle_type: string;
    vehicle_plate: string;
}

interface DriverAssignment {
    day_number: number;
    pickup_time: string;
    pickup_location: string;
    driver: Driver | null;
}

interface Accommodation {
    day_number: number;
    hotel_name: string;
    address: string;
    check_in_time: string;
    contact_phone: string;
}

interface TripData {
    id: string;
    status: string;
    start_date: string;
    end_date: string;
    itinerary: {
        trip_title: string;
        destination: string;
        duration_days: number;
        raw_data: {
            days: Day[];
        };
    };
    driver_assignments: DriverAssignment[];
    accommodations: Accommodation[];
}

export default function TripDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [trip, setTrip] = useState<TripData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(1);
    const [expandedDays, setExpandedDays] = useState<number[]>([1]);
    const [landingInProgress, setLandingInProgress] = useState(false);
    const [hasLanded, setHasLanded] = useState(false);

    useEffect(() => {
        fetchTripDetails();
    }, [id]);

    const fetchTripDetails = async () => {
        if (!id) return;

        const { data, error } = await supabase
            .from("trips")
            .select(
                `
                id,
                status,
                start_date,
                end_date,
                itinerary:itineraries (
                    trip_title,
                    destination,
                    duration_days,
                    raw_data
                ),
                driver_assignments:trip_driver_assignments (
                    day_number,
                    pickup_time,
                    pickup_location,
                    driver:external_drivers (
                        id,
                        full_name,
                        phone,
                        vehicle_type,
                        vehicle_plate
                    )
                ),
                accommodations:trip_accommodations (
                    day_number,
                    hotel_name,
                    address,
                    check_in_time,
                    contact_phone
                )
            `
            )
            .eq("id", id)
            .single();

        if (error) {
            console.error("Error fetching trip:", error);
            Alert.alert("Error", "Failed to load trip details");
        } else if (data) {
            setTrip(data as unknown as TripData);
        }

        setLoading(false);
    };

    const toggleDay = (dayNumber: number) => {
        setExpandedDays((prev) =>
            prev.includes(dayNumber)
                ? prev.filter((d) => d !== dayNumber)
                : [...prev, dayNumber]
        );
    };

    const callDriver = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const whatsappDriver = (phone: string, driverName: string) => {
        const message = encodeURIComponent(
            `Hi ${driverName}, I'm your client for today's trip. Just checking in!`
        );
        const cleanPhone = phone.replace(/\D/g, "");
        Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const handleLanding = async () => {
        if (!id || hasLanded) return;

        Alert.alert(
            "Confirm Landing",
            "Let your driver know you've arrived?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, I've Landed",
                    onPress: async () => {
                        setLandingInProgress(true);
                        const result = await notifyClientLanded(id);
                        setLandingInProgress(false);

                        if (result.success) {
                            setHasLanded(true);
                            Alert.alert(
                                "Welcome!",
                                "Your driver has been notified. Check your notifications for their contact details."
                            );
                        } else {
                            Alert.alert("Error", result.error || "Failed to send notification");
                        }
                    },
                },
            ]
        );
    };

    const getDriverForDay = (dayNumber: number): DriverAssignment | undefined => {
        return trip?.driver_assignments?.find((a) => a.day_number === dayNumber);
    };

    const getAccommodationForDay = (dayNumber: number): Accommodation | undefined => {
        return trip?.accommodations?.find((a) => a.day_number === dayNumber);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!trip) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Trip not found</Text>
            </View>
        );
    }

    const days: Day[] = trip.itinerary?.raw_data?.days || [];

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerOverlay}>
                    <Text style={styles.tripTitle}>
                        {trip.itinerary?.trip_title || "Your Trip"}
                    </Text>
                    <Text style={styles.tripDate}>
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                    </Text>
                    <View style={styles.destinationBadge}>
                        <MapPin size={14} color={Colors.white} />
                        <Text style={styles.destinationText}>
                            {trip.itinerary?.destination}
                        </Text>
                    </View>

                    {/* I've Landed Button */}
                    {trip.status === "confirmed" && !hasLanded && (
                        <TouchableOpacity
                            style={styles.landedButton}
                            onPress={handleLanding}
                            disabled={landingInProgress}
                        >
                            {landingInProgress ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                                <>
                                    <Plane size={18} color={Colors.primary} />
                                    <Text style={styles.landedButtonText}>I've Landed</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    {hasLanded && (
                        <View style={styles.landedConfirmation}>
                            <Text style={styles.landedConfirmationText}>
                                Driver notified - Have a great trip!
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Days */}
            <View style={styles.content}>
                {days.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            Itinerary details will appear here once your travel agent
                            finalizes the plan.
                        </Text>
                    </View>
                ) : (
                    days.map((day) => {
                        const isExpanded = expandedDays.includes(day.day_number);
                        const driverAssignment = getDriverForDay(day.day_number);
                        const accommodation = getAccommodationForDay(day.day_number);

                        return (
                            <View key={day.day_number} style={styles.dayCard}>
                                {/* Day Header */}
                                <TouchableOpacity
                                    style={styles.dayHeader}
                                    onPress={() => toggleDay(day.day_number)}
                                >
                                    <View>
                                        <Text style={styles.dayNumber}>
                                            Day {day.day_number}
                                        </Text>
                                        <Text style={styles.dayTheme}>{day.theme}</Text>
                                    </View>
                                    {isExpanded ? (
                                        <ChevronUp size={24} color={Colors.gray} />
                                    ) : (
                                        <ChevronDown size={24} color={Colors.gray} />
                                    )}
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View style={styles.dayContent}>
                                        {/* Driver Card */}
                                        {driverAssignment?.driver && (
                                            <View style={styles.driverCard}>
                                                <View style={styles.driverHeader}>
                                                    <Car size={18} color={Colors.primary} />
                                                    <Text style={styles.driverLabel}>
                                                        Your Driver
                                                    </Text>
                                                </View>
                                                <View style={styles.driverInfo}>
                                                    <View style={styles.driverAvatar}>
                                                        <Text style={styles.driverInitials}>
                                                            {driverAssignment.driver.full_name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.driverDetails}>
                                                        <Text style={styles.driverName}>
                                                            {driverAssignment.driver.full_name}
                                                        </Text>
                                                        <Text style={styles.vehicleInfo}>
                                                            {driverAssignment.driver.vehicle_type} •{" "}
                                                            {driverAssignment.driver.vehicle_plate}
                                                        </Text>
                                                        {driverAssignment.pickup_time && (
                                                            <Text style={styles.pickupInfo}>
                                                                Pickup: {driverAssignment.pickup_time} at{" "}
                                                                {driverAssignment.pickup_location}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                                <View style={styles.driverActions}>
                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() =>
                                                            callDriver(driverAssignment.driver!.phone)
                                                        }
                                                    >
                                                        <Phone size={18} color={Colors.primary} />
                                                        <Text style={styles.actionText}>Call</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.actionButton,
                                                            styles.whatsappButton,
                                                        ]}
                                                        onPress={() =>
                                                            whatsappDriver(
                                                                driverAssignment.driver!.phone,
                                                                driverAssignment.driver!.full_name
                                                            )
                                                        }
                                                    >
                                                        <MessageCircle
                                                            size={18}
                                                            color={Colors.white}
                                                        />
                                                        <Text style={styles.whatsappText}>
                                                            WhatsApp
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}

                                        {/* Activities Timeline */}
                                        <View style={styles.timeline}>
                                            {day.activities.map((activity, index) => (
                                                <View key={index} style={styles.timelineItem}>
                                                    <View style={styles.timelineLeft}>
                                                        <Text style={styles.time}>
                                                            {activity.time}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.timelineCenter}>
                                                        <View style={styles.dot} />
                                                        {index < day.activities.length - 1 && (
                                                            <View style={styles.line} />
                                                        )}
                                                    </View>
                                                    <View style={styles.timelineRight}>
                                                        <Text style={styles.activityTitle}>
                                                            {activity.title}
                                                        </Text>
                                                        <Text style={styles.activityDesc}>
                                                            {activity.description}
                                                        </Text>
                                                        {activity.duration_minutes && (
                                                            <View style={styles.durationTag}>
                                                                <Clock size={12} color={Colors.gray} />
                                                                <Text style={styles.durationText}>
                                                                    {activity.duration_minutes} mins
                                                                </Text>
                                                            </View>
                                                        )}
                                                        {activity.location && (
                                                            <View style={styles.locationTag}>
                                                                <MapPin size={12} color={Colors.gray} />
                                                                <Text style={styles.locationText}>
                                                                    {activity.location}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>

                                        {/* Hotel Card */}
                                        {accommodation && (
                                            <View style={styles.hotelCard}>
                                                <View style={styles.hotelHeader}>
                                                    <Hotel size={18} color={Colors.secondary} />
                                                    <Text style={styles.hotelLabel}>
                                                        Tonight's Stay
                                                    </Text>
                                                </View>
                                                <Text style={styles.hotelName}>
                                                    {accommodation.hotel_name}
                                                </Text>
                                                {accommodation.address && (
                                                    <Text style={styles.hotelAddress}>
                                                        {accommodation.address}
                                                    </Text>
                                                )}
                                                <Text style={styles.checkInTime}>
                                                    Check-in: {accommodation.check_in_time || "3:00 PM"}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    errorText: {
        fontSize: 16,
        color: Colors.gray,
    },
    header: {
        height: 180,
        backgroundColor: Colors.secondary,
        justifyContent: "flex-end",
    },
    headerOverlay: {
        padding: 20,
    },
    tripTitle: {
        fontSize: 26,
        fontWeight: "bold",
        color: Colors.white,
    },
    tripDate: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        marginTop: 4,
    },
    destinationBadge: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        gap: 6,
    },
    destinationText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: "500",
    },
    content: {
        padding: 16,
    },
    emptyState: {
        padding: 40,
        alignItems: "center",
    },
    emptyText: {
        textAlign: "center",
        color: Colors.gray,
        lineHeight: 22,
    },
    dayCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    dayHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    dayNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.secondary,
    },
    dayTheme: {
        fontSize: 14,
        color: Colors.gray,
        marginTop: 2,
    },
    dayContent: {
        padding: 16,
        paddingTop: 0,
    },
    driverCard: {
        backgroundColor: Colors.primary + "10",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    driverHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    driverLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.primary,
    },
    driverInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    driverAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.secondary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    driverInitials: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1f2937",
    },
    vehicleInfo: {
        fontSize: 13,
        color: Colors.gray,
        marginTop: 2,
    },
    pickupInfo: {
        fontSize: 12,
        color: Colors.primary,
        marginTop: 4,
        fontWeight: "500",
    },
    driverActions: {
        flexDirection: "row",
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    actionText: {
        color: Colors.primary,
        fontWeight: "600",
    },
    whatsappButton: {
        backgroundColor: "#25D366",
        borderColor: "#25D366",
    },
    whatsappText: {
        color: Colors.white,
        fontWeight: "600",
    },
    timeline: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: "row",
    },
    timelineLeft: {
        width: 50,
        paddingTop: 2,
    },
    time: {
        fontSize: 12,
        fontWeight: "bold",
        color: Colors.secondary,
    },
    timelineCenter: {
        width: 20,
        alignItems: "center",
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
        zIndex: 1,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: "#e5e7eb",
        marginVertical: 4,
    },
    timelineRight: {
        flex: 1,
        paddingLeft: 12,
        paddingBottom: 24,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 4,
    },
    activityDesc: {
        color: Colors.gray,
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 8,
    },
    durationTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 4,
    },
    durationText: {
        fontSize: 11,
        color: Colors.gray,
    },
    locationTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    locationText: {
        fontSize: 11,
        color: Colors.gray,
    },
    hotelCard: {
        backgroundColor: Colors.secondary + "10",
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    hotelHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    hotelLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.secondary,
    },
    hotelName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1f2937",
    },
    hotelAddress: {
        fontSize: 13,
        color: Colors.gray,
        marginTop: 4,
    },
    checkInTime: {
        fontSize: 12,
        color: Colors.secondary,
        marginTop: 8,
        fontWeight: "500",
    },
    landedButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: Colors.white,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    landedButtonText: {
        color: Colors.primary,
        fontWeight: "bold",
        fontSize: 16,
    },
    landedConfirmation: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginTop: 16,
    },
    landedConfirmationText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: "500",
    },
});
