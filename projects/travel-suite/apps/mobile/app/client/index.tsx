import { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { Colors } from "../../src/constants/Colors";
import {
    MapPin,
    Calendar,
    ChevronRight,
    Plane,
    LogOut,
} from "lucide-react-native";

interface Trip {
    id: string;
    status: string;
    start_date: string;
    end_date: string;
    itinerary: {
        trip_title: string;
        destination: string;
        duration_days: number;
    } | null;
}

export default function ClientTripsScreen() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTrips = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            router.replace("/auth/login");
            return;
        }

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
                    duration_days
                )
            `
            )
            .eq("client_id", user.id)
            .order("start_date", { ascending: false });

        if (error) {
            console.error("Error fetching trips:", error);
        } else {
            // Transform data to flatten itinerary
            const transformedTrips = (data || []).map((trip: any) => ({
                ...trip,
                itinerary: trip.itinerary || {
                    trip_title: "Untitled Trip",
                    destination: "Unknown",
                    duration_days: 1,
                },
            }));
            setTrips(transformedTrips);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTrips();
        setRefreshing(false);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace("/");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed":
                return "#22c55e";
            case "in_progress":
                return Colors.primary;
            case "pending":
                return "#f59e0b";
            case "completed":
                return Colors.gray;
            case "cancelled":
                return "#ef4444";
            default:
                return Colors.gray;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "TBD";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const renderTrip = ({ item }: { item: Trip }) => (
        <TouchableOpacity
            style={styles.tripCard}
            onPress={() => router.push(`/client/trip/${item.id}`)}
        >
            <View style={styles.tripHeader}>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) + "20" },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusText,
                            { color: getStatusColor(item.status) },
                        ]}
                    >
                        {item.status.replace("_", " ").toUpperCase()}
                    </Text>
                </View>
                <ChevronRight size={20} color={Colors.gray} />
            </View>

            <Text style={styles.tripTitle}>
                {item.itinerary?.trip_title || "Untitled Trip"}
            </Text>

            <View style={styles.tripDetails}>
                <View style={styles.detailRow}>
                    <MapPin size={16} color={Colors.primary} />
                    <Text style={styles.detailText}>
                        {item.itinerary?.destination || "Unknown"}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Calendar size={16} color={Colors.secondary} />
                    <Text style={styles.detailText}>
                        {formatDate(item.start_date)} - {formatDate(item.end_date)}
                    </Text>
                </View>
            </View>

            <View style={styles.durationBadge}>
                <Text style={styles.durationText}>
                    {item.itinerary?.duration_days || 1} days
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Plane size={64} color={Colors.gray} />
            <Text style={styles.emptyTitle}>No Trips Yet</Text>
            <Text style={styles.emptyText}>
                Your booked trips will appear here.{"\n"}
                Contact your travel agent to get started!
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back!</Text>
                    <Text style={styles.subtitle}>Your upcoming adventures</Text>
                </View>
                <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={handleSignOut}
                >
                    <LogOut size={20} color={Colors.gray} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={trips}
                keyExtractor={(item) => item.id}
                renderItem={renderTrip}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            />
        </View>
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        paddingTop: 10,
    },
    greeting: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.secondary,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.gray,
        marginTop: 4,
    },
    signOutButton: {
        padding: 10,
        backgroundColor: Colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
        flexGrow: 1,
    },
    tripCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    tripHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    tripTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 12,
    },
    tripDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: Colors.gray,
    },
    durationBadge: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: Colors.primary + "15",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    durationText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.secondary,
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.gray,
        textAlign: "center",
        lineHeight: 22,
    },
});
