import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/database.types';

export const tripsKeys = {
    all: ['trips'] as const,
    lists: () => [...tripsKeys.all, 'list'] as const,
    list: (filters: string) => [...tripsKeys.lists(), { filters }] as const,
    details: () => [...tripsKeys.all, 'detail'] as const,
    detail: (id: string) => [...tripsKeys.details(), id] as const,
};

export function useTrips(statusFilter: string = 'all', searchQuery: string = '') {
    return useQuery({
        queryKey: [...tripsKeys.lists(), { statusFilter, searchQuery }],
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch(`/api/trips?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                },
            });

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
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/trips/${id}`, {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch trip details");
            const payload = await response.json();
            return payload.trip;
        },
        enabled: !!id,
    });
}

// Example mutation for optimistic updates
export function useUpdateTripStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('trips')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onMutate: async ({ id, status }) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            // await queryClient.cancelQueries({ queryKey: tripsKeys.all });

            // Snapshot the previous value (if needed for rollback)
            // const previousTrips = queryClient.getQueryData(tripsKeys.lists());

            // Return a context object with the snapshotted value
            return { id, status };
        },
        onSettled: () => {
            // Invalidate the query to fetch the latest state
            queryClient.invalidateQueries({ queryKey: tripsKeys.all });
        },
    });
}

export function useCloneTrip() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/trips/${id}/clone`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                },
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
