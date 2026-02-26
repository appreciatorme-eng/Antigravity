import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/database.types';

export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
    activities: () => [...dashboardKeys.all, 'activities'] as const,
};

export function useDashboardStats() {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: async () => {
            const supabase = createClient();

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const [driversRes, clientsRes, tripsRes, notifiesRes] = await Promise.all([
                supabase.from("external_drivers").select("id", { count: "exact", head: true }),
                supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
                supabase.from("trips").select("id", { count: "exact", head: true }).eq("status", "active"),
                supabase.from("notifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
            ]);

            // Fetch marketplace stats
            let marketStats = null;
            try {
                const marketRes = await fetch("/api/marketplace/stats", {
                    headers: { "Authorization": `Bearer ${session.access_token}` }
                });
                if (marketRes.ok) marketStats = await marketRes.json();
            } catch (e) {
                console.error("Marketplace stats fetch failed", e);
            }

            const [recentTrips, recentNotifies] = await Promise.all([
                supabase
                    .from("trips")
                    .select("id, status, created_at, itineraries(trip_title, destination)")
                    .order("created_at", { ascending: false })
                    .limit(5),
                supabase
                    .from("notifications")
                    .select("id, title, body, sent_at, status")
                    .order("sent_at", { ascending: false })
                    .limit(5),
            ]);

            const activities = [
                ...(recentTrips.data || []).map((t: any) => ({
                    id: t.id,
                    type: "trip" as const,
                    title: t.itineraries?.trip_title || "New Trip Protocol",
                    description: `Deployment to ${t.itineraries?.destination || "Unknown Location"}`,
                    timestamp: t.created_at,
                    status: t.status || "draft",
                })),
                ...(recentNotifies.data || []).map((n: any) => ({
                    id: n.id,
                    type: "notification" as const,
                    title: n.title || "System Alert",
                    description: n.body || "Notification dispatched to client",
                    timestamp: n.sent_at || new Date().toISOString(),
                    status: n.status || "sent",
                })),
                ...(marketStats?.recent_inquiries || []).map((inq: any) => ({
                    id: inq.id || Math.random().toString(),
                    type: "inquiry" as const,
                    title: "Partner Inquiry",
                    description: `From ${inq.organizations?.name || "Unknown Partner"}`,
                    timestamp: inq.created_at,
                    status: "new",
                })),
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

            return {
                stats: {
                    totalDrivers: driversRes.count || 0,
                    totalClients: clientsRes.count || 0,
                    activeTrips: tripsRes.count || 0,
                    pendingNotifications: notifiesRes.count || 0,
                    marketplaceViews: marketStats?.views || 0,
                    marketplaceInquiries: marketStats?.inquiries || 0,
                    conversionRate: marketStats?.conversion_rate || "0.0",
                },
                activities
            };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
