export interface Driver {
    id: string;
    full_name: string;
    phone: string | null;
    vehicle_type: string | null;
    vehicle_plate: string | null;
    photo_url?: string | null;
}

export interface DriverAssignment {
    id?: string;
    day_number: number;
    external_driver_id: string | null;
    pickup_time: string;
    pickup_location: string;
    notes: string;
}

export interface Accommodation {
    id?: string;
    day_number: number;
    hotel_name: string;
    address: string;
    check_in_time: string;
    contact_phone: string;
}

export interface Activity {
    title: string;
    start_time?: string;
    end_time?: string;
    duration_minutes: number;
    location?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    description?: string;
}

export interface Day {
    day_number: number;
    theme: string;
    activities: Activity[];
}

export interface HotelSuggestion {
    name: string;
    address: string;
    phone?: string;
    lat: number;
    lng: number;
    distanceKm: number;
}

export interface Trip {
    id: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    destination: string;
    profiles: {
        id: string;
        full_name: string;
        email: string;
        phone?: string | null;
    } | null;
    itineraries: {
        id: string;
        trip_title: string;
        duration_days: number;
        destination?: string | null;
        raw_data: {
            days: Day[];
        };
    } | null;
}

export interface ReminderDayStatus {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    lastScheduledFor: string | null;
}

export interface DriverLocationSnapshot {
    latitude: number;
    longitude: number;
    recorded_at: string;
    speed?: number | null;
    heading?: number | null;
    accuracy?: number | null;
}

export interface TripDetailApiPayload {
    trip: Trip;
    drivers?: Driver[];
    assignments?: Record<number, DriverAssignment>;
    accommodations?: Record<number, Accommodation>;
    reminderStatusByDay?: Record<number, ReminderDayStatus>;
    busyDriversByDay?: Record<number, string[]>;
    latestDriverLocation?: DriverLocationSnapshot | null;
}

export type ErrorPayload = {
    error?: string;
};

export interface OverpassElement {
    tags?: Record<string, string | undefined>;
    lat?: number | string;
    lon?: number | string;
    center?: {
        lat?: number | string;
        lon?: number | string;
    };
}

export interface OverpassResponse {
    elements?: OverpassElement[];
}
