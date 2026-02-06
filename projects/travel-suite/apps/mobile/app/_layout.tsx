
import { Stack } from 'expo-router';
import { Colors } from '../src/constants/Colors';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Colors.white,
                    },
                    headerTintColor: Colors.secondary,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen name="index" options={{ title: 'Welcome', headerShown: false }} />
                <Stack.Screen name="driver/index" options={{ title: 'Driver Dashboard' }} />
                <Stack.Screen name="client/index" options={{ title: 'My Trip' }} />
            </Stack>
        </>
    );
}
