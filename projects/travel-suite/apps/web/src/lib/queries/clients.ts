import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const clientsKeys = {
    all: ['clients'] as const,
    lists: () => [...clientsKeys.all, 'list'] as const,
    list: (filters: string) => [...clientsKeys.lists(), { filters }] as const,
    details: () => [...clientsKeys.all, 'detail'] as const,
    detail: (id: string) => [...clientsKeys.details(), id] as const,
};

export function useClients() {
    return useQuery({
        queryKey: clientsKeys.lists(),
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch("/api/admin/clients", {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch clients");
            }

            const payload = await response.json();
            return payload.clients;
        }
    });
}

export function useClient(id: string) {
    return useQuery({
        queryKey: clientsKeys.detail(id),
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch(`/api/admin/clients/${id}`, {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch client");
            const payload = await response.json();
            return payload.client;
        },
        enabled: !!id,
    });
}
