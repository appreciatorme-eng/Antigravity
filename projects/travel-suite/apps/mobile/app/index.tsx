
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { Colors } from '../src/constants/Colors';
import { Car, Map, ShieldCheck } from 'lucide-react-native';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logoText}>GoBuddy</Text>
                <Text style={styles.subLogoText}>TravelSuite</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Select Your Role</Text>
                <Text style={styles.subtitle}>Are you driving or exploring?</Text>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/driver')}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#e6fffa' }]}>
                        <Car size={32} color={Colors.primary} />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Driver</Text>
                        <Text style={styles.cardDescription}>Manage shifts & share location</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/client')}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#ebf8ff' }]}>
                        <Map size={32} color={Colors.secondary} />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Client</Text>
                        <Text style={styles.cardDescription}>View details & track driver</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.adminLink}>
                    <ShieldCheck size={16} color={Colors.gray} />
                    <Text style={styles.adminText}>Admin access? Use Web Dashboard</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: Colors.secondary,
        fontFamily: 'System', // Use default font for now
    },
    subLogoText: {
        fontSize: 24,
        color: Colors.primary,
        fontWeight: '600',
        marginTop: -5,
    },
    content: {
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.secondary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.gray,
        marginBottom: 24,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 16,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: Colors.gray,
    },
    adminLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        gap: 8,
    },
    adminText: {
        color: Colors.gray,
        fontSize: 12,
    },
});
