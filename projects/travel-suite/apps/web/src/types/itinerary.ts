export interface Coordinate {
    lat: number;
    lng: number;
}

export interface Activity {
    time: string;
    title: string;
    name?: string; // Activity name (alternative to title, used in some templates)
    description: string;
    location: string;
    type?: string; // Activity type (e.g., 'transport', 'meal', 'activity')
    tags?: string[]; // Activity tags for categorization
    coordinates?: Coordinate;
    duration?: string;
    cost?: string;
    transport?: string;
    image?: string; // Activity image URL
    imageUrl?: string; // Alternative image URL property (used in SafariStoryView)
}

export interface Day {
    day_number: number;
    day?: number; // Alternative day number field
    theme: string;
    title?: string; // Optional title for the day
    date?: string; // Optional date for the day (e.g., "2024-03-15")
    summary?: string; // Optional summary/description of the day
    activities: Activity[];
}

export interface FlightDetails {
    id: string;
    airline: string;
    flight_number: string;
    departure_airport: string;
    arrival_airport: string;
    departure_time: string;
    arrival_time: string;
    confirmation?: string;
}

export interface HotelDetails {
    id: string;
    name: string;
    address: string;
    check_in: string;
    check_out: string;
    confirmation?: string;
}

export interface Logistics {
    flights?: FlightDetails[];
    hotels?: HotelDetails[];
}

export interface ItineraryResult {
    trip_title: string;
    title?: string; // Alias for trip_title used in templates
    description?: string;
    destination: string;
    duration_days: number;
    summary: string;
    days: Day[];
    budget?: string;
    interests?: string[];
    tips?: string[];
    logistics?: Logistics;
    branding?: {
        logoUrl?: string;
        primaryColor?: string;
        organizationName?: string;
    };
}
