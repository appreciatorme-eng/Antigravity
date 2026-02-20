export interface Coordinate {
    lat: number;
    lng: number;
}

export interface Activity {
    time: string;
    title: string;
    description: string;
    location: string;
    type?: string; // Activity type (e.g., 'transport', 'meal', 'activity')
    coordinates?: Coordinate;
    duration?: string;
    cost?: string;
    transport?: string;
    image?: string;
}

export interface Day {
    day_number: number;
    theme: string;
    activities: Activity[];
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
    branding?: {
        logoUrl?: string;
        primaryColor?: string;
        organizationName?: string;
    };
}
