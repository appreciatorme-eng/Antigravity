import type { ComponentType } from "react";

// ---------------------------------------------------------------------------
// Trip detail data model — extracted from /trips/[id]/page.tsx and extended
// ---------------------------------------------------------------------------

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
  coordinates?: { lat: number; lng: number };
  description?: string;
}

export interface Day {
  day_number: number;
  theme: string;
  activities: Activity[];
}

export interface TripProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  phone_whatsapp?: string | null;
  dietary_requirements?: string[] | null;
  preferred_destination?: string | null;
  travel_style?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  mobility_needs?: string | null;
}

export interface TripItinerary {
  id: string;
  trip_title: string;
  duration_days: number;
  destination?: string | null;
  raw_data: {
    days: Day[];
    flights?: FlightDetails[];
    budget?: string;
    interests?: string[];
    tips?: string[];
    inclusions?: string[];
    exclusions?: string[];
    pricing?: {
      per_person_cost?: number;
      total_cost?: number;
      currency?: string;
      pax_count?: number;
      notes?: string;
    };
  };
}

export interface Trip {
  id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  destination: string;
  organization_id?: string;
  client_id?: string | null;
  profiles: TripProfile | null;
  itineraries: TripItinerary | null;
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

export interface TripDetailPayload {
  trip: Trip;
  drivers?: Driver[];
  assignments?: Record<number, DriverAssignment>;
  accommodations?: Record<number, Accommodation>;
  reminderStatusByDay?: Record<number, ReminderDayStatus>;
  busyDriversByDay?: Record<number, string[]>;
  latestDriverLocation?: DriverLocationSnapshot | null;
  invoiceSummary?: TripInvoiceSummaryData | null;
}

// ---------------------------------------------------------------------------
// Financial types
// ---------------------------------------------------------------------------

export interface TripInvoiceSummaryData {
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  invoice_count: number;
}

export interface TripInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  due_date: string | null;
  issued_at: string | null;
  created_at: string | null;
  payments: TripPayment[];
  line_items: InvoiceLineItem[];
}

export interface TripPayment {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  payment_date: string;
  status: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate?: number;
}

// ---------------------------------------------------------------------------
// Communication types
// ---------------------------------------------------------------------------

export interface TripNotificationEntry {
  id: string;
  source: "log" | "queue";
  notification_type: string;
  title: string | null;
  body: string | null;
  status: string | null;
  channel?: string | null;
  scheduled_for?: string | null;
  sent_at?: string | null;
  created_at: string | null;
}

// ---------------------------------------------------------------------------
// Add-on types
// ---------------------------------------------------------------------------

export interface TripAddOn {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  quantity: number;
  is_selected: boolean;
  description: string | null;
  image_url: string | null;
}

// ---------------------------------------------------------------------------
// Flight types (stored in itinerary raw_data.flights)
// ---------------------------------------------------------------------------

export interface FlightDetails {
  airline: string;
  flight_number: string;
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  pnr?: string | null;
  booking_reference?: string | null;
  passengers?: number;
}

// ---------------------------------------------------------------------------
// Tab & UI types
// ---------------------------------------------------------------------------

export type TripDetailTab = "overview" | "itinerary" | "financials" | "comms" | "group";

export interface StatusItemData {
  label: string;
  status: string;
  color: string;
  icon: ComponentType<{ className?: string }>;
}
