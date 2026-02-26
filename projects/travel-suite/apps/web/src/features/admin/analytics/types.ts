import type { RevenueChartPoint } from "@/components/analytics/RevenueChart";
import type { DashboardRange, DriverCallout } from "@/lib/analytics/adapters";

export interface ProposalRow {
  status: string | null;
  total_price: number | null;
  created_at: string | null;
  viewed_at: string | null;
  created_by?: string | null;
  client_id?: string | null;
}

export interface InvoiceRow {
  status: string | null;
  total_amount: number | null;
  created_at: string | null;
  client_id?: string | null;
}

export interface TripRow {
  status: string | null;
  created_at: string | null;
  owner_id?: string | null;
  client_id?: string | null;
  itineraries: { destination: string | null } | { destination: string | null }[] | null;
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
}

export interface AnalyticsSnapshot {
  monthlyRevenueTotal: number;
  proposalsTotal: number;
  proposalConversionRate: number;
  activeTrips: number;
  activeClients: number;
  viewedProposalRate: number;
  series: RevenueChartPoint[];
  destinationRank: DestinationRank[];
  proposalStatusBreakdown: Array<{ status: string; count: number }>;
  drivers: DriverCallout[];
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
  series: [],
  destinationRank: [],
  proposalStatusBreakdown: [],
  drivers: [],
};
