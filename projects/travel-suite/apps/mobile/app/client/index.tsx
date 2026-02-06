
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { Calendar, Clock, MapPin, Phone } from 'lucide-react-native';

export default function ClientTripView() {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerImageContainer}>
                {/* Placeholder for generic header if image fails */}
                <View style={[styles.headerImage, { backgroundColor: Colors.secondary }]} />
                <View style={styles.headerOverlay}>
                    <Text style={styles.tripTitle}>Tokyo Odyssey</Text>
                    <Text style={styles.tripDate}>Oct 12 - Oct 15</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Itinerary</Text>
                    <Text style={styles.sectionDate}>Day 1</Text>
                </View>

                <View style={styles.timeline}>
                    {/* Activity 1 */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <Text style={styles.time}>09:00</Text>
                        </View>
                        <View style={styles.timelineCenter}>
                            <View style={styles.dot} />
                            <View style={styles.line} />
                        </View>
                        <View style={styles.timelineRight}>
                            <Text style={styles.activityTitle}>Hotel Pickup</Text>
                            <Text style={styles.activityDesc}>Private transfer to Tsukiji Market.</Text>
                            <View style={styles.driverCard}>
                                <View style={styles.driverAvatar}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>JD</Text>
                                </View>
                                <View>
                                    <Text style={styles.driverName}>John Driver</Text>
                                    <Text style={styles.driverStatus}>Arriving in 5 mins...</Text>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Phone size={20} color={Colors.primary} />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Activity 2 */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <Text style={styles.time}>10:00</Text>
                        </View>
                        <View style={styles.timelineCenter}>
                            <View style={styles.dot} />
                            <View style={styles.line} />
                        </View>
                        <View style={styles.timelineRight}>
                            <Text style={styles.activityTitle}>Tsukiji Outer Market</Text>
                            <Text style={styles.activityDesc}>Guided food tour and sushi breakfast.</Text>
                            <View style={styles.locationTag}>
                                <MapPin size={12} color={Colors.gray} />
                                <Text style={styles.locationText}>Chuo City, Tokyo</Text>
                            </View>
                        </View>
                    </View>

                    {/* Activity 3 */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <Text style={styles.time}>13:00</Text>
                        </View>
                        <View style={styles.timelineCenter}>
                            <View style={styles.dot} />
                        </View>
                        <View style={styles.timelineRight}>
                            <Text style={styles.activityTitle}>TeamLab Planets</Text>
                            <Text style={styles.activityDesc}>Digital art museum experience.</Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerImageContainer: {
        height: 200,
        backgroundColor: Colors.secondary,
        justifyContent: 'flex-end',
        marginBottom: 20,
    },
    headerImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.5,
    },
    headerOverlay: {
        padding: 20,
    },
    tripTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'serif', // Platform dependent, but adds nice touch
    },
    tripDate: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 4,
    },
    content: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.secondary,
    },
    sectionDate: {
        fontSize: 14,
        color: Colors.gray,
        fontWeight: '600',
    },
    timeline: {
        paddingLeft: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    timelineLeft: {
        width: 50,
        paddingTop: 2,
    },
    time: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.secondary,
    },
    timelineCenter: {
        width: 20,
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
        zIndex: 1,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 4,
    },
    timelineRight: {
        flex: 1,
        paddingLeft: 16,
        paddingBottom: 32,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    activityDesc: {
        color: Colors.gray,
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    driverAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    driverName: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    driverStatus: {
        fontSize: 10,
        color: Colors.primary,
        fontWeight: '600',
    },
    locationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 12,
        color: Colors.gray,
    },
});
