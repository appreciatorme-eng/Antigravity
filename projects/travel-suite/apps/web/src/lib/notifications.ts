import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface ExpoPushMessage {
    to: string;
    sound?: "default" | null;
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
}

export interface NotificationPayload {
    userId: string;
    title: string;
    body: string;
    data?: {
        type: string;
        tripId?: string;
        dayNumber?: number;
        [key: string]: any;
    };
}

/**
 * Send push notifications via Expo Push Service
 */
export async function sendPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
    if (messages.length === 0) return;

    // Expo Push API endpoint
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Expo Push API error:", error);
        throw new Error(`Failed to send push notifications: ${error}`);
    }

    const result = await response.json();
    console.log("Push notifications sent:", result);
}

/**
 * Send notification to a specific user via Supabase Edge Function (FCM)
 */
export async function sendNotificationToUser(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
    try {
        // We now use the Supabase Edge Function which handles FCM V1
        // This is more robust and avoids Expo dependency in the backend
        const { data, error } = await supabaseAdmin.functions.invoke("send-notification", {
            body: {
                user_id: payload.userId,
                title: payload.title,
                body: payload.body,
                data: {
                    ...payload.data,
                    // FCM data values must be strings
                    tripId: payload.data?.tripId || "",
                    type: payload.data?.type || "general",
                },
            },
        });

        if (error) {
            console.error("Error invoking send-notification function:", error);
            return { success: false, error: error.message };
        }

        // Log notification
        await supabaseAdmin.from("notification_logs").insert({
            trip_id: payload.data?.tripId,
            recipient_id: payload.userId,
            notification_type: payload.data?.type || "general",
            title: payload.title,
            body: payload.body,
            status: "sent",
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error sending notification:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Send notification to all users of a trip
 */
export async function sendNotificationToTripUsers(
    tripId: string,
    title: string,
    body: string,
    notificationType: string
): Promise<{ success: boolean; sentCount: number; error?: string }> {
    try {
        // Get trip and its user
        const { data: trip, error: tripError } = await supabaseAdmin
            .from("trips")
            .select("client_id")
            .eq("id", tripId)
            .single();

        if (tripError || !trip) {
            return { success: false, sentCount: 0, error: "Trip not found" };
        }

        // Send to trip owner
        const result = await sendNotificationToUser({
            userId: trip.client_id,
            title,
            body,
            data: {
                type: notificationType,
                tripId,
            },
        });

        return { success: result.success, sentCount: result.success ? 1 : 0, error: result.error };
    } catch (error: any) {
        return { success: false, sentCount: 0, error: error.message };
    }
}

/**
 * Format WhatsApp message link for drivers
 */
export function getDriverWhatsAppLink(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, "");
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * Format driver assignment message for WhatsApp
 */
export function formatDriverAssignmentMessage(data: {
    clientName: string;
    clientPhone?: string;
    pickupTime: string;
    pickupLocation: string;
    activities: Array<{ title: string; duration_minutes: number }>;
    hotelName: string;
}): string {
    const activitiesList = data.activities
        .map((a, i) => `${i + 1}. ${a.title} (${a.duration_minutes} mins)`)
        .join("\n");

    return `📋 *New Trip Assignment*

👤 Client: ${data.clientName}
${data.clientPhone ? `📱 Phone: ${data.clientPhone}` : ""}
🕐 Pickup: ${data.pickupTime}
📍 Location: ${data.pickupLocation}

*Today's Route:*
${activitiesList}

🏨 Drop-off: ${data.hotelName}

Please confirm receipt of this assignment.`;
}

/**
 * Format daily briefing message
 */
export function formatDailyBriefingMessage(data: {
    dayNumber: number;
    driverName: string;
    driverPhone: string;
    vehicleType?: string;
    vehiclePlate?: string;
    pickupTime: string;
    pickupLocation: string;
    activities: Array<{ title: string; start_time: string; duration_minutes: number }>;
    hotelName: string;
}): string {
    const activitiesList = data.activities
        .map((a) => `• ${a.start_time} - ${a.title} (${a.duration_minutes} mins)`)
        .join("\n");

    return `🌅 *Day ${data.dayNumber} Briefing*

🚗 *Your Driver Today:*
${data.driverName}
📱 ${data.driverPhone}
${data.vehicleType ? `🚙 ${data.vehicleType}` : ""}
${data.vehiclePlate ? `🔢 ${data.vehiclePlate}` : ""}

⏰ Pickup: ${data.pickupTime} at ${data.pickupLocation}

*Today's Schedule:*
${activitiesList}

🏨 Tonight: ${data.hotelName}

Have a great day!`;
}
