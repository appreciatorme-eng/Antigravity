// Demo Mode — 10 hardcoded TripBuilt trips matching the EnrichedTrip shape.
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

export const DEMO_TRIPS: DemoTrip[] = [
  {
    id: "dt-001",
    status: "in_progress",
    start_date: "2026-03-01",
    end_date: "2026-03-07",
    destination: "Port Blair, Havelock Island",
    created_at: "2026-02-01T09:00:00Z",
    profiles: { full_name: "Priya Mehta", email: "priya.mehta@gmail.com" },
    itineraries: {
      trip_title: "Andaman Island Break",
      duration_days: 6,
      destination: "Port Blair, Havelock Island",
    },
  },
  {
    id: "dt-002",
    status: "confirmed",
    start_date: "2026-04-10",
    end_date: "2026-04-20",
    destination: "Leh, Nubra Valley, Pangong",
    created_at: "2026-01-15T11:00:00Z",
    profiles: { full_name: "Vikram Joshi", email: "vikram.joshi@gmail.com" },
    itineraries: {
      trip_title: "Leh Ladakh Bike Expedition",
      duration_days: 10,
      destination: "Leh, Nubra Valley, Pangong",
    },
  },
  {
    id: "dt-003",
    status: "confirmed",
    start_date: "2026-03-15",
    end_date: "2026-03-22",
    destination: "Munnar, Alleppey, Kovalam",
    created_at: "2026-02-10T08:30:00Z",
    profiles: { full_name: "Sunita Patel", email: "sunita.patel@gmail.com" },
    itineraries: {
      trip_title: "Kerala Backwaters Escape",
      duration_days: 7,
      destination: "Munnar, Alleppey, Kovalam",
    },
  },
  {
    id: "dt-004",
    status: "in_progress",
    start_date: "2026-02-28",
    end_date: "2026-03-07",
    destination: "Varanasi, Sarnath, Prayagraj",
    created_at: "2026-01-20T10:00:00Z",
    profiles: { full_name: "Rohit Verma", email: "rohit.verma@gmail.com" },
    itineraries: {
      trip_title: "Varanasi Heritage Journey",
      duration_days: 7,
      destination: "Varanasi, Sarnath",
    },
  },
  {
    id: "dt-005",
    status: "completed",
    start_date: "2026-01-20",
    end_date: "2026-01-27",
    destination: "Jaipur, Jodhpur, Jaisalmer",
    created_at: "2025-12-20T09:00:00Z",
    profiles: { full_name: "Rajesh Sharma", email: "rajesh.sharma@infosys.com" },
    itineraries: {
      trip_title: "Rajasthan Royal Tour",
      duration_days: 7,
      destination: "Jaipur, Jodhpur, Jaisalmer",
    },
  },
  {
    id: "dt-006",
    status: "planned",
    start_date: "2026-05-10",
    end_date: "2026-05-17",
    destination: "Kaza, Dhankar, Chandratal",
    created_at: "2026-02-18T10:30:00Z",
    profiles: { full_name: "Arjun Singh", email: "arjun.singh@gmail.com" },
    itineraries: {
      trip_title: "Spiti Valley Explorer",
      duration_days: 7,
      destination: "Kaza, Dhankar, Chandratal",
    },
  },
  {
    id: "dt-007",
    status: "pending",
    start_date: "2026-04-01",
    end_date: "2026-04-11",
    destination: "Srinagar, Pahalgam, Gulmarg",
    created_at: "2026-02-25T14:00:00Z",
    profiles: { full_name: "Kavita Reddy", email: "kavita.reddy@gmail.com" },
    itineraries: {
      trip_title: "Kashmir Houseboat & Meadows",
      duration_days: 10,
      destination: "Srinagar, Pahalgam, Gulmarg",
    },
  },
  {
    id: "dt-008",
    status: "active",
    start_date: "2026-03-05",
    end_date: "2026-03-10",
    destination: "Delhi, Agra, Jaipur",
    created_at: "2026-02-01T09:00:00Z",
    profiles: { full_name: "Deepa Kapoor", email: "deepa.kapoor@hotmail.com" },
    itineraries: {
      trip_title: "Golden Triangle Classic",
      duration_days: 5,
      destination: "Delhi, Agra, Jaipur",
    },
  },
  {
    id: "dt-009",
    status: "confirmed",
    start_date: "2026-03-20",
    end_date: "2026-03-25",
    destination: "Panjim, Baga, South Goa",
    created_at: "2026-02-15T08:00:00Z",
    profiles: { full_name: "Sunita Patel", email: "sunita.patel@gmail.com" },
    itineraries: {
      trip_title: "Goa Beach Holiday",
      duration_days: 5,
      destination: "North Goa, South Goa",
    },
  },
  {
    id: "dt-010",
    status: "completed",
    start_date: "2026-01-05",
    end_date: "2026-01-11",
    destination: "Kochi, Thekkady, Alleppey",
    created_at: "2025-12-01T10:00:00Z",
    profiles: { full_name: "Arun Nair", email: "arun.nair@gmail.com" },
    itineraries: {
      trip_title: "Kerala Nature Circuit",
      duration_days: 6,
      destination: "Kochi, Thekkady, Alleppey",
    },
  },
];
