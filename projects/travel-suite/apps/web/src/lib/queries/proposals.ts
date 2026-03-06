// Proposal query hooks — useProposals returns DEMO_PROPOSALS when isDemoMode is on.
// Cache key includes isDemoMode segment for instant isolation on toggle.

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useDemoMode } from '@/lib/demo/demo-mode-context';
import { DEMO_PROPOSALS } from '@/lib/demo/data';

export const proposalsKeys = {
    all: ['proposals'] as const,
    lists: () => [...proposalsKeys.all, 'list'] as const,
    list: (filters: string) => [...proposalsKeys.lists(), { filters }] as const,
    details: () => [...proposalsKeys.all, 'detail'] as const,
    detail: (id: string) => [...proposalsKeys.details(), id] as const,
};

export function useProposals(statusFilter: string = 'all') {
    const { isDemoMode } = useDemoMode();

    return useQuery({
        queryKey: [...proposalsKeys.list(statusFilter), isDemoMode ? 'demo' : 'live'],
        queryFn: async () => {
            if (isDemoMode) {
                if (statusFilter === 'all') {
                    return DEMO_PROPOSALS;
                }
                return DEMO_PROPOSALS.filter((p) => p.status === statusFilter);
            }

            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!profile?.organization_id) throw new Error("No organization found");

            let query = supabase
                .from('proposals')
                .select(`*, clients(full_name, email), tour_templates(name)`)
                .eq('organization_id', profile.organization_id)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            const formattedProposals = (data || []).map((proposal) => {
                const clients = proposal.clients as { full_name?: string; email?: string } | null;
                const tourTemplates = proposal.tour_templates as { name?: string } | null;
                return {
                    ...proposal,
                    client_name: clients?.full_name || 'Unknown Client',
                    client_email: clients?.email,
                    template_name: tourTemplates?.name,
                };
            });

            const proposalsWithCounts = await Promise.all(
                formattedProposals.map(async (proposal) => {
                    const { count } = await supabase
                        .from('proposal_comments')
                        .select('*', { count: 'exact', head: true })
                        .eq('proposal_id', proposal.id);
                    return { ...proposal, comments_count: count || 0 };
                })
            );

            return proposalsWithCounts;
        }
    });
}

export function useProposal(id: string) {
    return useQuery({
        queryKey: proposalsKeys.detail(id),
        queryFn: async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('proposals')
                .select(`
          *,
          clients(*),
          proposal_sections(*),
          tour_templates(*)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
}
