// Demo Mode — client type + empty array.
// Returned by useClients() when isDemoMode is true; zero DB reads required.

interface Client {
  id: string;
  role?: "client" | "driver" | "admin" | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string | null;
  preferred_destination?: string | null;
  travelers_count?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  travel_style?: string | null;
  interests?: string[] | null;
  home_airport?: string | null;
  notes?: string | null;
  lead_status?: string | null;
  client_tag?: string | null;
  phase_notifications_enabled?: boolean | null;
  lifecycle_stage?: string | null;
  marketing_opt_in?: boolean | null;
  referral_source?: string | null;
  source_channel?: string | null;
  trips_count?: number;
  language_preference?: string | null;
}

export const DEMO_CLIENTS: Client[] = [];
