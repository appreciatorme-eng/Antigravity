import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationData {
    type: "trip_confirmed" | "driver_assigned" | "daily_briefing" | "client_landed" | "itinerary_update";
    tripId?: string;
    dayNumber?: number;
    driverId?: string;
}

/**
 * Register device for push notifications and save token to Supabase
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
    // Only works on physical devices
    if (!Device.isDevice) {
        console.log("Push notifications require a physical device");
        return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("Push notification permission denied");
        return null;
    }

    // Get Expo push token
    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });
        const token = tokenData.data;

        // Save token to Supabase
        const { error } = await supabase.from("push_tokens").upsert(
            {
                user_id: userId,
                expo_push_token: token,
                device_type: Platform.OS,
            },
            {
                onConflict: "user_id,expo_push_token",
            }
        );

        if (error) {
            console.error("Error saving push token:", error);
        } else {
            console.log("Push token registered:", token);
        }

        return token;
    } catch (error) {
        console.error("Error getting push token:", error);
        return null;
    }
}

/**
 * Remove push token when user logs out
 */
export async function unregisterPushNotifications(userId: string): Promise<void> {
    try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        await supabase
            .from("push_tokens")
            .delete()
            .eq("user_id", userId)
            .eq("expo_push_token", token);

        console.log("Push token unregistered");
    } catch (error) {
        console.error("Error unregistering push token:", error);
    }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
    // Listener for notifications received while app is foregrounded
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
        onNotificationReceived?.(notification);
    });

    // Listener for when user taps on notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification tapped:", response);
        onNotificationResponse?.(response);
    });

    // Return cleanup function
    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
}

/**
 * Get the last notification response (for deep linking on app open)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    seconds: number = 1
): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: data as any,
            sound: "default",
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
        },
    });
    return id;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
}

/**
 * Notify server that client has landed (triggers driver notification)
 */
export async function notifyClientLanded(tripId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return { success: false, error: "Not authenticated" };
        }

        // Call the notification API
        const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/notifications/client-landed`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ tripId }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return { success: false, error };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
