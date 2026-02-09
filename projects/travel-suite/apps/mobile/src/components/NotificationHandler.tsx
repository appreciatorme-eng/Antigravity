import { useEffect, useRef } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import {
    registerForPushNotifications,
    setupNotificationListeners,
    getLastNotificationResponse,
    NotificationData,
} from "../lib/notifications";

interface NotificationHandlerProps {
    userId: string | null;
}

export function NotificationHandler({ userId }: NotificationHandlerProps) {
    const notificationListener = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Register for push notifications
        registerForPushNotifications(userId);

        // Check if app was opened from a notification
        getLastNotificationResponse().then((response) => {
            if (response) {
                handleNotificationNavigation(response.notification.request.content.data as NotificationData);
            }
        });

        // Set up listeners
        notificationListener.current = setupNotificationListeners(
            // When notification is received in foreground
            (notification) => {
                console.log("Foreground notification:", notification.request.content);
            },
            // When user taps on notification
            (response) => {
                const data = response.notification.request.content.data as NotificationData;
                handleNotificationNavigation(data);
            }
        );

        return () => {
            if (notificationListener.current) {
                notificationListener.current();
            }
        };
    }, [userId]);

    return null;
}

function handleNotificationNavigation(data: NotificationData) {
    if (!data) return;

    switch (data.type) {
        case "trip_confirmed":
        case "driver_assigned":
        case "daily_briefing":
        case "itinerary_update":
            if (data.tripId) {
                router.push(`/client/trip/${data.tripId}`);
            }
            break;
        case "client_landed":
            // Confirmation notification, just open the trip
            if (data.tripId) {
                router.push(`/client/trip/${data.tripId}`);
            }
            break;
        default:
            // Default to trips list
            router.push("/client");
    }
}
