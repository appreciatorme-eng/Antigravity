import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const itinerariesKeys = {
    all: ['itineraries'] as const,
    lists: () => [...itinerariesKeys.all, 'list'] as const,
    details: () => [...itinerariesKeys.all, 'detail'] as const,
    detail: (id: string) => [...itinerariesKeys.details(), id] as const,
};

export function useItineraries() {
    return useQuery({
        queryKey: itinerariesKeys.lists(),
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch("/api/itineraries", {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch itineraries");
            }

            const payload = await response.json();
            return payload.itineraries;
        }
    });
}

export function useUpdateItinerary() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: { client_id?: string | null; budget?: string } }) => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/itineraries/${id}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || "Failed to update itinerary");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: itinerariesKeys.all });
            // If the clients query expects changes or trips queries expect changes we might invalidate them too, but itineraries is the main one here.
        }
    });
}
