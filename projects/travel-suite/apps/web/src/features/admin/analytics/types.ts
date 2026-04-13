import type { RevenueChartPoint } from "@/components/analytics/RevenueChart";
import type { DashboardRange, DriverCallout } from "@/lib/analytics/adapters";

export interface ProposalRow {
  id: string;
  trip_id?: string | null;
  status: string | null;
  total_price: number | null;
  created_at: string | null;
  updated_at?: string | null;
  viewed_at: string | null;
  expires_at: string | null;
  created_by?: string | null;
  client_id?: string | null;
  client_selected_price?: number | null;
  title?: string | null;
  trips?:
    | {
        id?: string | null;
        status?: string | null;
      }
    | {
        id?: string | null;
        status?: string | null;
      }[]
    | null;
}

export interface InvoiceRow {
  status: string | null;
  total_amount: number | null;
  created_at: string | null;
  client_id?: string | null;
  trip_id?: string | null;
}

export interface CommercialPaymentRow {
  amount: number | null;
  payment_date: string | null;
  created_at: string | null;
  trip_id?: string | null;
  proposal_id?: string | null;
  invoice_id?: string | null;
  status?: string | null;
  source?: string | null;
}

export interface TripRow {
  id?: string;
  status: string | null;
  created_at: string | null;
  updated_at?: string | null;
  owner_id?: string | null;
  client_id?: string | null;
  itineraries:
    | {
        destination: string | null;
        updated_at?: string | null;
        raw_data?: {
          financial_summary?: {
            payment_status?: string | null;
            payment_source?: string | null;
            manual_paid_amount?: number | null;
            payment_date?: string | null;
          } | null;
        } | null;
      }
    | {
        destination: string | null;
        updated_at?: string | null;
        raw_data?: {
          financial_summary?: {
            payment_status?: string | null;
            payment_source?: string | null;
            manual_paid_amount?: number | null;
            payment_date?: string | null;
          } | null;
        } | null;
      }[]
    | null;
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  role?: string | null;
  source_channel?: string | null;
  preferred_destination?: string | null;
}

export interface DestinationRank {
  name: string;
  trips: number;
  revenue: number;
}

export interface SeasonSnapshot {
  months: string;
  revenue: number;
  bookings: number;
  avgTrip: number;
}

export interface TopClientEntry {
  clientId: string;
  name: string;
  revenue: number;
  trips: number;
  invoiceCount: number;
}

export interface AnalyticsSnapshot {
  monthlyRevenueTotal: number;
  proposalsTotal: number;
  proposalConversionRate: number;
  activeTrips: number;
  activeClients: number;
  viewedProposalRate: number;
  avgBookingValue: number;
  collectionRate: number;
  totalPax: number;
  revenuePerPax: number;
  series: RevenueChartPoint[];
  destinationRank: DestinationRank[];
  seasonalBreakdown: {
    peak: SeasonSnapshot;
    offSeason: SeasonSnapshot;
  };
  proposalStatusBreakdown: Array<{ status: string; label: string; count: number }>;
  drivers: DriverCallout[];
  topClients: TopClientEntry[];
}

export interface AnalyticsFilterState {
  destination: string;
  salesOwner: string;
  sourceChannel: string;
  range: DashboardRange;
}

export interface AnalyticsFilterOptions {
  destinations: string[];
  salesOwners: Array<{ id: string; label: string }>;
  sourceChannels: string[];
}

export const EMPTY_ANALYTICS_SNAPSHOT: AnalyticsSnapshot = {
  monthlyRevenueTotal: 0,
  proposalsTotal: 0,
  proposalConversionRate: 0,
  activeTrips: 0,
  activeClients: 0,
  viewedProposalRate: 0,
  avgBookingValue: 0,
  collectionRate: 0,
  totalPax: 0,
  revenuePerPax: 0,
  series: [],
  destinationRank: [],
  seasonalBreakdown: {
    peak: { months: "Oct — Feb", revenue: 0, bookings: 0, avgTrip: 0 },
    offSeason: { months: "Mar — Sep", revenue: 0, bookings: 0, avgTrip: 0 },
  },
  proposalStatusBreakdown: [],
  drivers: [],
  topClients: [],
};
