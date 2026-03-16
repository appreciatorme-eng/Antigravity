import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const analyticsKeys = {
    all: ['analytics'] as const,
    revenue: () => [...analyticsKeys.all, 'revenue'] as const,
    conversion: () => [...analyticsKeys.all, 'conversion'] as const,
    market: () => [...analyticsKeys.all, 'market'] as const,
};

/** Compute the start date for the current and previous period based on the given period type. */
function getPeriodBounds(period: 'month' | 'quarter' | 'year'): {
    currentStart: string;
    previousStart: string;
    previousEnd: string;
} {
    const now = new Date();

    if (period === 'month') {
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
            currentStart: currentStart.toISOString(),
            previousStart: previousStart.toISOString(),
            previousEnd: currentStart.toISOString(),
        };
    }

    if (period === 'quarter') {
        const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const previousQuarterStart = new Date(currentQuarterStart.getFullYear(), currentQuarterStart.getMonth() - 3, 1);
        return {
            currentStart: currentQuarterStart.toISOString(),
            previousStart: previousQuarterStart.toISOString(),
            previousEnd: currentQuarterStart.toISOString(),
        };
    }

    // year
    const currentStart = new Date(now.getFullYear(), 0, 1);
    const previousStart = new Date(now.getFullYear() - 1, 0, 1);
    return {
        currentStart: currentStart.toISOString(),
        previousStart: previousStart.toISOString(),
        previousEnd: currentStart.toISOString(),
    };
}

/** Sum total_amount from an array of invoice rows. */
function sumRevenue(rows: ReadonlyArray<{ total_amount: number }>): number {
    return rows.reduce((sum, row) => sum + row.total_amount, 0);
}

/** Calculate growth percentage between two values. Returns 0 when previous is 0. */
function calcGrowth(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
}

// Previously hardcoded — now real data from invoices table
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

            const orgId = profile.organization_id;

            try {
                const { currentStart, previousStart, previousEnd } = getPeriodBounds(period);

                // Fetch current period paid invoices
                const { data: currentInvoices, error: currentError } = await supabase
                    .from('invoices')
                    .select('total_amount')
                    .eq('organization_id', orgId)
                    .in('status', ['paid', 'partially_paid'])
                    .gte('created_at', currentStart);

                if (currentError) {
                    throw new Error(currentError.message);
                }

                // Fetch previous period paid invoices for growth calculation
                const { data: previousInvoices, error: previousError } = await supabase
                    .from('invoices')
                    .select('total_amount')
                    .eq('organization_id', orgId)
                    .in('status', ['paid', 'partially_paid'])
                    .gte('created_at', previousStart)
                    .lt('created_at', previousEnd);

                if (previousError) {
                    throw new Error(previousError.message);
                }

                const currentRevenue = sumRevenue(currentInvoices ?? []);
                const previousRevenue = sumRevenue(previousInvoices ?? []);

                return {
                    totalRevenue: currentRevenue,
                    growth: calcGrowth(currentRevenue, previousRevenue),
                    period,
                };
            } catch {
                // Fallback: return zeros so the UI shows 0 rather than fake data
                return {
                    totalRevenue: 0,
                    growth: 0,
                    period,
                };
            }
        }
    });
}

// Previously hardcoded — now real data from invoices table
export function useConversionAnalytics() {
    return useQuery({
        queryKey: analyticsKeys.conversion(),
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

            const orgId = profile.organization_id;

            try {
                const now = new Date();
                const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

                // Current month: total invoices and paid invoices
                const { count: currentTotal, error: currentTotalError } = await supabase
                    .from('invoices')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', orgId)
                    .gte('created_at', currentMonthStart.toISOString());

                if (currentTotalError) throw new Error(currentTotalError.message);

                const { count: currentPaid, error: currentPaidError } = await supabase
                    .from('invoices')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', orgId)
                    .in('status', ['paid', 'partially_paid'])
                    .gte('created_at', currentMonthStart.toISOString());

                if (currentPaidError) throw new Error(currentPaidError.message);

                // Previous month for improvement calculation
                const { count: previousTotal, error: previousTotalError } = await supabase
                    .from('invoices')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', orgId)
                    .gte('created_at', previousMonthStart.toISOString())
                    .lt('created_at', currentMonthStart.toISOString());

                if (previousTotalError) throw new Error(previousTotalError.message);

                const { count: previousPaid, error: previousPaidError } = await supabase
                    .from('invoices')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', orgId)
                    .in('status', ['paid', 'partially_paid'])
                    .gte('created_at', previousMonthStart.toISOString())
                    .lt('created_at', currentMonthStart.toISOString());

                if (previousPaidError) throw new Error(previousPaidError.message);

                const safeCurrentTotal = currentTotal ?? 0;
                const safeCurrentPaid = currentPaid ?? 0;
                const safePreviousTotal = previousTotal ?? 0;
                const safePreviousPaid = previousPaid ?? 0;

                const currentRate = safeCurrentTotal > 0
                    ? Math.round((safeCurrentPaid / safeCurrentTotal) * 100)
                    : 0;
                const previousRate = safePreviousTotal > 0
                    ? Math.round((safePreviousPaid / safePreviousTotal) * 100)
                    : 0;

                return {
                    rate: currentRate,
                    improvement: currentRate - previousRate,
                };
            } catch {
                // Fallback: return zeros so the UI shows 0 rather than fake data
                return {
                    rate: 0,
                    improvement: 0,
                };
            }
        }
    });
}
