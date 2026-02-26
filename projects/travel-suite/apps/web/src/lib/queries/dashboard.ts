import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getLastMonthKeys, monthKeyFromDate, monthLabel } from "@/lib/analytics/adapters";

export interface DashboardSeriesPoint {
  monthKey: string;
  label: string;
  revenue: number;
  bookings: number;
  proposals: number;
  conversions: number;
  conversionRate: number;
}

interface DashboardStats {
  totalDrivers: number;
  totalClients: number;
  activeTrips: number;
  pendingNotifications: number;
  marketplaceViews: number;
  marketplaceInquiries: number;
  conversionRate: string;
}

interface DashboardActivity {
  id: string;
  type: "trip" | "notification" | "inquiry";
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export interface DashboardStatsResponse {
  stats: DashboardStats;
  activities: DashboardActivity[];
  series: DashboardSeriesPoint[];
}

interface ProposalSeriesRow {
  created_at: string | null;
  status: string | null;
}

interface InvoiceSeriesRow {
  created_at: string | null;
  total_amount: number | null;
  status: string;
}

interface TripSeriesRow {
  created_at: string | null;
  status: string | null;
}

interface TripItineraryRelation {
  trip_title: string | null;
  destination: string | null;
}

interface RecentTripRow {
  id: string;
  status: string | null;
  created_at: string | null;
  itineraries: TripItineraryRelation | TripItineraryRelation[] | null;
}

interface RecentNotificationRow {
  id: string;
  title: string | null;
  body: string | null;
  sent_at: string | null;
  status: string | null;
}

interface MarketplaceInquiry {
  id?: string;
  created_at?: string;
  organizations?: {
    name?: string;
  };
}

interface MarketplaceStats {
  views?: number;
  inquiries?: number;
  conversion_rate?: string;
  recent_inquiries?: MarketplaceInquiry[];
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
};

const APPROVED_PROPOSAL_STATUSES = new Set(["approved", "accepted", "confirmed"]);
const ACTIVE_TRIP_STATUSES = new Set(["active", "in_progress", "planned", "confirmed"]);
const BOOKING_TRIP_STATUSES = new Set(["planned", "confirmed", "in_progress", "active", "completed"]);

function getItineraryRelation(input: RecentTripRow["itineraries"]): TripItineraryRelation | null {
  if (!input) return null;
  if (Array.isArray(input)) return input[0] ?? null;
  return input;
}

async function fetchMarketplaceStats(accessToken: string): Promise<MarketplaceStats | null> {
  try {
    const response = await fetch("/api/marketplace/stats", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as MarketplaceStats;
    return payload;
  } catch {
    return null;
  }
}

export function useDashboardStats() {
  return useQuery<DashboardStatsResponse>({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        throw new Error("Unable to resolve organization scope");
      }

      const organizationId = profile.organization_id;
      const yearAgoISO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

      const [driversRes, clientsRes, tripsRes, marketplaceStats, proposalsRes, invoicesRes, tripSeriesRes] =
        await Promise.all([
          supabase
            .from("external_drivers")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId),
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId),
          supabase
            .from("trips")
            .select("id, status", { count: "exact" })
            .eq("organization_id", organizationId),
          fetchMarketplaceStats(session.access_token),
          supabase
            .from("proposals")
            .select("created_at, status")
            .eq("organization_id", organizationId)
            .gte("created_at", yearAgoISO),
          supabase
            .from("invoices")
            .select("created_at, total_amount, status")
            .eq("organization_id", organizationId)
            .gte("created_at", yearAgoISO),
          supabase
            .from("trips")
            .select("created_at, status")
            .eq("organization_id", organizationId)
            .gte("created_at", yearAgoISO),
        ]);

      const [recentTrips, recentNotifies, pendingNotificationsRes] = await Promise.all([
        supabase
          .from("trips")
          .select("id, status, created_at, itineraries(trip_title, destination)")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("notification_logs")
          .select("id, title, body, sent_at, status, trips!inner(organization_id)")
          .eq("trips.organization_id", organizationId)
          .order("sent_at", { ascending: false })
          .limit(5),
        supabase
          .from("notification_queue")
          .select("id, trips!inner(organization_id)", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("trips.organization_id", organizationId),
      ]);

      if (driversRes.error) throw driversRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (tripsRes.error) throw tripsRes.error;
      if (proposalsRes.error) throw proposalsRes.error;
      if (invoicesRes.error) throw invoicesRes.error;
      if (tripSeriesRes.error) throw tripSeriesRes.error;
      if (recentTrips.error) throw recentTrips.error;
      if (recentNotifies.error) throw recentNotifies.error;

      const tripRows = (tripsRes.data || []) as Array<{ id: string; status: string | null }>;
      const activeTrips = tripRows.filter((trip) => ACTIVE_TRIP_STATUSES.has((trip.status || "").toLowerCase())).length;

      const monthKeys = getLastMonthKeys(12);
      const monthMap = new Map<string, DashboardSeriesPoint>(
        monthKeys.map((monthKey) => [
          monthKey,
          {
            monthKey,
            label: monthLabel(monthKey),
            revenue: 0,
            bookings: 0,
            proposals: 0,
            conversions: 0,
            conversionRate: 0,
          },
        ])
      );

      for (const invoice of (invoicesRes.data || []) as InvoiceSeriesRow[]) {
        if ((invoice.status || "").toLowerCase() !== "paid") continue;
        const monthKey = monthKeyFromDate(invoice.created_at);
        if (!monthKey) continue;
        const monthPoint = monthMap.get(monthKey);
        if (!monthPoint) continue;
        monthPoint.revenue += Number(invoice.total_amount || 0);
      }

      for (const trip of (tripSeriesRes.data || []) as TripSeriesRow[]) {
        if (!BOOKING_TRIP_STATUSES.has((trip.status || "").toLowerCase())) continue;
        const monthKey = monthKeyFromDate(trip.created_at);
        if (!monthKey) continue;
        const monthPoint = monthMap.get(monthKey);
        if (!monthPoint) continue;
        monthPoint.bookings += 1;
      }

      for (const proposal of (proposalsRes.data || []) as ProposalSeriesRow[]) {
        const monthKey = monthKeyFromDate(proposal.created_at);
        if (!monthKey) continue;
        const monthPoint = monthMap.get(monthKey);
        if (!monthPoint) continue;
        monthPoint.proposals += 1;
        if (APPROVED_PROPOSAL_STATUSES.has((proposal.status || "").toLowerCase())) {
          monthPoint.conversions += 1;
        }
      }

      const series = monthKeys
        .map((monthKey) => monthMap.get(monthKey))
        .filter((row): row is DashboardSeriesPoint => Boolean(row))
        .map((row) => ({
          ...row,
          conversionRate: row.proposals > 0 ? Number(((row.conversions / row.proposals) * 100).toFixed(1)) : 0,
        }));

      const recentTripActivities: DashboardActivity[] = ((recentTrips.data || []) as RecentTripRow[]).map((trip) => {
        const itinerary = getItineraryRelation(trip.itineraries);
        return {
          id: trip.id,
          type: "trip",
          title: itinerary?.trip_title || "New Trip",
          description: `Trip to ${itinerary?.destination || "Unknown Location"}`,
          timestamp: trip.created_at || new Date().toISOString(),
          status: trip.status || "draft",
        };
      });

      const recentNotificationActivities: DashboardActivity[] = (
        (recentNotifies.data || []) as RecentNotificationRow[]
      ).map((notification) => ({
        id: notification.id,
        type: "notification",
        title: notification.title || "System Alert",
        description: notification.body || "Notification dispatched to client",
        timestamp: notification.sent_at || new Date().toISOString(),
        status: notification.status || "sent",
      }));

      const marketplaceActivities: DashboardActivity[] = (marketplaceStats?.recent_inquiries || []).map((inquiry) => ({
        id: inquiry.id || `inq-${inquiry.created_at || Date.now()}`,
        type: "inquiry",
        title: "Partner Inquiry",
        description: `From ${inquiry.organizations?.name || "Unknown Partner"}`,
        timestamp: inquiry.created_at || new Date().toISOString(),
        status: "new",
      }));

      const activities = [...recentTripActivities, ...recentNotificationActivities, ...marketplaceActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

      return {
        stats: {
          totalDrivers: Number(driversRes.count || 0),
          totalClients: Number(clientsRes.count || 0),
          activeTrips,
          pendingNotifications: Number(pendingNotificationsRes.count || 0),
          marketplaceViews: Number(marketplaceStats?.views || 0),
          marketplaceInquiries: Number(marketplaceStats?.inquiries || 0),
          conversionRate: marketplaceStats?.conversion_rate || "0.0",
        },
        activities,
        series,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
