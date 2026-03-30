// Demo Mode — trip type + empty array.
// Returned by useTrips() when isDemoMode is true; zero DB reads required.

interface DemoTrip {
  id: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
  itineraries: {
    trip_title: string;
    duration_days: number;
    destination?: string | null;
  } | null;
}

export const DEMO_TRIPS: DemoTrip[] = [];
