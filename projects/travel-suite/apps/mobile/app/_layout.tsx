import { useEffect, useState } from "react";
import { Stack, router, useSegments } from "expo-router";
import { Colors } from "../src/constants/Colors";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../src/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { View, ActivityIndicator } from "react-native";
import { NotificationHandler } from "../src/components/NotificationHandler";

export default function RootLayout() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const segments = useSegments();

    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === "auth";

        if (!session && !inAuthGroup) {
            // Redirect to login if not authenticated
            // But allow access to index (role selection) for now
            if (segments[0] !== "(tabs)" && segments.length > 0 && segments[0] !== "index") {
                // router.replace("/auth/login");
            }
        } else if (session && inAuthGroup) {
            // Redirect to main app if authenticated
            router.replace("/client");
        }
    }, [session, segments, loading]);

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: Colors.background,
                }}
            >
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="dark" />
            <NotificationHandler userId={session?.user?.id ?? null} />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Colors.white,
                    },
                    headerTintColor: Colors.secondary,
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{ title: "Welcome", headerShown: false }}
                />
                <Stack.Screen
                    name="auth/login"
                    options={{ title: "Sign In", headerShown: false }}
                />
                <Stack.Screen
                    name="client/index"
                    options={{ title: "My Trips" }}
                />
                <Stack.Screen
                    name="client/trip/[id]"
                    options={{ title: "Trip Details" }}
                />
                <Stack.Screen
                    name="driver/index"
                    options={{ title: "Driver Dashboard" }}
                />
            </Stack>
        </>
    );
}
