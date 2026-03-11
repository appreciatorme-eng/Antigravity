import { useQuery } from "@tanstack/react-query";
import { useDemoMode } from "@/lib/demo/demo-mode-context";

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
  operatorName: string;
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (isDemoMode?: boolean) => [...dashboardKeys.all, "stats", isDemoMode ? "demo" : "live"] as const,
};

const DEMO_SERIES: DashboardSeriesPoint[] = [
  { monthKey: "2025-12", label: "Dec '25", revenue:  320000, bookings: 3,  proposals: 4,  conversions: 3,  conversionRate: 75.0 },
  { monthKey: "2026-01", label: "Jan '26", revenue:  450000, bookings: 5,  proposals: 7,  conversions: 5,  conversionRate: 71.4 },
  { monthKey: "2026-02", label: "Feb '26", revenue:  580000, bookings: 7,  proposals: 9,  conversions: 7,  conversionRate: 77.8 },
  { monthKey: "2026-03", label: "Mar '26", revenue:  620000, bookings: 9,  proposals: 11, conversions: 8,  conversionRate: 72.7 },
];

const DEMO_ACTIVITIES: DashboardActivity[] = [
  { id: "da1", type: "trip",         title: "Andaman Island Break",      description: "Trip to Port Blair, Havelock Island",  timestamp: "2026-03-01T07:00:00Z", status: "in_progress" },
  { id: "da2", type: "trip",         title: "Varanasi Heritage Journey",  description: "Trip to Varanasi, Sarnath",            timestamp: "2026-02-28T10:00:00Z", status: "confirmed" },
  { id: "da3", type: "notification", title: "Payment Reminder",           description: "WhatsApp reminder sent to Amit Mehta", timestamp: "2026-02-27T14:30:00Z", status: "sent" },
  { id: "da4", type: "trip",         title: "Leh Ladakh Bike Expedition", description: "Trip to Leh, Nubra Valley, Pangong",   timestamp: "2026-02-25T09:00:00Z", status: "pending" },
  { id: "da5", type: "inquiry",      title: "Partner Inquiry",            description: "From Thrillophilia India",             timestamp: "2026-02-24T11:00:00Z", status: "new" },
];

export function useDashboardStats() {
  const { isDemoMode } = useDemoMode();

  return useQuery<DashboardStatsResponse>({
    queryKey: dashboardKeys.stats(isDemoMode),
    queryFn: async () => {
      if (isDemoMode) {
        return {
          stats: {
            totalDrivers: 4,
            totalClients: 12,
            activeTrips: 6,
            pendingNotifications: 3,
            marketplaceViews: 142,
            marketplaceInquiries: 8,
            conversionRate: "72.7",
          },
          activities: DEMO_ACTIVITIES,
          series: DEMO_SERIES,
          operatorName: "Avinash",
        };
      }

      const response = await fetch("/api/admin/dashboard/stats", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Dashboard API returned ${response.status}`);
      }
      return (await response.json()) as DashboardStatsResponse;
    },
    staleTime: 5 * 60 * 1000,
  });
}
