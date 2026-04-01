// Trip query hooks — useTrips returns DEMO_TRIPS when isDemoMode is on.
// Cache key includes isDemoMode segment for instant isolation on toggle.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authedFetch } from '@/lib/api/authed-fetch';
import { createClient } from '@/lib/supabase/client';
import { useDemoMode } from '@/lib/demo/demo-mode-context';
import { DEMO_TRIPS } from '@/lib/demo/data';

const UPDATED_TRIP_STATUS_SELECT = 'id, status';

export const tripsKeys = {
    all: ['trips'] as const,
    lists: () => [...tripsKeys.all, 'list'] as const,
    list: (filters: string) => [...tripsKeys.lists(), { filters }] as const,
    details: () => [...tripsKeys.all, 'detail'] as const,
    detail: (id: string) => [...tripsKeys.details(), id] as const,
};

export function useTrips(statusFilter: string = 'all', searchQuery: string = '') {
    const { isDemoMode } = useDemoMode();

    return useQuery({
        queryKey: [...tripsKeys.lists(), { statusFilter, searchQuery, mode: isDemoMode ? 'demo' : 'live' }],
        staleTime: 30_000,
        queryFn: async () => {
            if (isDemoMode) {
                let results = DEMO_TRIPS;
                if (statusFilter !== 'all') {
                    results = results.filter((t) => t.status === statusFilter);
                }
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    results = results.filter(
                        (t) =>
                            (t.itineraries?.trip_title ?? '').toLowerCase().includes(q) ||
                            t.destination.toLowerCase().includes(q) ||
                            (t.profiles?.full_name ?? '').toLowerCase().includes(q),
                    );
                }
                return results;
            }

            const response = await authedFetch(`/api/trips?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchQuery)}`);

            if (!response.ok) {
                throw new Error("Failed to fetch trips");
            }

            const payload = await response.json();
            return payload.trips;
        }
    });
}

export function useTrip(id: string) {
    return useQuery({
        queryKey: tripsKeys.detail(id),
        queryFn: async () => {
            const response = await authedFetch(`/api/trips/${id}`);
            if (!response.ok) throw new Error("Failed to fetch trip details");
            const payload = await response.json();
            return payload.trip;
        },
        enabled: !!id,
    });
}

export function useUpdateTripStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('trips')
                .update({ status })
                .eq('id', id)
                .select(UPDATED_TRIP_STATUS_SELECT)
                .single();

            if (error) throw error;
            return data;
        },
        onMutate: async ({ id, status }) => {
            return { id, status };
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: tripsKeys.all });
        },
    });
}

export function useCloneTrip() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await authedFetch(`/api/trips/${id}/clone`, {
                method: "POST",
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || "Failed to clone trip");
            }

            return response.json() as Promise<{ success: boolean; tripId: string; message: string }>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tripsKeys.all });
        }
    });
}
