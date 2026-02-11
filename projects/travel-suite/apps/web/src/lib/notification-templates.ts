export type NotificationTemplateKey =
    | "pickup_reminder_client"
    | "pickup_reminder_driver"
    | "trip_delay_update"
    | "driver_reassigned";

export interface TemplateVars {
    pickup_time?: string;
    pickup_location?: string;
    day_number?: string | number;
    client_name?: string;
    destination?: string;
    trip_title?: string;
    delay_minutes?: string | number;
    new_driver_name?: string;
    live_link?: string;
}

function toStringValue(value: unknown, fallback = ""): string {
    if (value == null) return fallback;
    return String(value);
}

export function renderTemplate(template: NotificationTemplateKey, vars: TemplateVars) {
    const dayNumber = toStringValue(vars.day_number, "today");
    const pickupTime = toStringValue(vars.pickup_time, "soon");
    const pickupLocation = toStringValue(vars.pickup_location, "pickup point");
    const clientName = toStringValue(vars.client_name, "Client");
    const destination = toStringValue(vars.destination, "your destination");
    const tripTitle = toStringValue(vars.trip_title, destination);
    const liveLink = vars.live_link ? `\n\nTrack live location:\n${vars.live_link}` : "";

    switch (template) {
        case "pickup_reminder_client":
            return {
                title: "Pickup Reminder",
                body: `Your pickup is in 1 hour (${pickupTime}) at ${pickupLocation} for Day ${dayNumber}.${liveLink}`,
            };
        case "pickup_reminder_driver":
            return {
                title: "Upcoming Pickup",
                body: `Pickup in 1 hour (${pickupTime}) at ${pickupLocation}. Client: ${clientName}. Day ${dayNumber}.${liveLink}`,
            };
        case "trip_delay_update":
            return {
                title: "Trip Delay Update",
                body: `There is a delay of ${toStringValue(vars.delay_minutes, "15")} minutes for ${tripTitle} on Day ${dayNumber}.`,
            };
        case "driver_reassigned":
            return {
                title: "Driver Reassigned",
                body: `${toStringValue(vars.new_driver_name, "A new driver")} has been assigned for ${tripTitle} (Day ${dayNumber}) at ${pickupTime}.`,
            };
        default:
            return {
                title: "Trip Update",
                body: `You have an update for ${tripTitle}.`,
            };
    }
}
