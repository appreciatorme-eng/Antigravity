// Client query hooks — useClients returns DEMO_CLIENTS when isDemoMode is on.
// Cache key includes isDemoMode segment for instant isolation on toggle.

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useDemoMode } from '@/lib/demo/demo-mode-context';
import { DEMO_CLIENTS } from '@/lib/demo/data';

export const clientsKeys = {
    all: ['clients'] as const,
    lists: () => [...clientsKeys.all, 'list'] as const,
    list: (filters: string) => [...clientsKeys.lists(), { filters }] as const,
    details: () => [...clientsKeys.all, 'detail'] as const,
    detail: (id: string) => [...clientsKeys.details(), id] as const,
};

export function useClients() {
    const { isDemoMode } = useDemoMode();

    return useQuery({
        queryKey: [...clientsKeys.lists(), isDemoMode ? 'demo' : 'live'],
        queryFn: async () => {
            if (isDemoMode) {
                return DEMO_CLIENTS;
            }

            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch("/api/admin/clients", {
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
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

            if (!session?.access_token) {
                throw new Error("Not authenticated");
            }

            const response = await fetch(`/api/admin/clients/${id}`, {
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch client");
            const payload = await response.json();
            return payload.client;
        },
        enabled: !!id,
    });
}
