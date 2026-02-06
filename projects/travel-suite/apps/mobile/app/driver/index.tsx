
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import { useState } from 'react';
import { Play, Square, MapPin } from 'lucide-react-native';

export default function DriverDashboard() {
    const [isShiftActive, setIsShiftActive] = useState(false);
    const [locationStatus, setLocationStatus] = useState('Checking...');

    const toggleShift = () => {
        if (isShiftActive) {
            Alert.alert("End Shift?", "Are you sure you want to stop sharing location?", [
                { text: "Cancel", style: "cancel" },
                { text: "End Shift", style: "destructive", onPress: () => setIsShiftActive(false) }
            ]);
        } else {
            setIsShiftActive(true);
            setLocationStatus('Active Tracking');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>Current Status</Text>
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: isShiftActive ? Colors.primary : Colors.gray }]} />
                    <Text style={[styles.statusValue, { color: isShiftActive ? Colors.primary : Colors.gray }]}>
                        {isShiftActive ? 'ON SHIFT' : 'OFF DUTY'}
                    </Text>
                </View>
                <Text style={styles.locationText}>
                    <MapPin size={14} color={Colors.gray} /> {isShiftActive ? "Sharing Location..." : "Location Hidden"}
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: isShiftActive ? Colors.error : Colors.primary }]}
                onPress={toggleShift}
            >
                {isShiftActive ? <Square size={24} color="white" fill="white" /> : <Play size={24} color="white" fill="white" />}
                <Text style={styles.buttonText}>{isShiftActive ? 'End Shift' : 'Start Shift'}</Text>
            </TouchableOpacity>

            <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Shift Details</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Vehicle</Text>
                    <Text style={styles.infoValue}>Mercedes V-Class (Mock)</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Next Pickup</Text>
                    <Text style={styles.infoValue}>10:00 AM @ Hotel Peninsula</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.lightGray,
        padding: 20,
        alignItems: 'center',
    },
    statusCard: {
        backgroundColor: Colors.white,
        width: '100%',
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 40,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        marginTop: 20,
    },
    statusLabel: {
        fontSize: 14,
        color: Colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statusValue: {
        fontSize: 28,
        fontWeight: '800',
    },
    locationText: {
        color: Colors.gray,
        fontSize: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 40,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 12,
    },
    infoSection: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.secondary,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
        paddingBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoLabel: {
        color: Colors.gray,
    },
    infoValue: {
        fontWeight: '600',
        color: Colors.text,
    },
});
