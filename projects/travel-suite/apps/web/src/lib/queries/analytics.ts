import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const analyticsKeys = {
    all: ['analytics'] as const,
    revenue: () => [...analyticsKeys.all, 'revenue'] as const,
    conversion: () => [...analyticsKeys.all, 'conversion'] as const,
    market: () => [...analyticsKeys.all, 'market'] as const,
};

export function useRevenueAnalytics(period: 'month' | 'quarter' | 'year' = 'month') {
    return useQuery({
        queryKey: [...analyticsKeys.revenue(), period],
        queryFn: async () => {
            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!profile?.organization_id) throw new Error("No organization found");

            // In a real application, we would call an RPC function or aggregate data.
            // Here we provide a mock/placeholder structure that aligns with the dashboard.
            return {
                totalRevenue: 247500,
                growth: 12.5,
                period,
            };
        }
    });
}

export function useConversionAnalytics() {
    return useQuery({
        queryKey: analyticsKeys.conversion(),
        queryFn: async () => {
            return {
                rate: 64,
                improvement: 5.2,
            };
        }
    });
}
