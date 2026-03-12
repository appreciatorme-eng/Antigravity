// Proposal query hooks — useProposals returns DEMO_PROPOSALS when isDemoMode is on.
// Cache key includes isDemoMode segment for instant isolation on toggle.

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useDemoMode } from '@/lib/demo/demo-mode-context';
import { DEMO_PROPOSALS } from '@/lib/demo/data';

const PROPOSAL_LIST_SELECT = [
    'approved_at',
    'approved_by',
    'client_id',
    'client_selected_price',
    'created_at',
    'expires_at',
    'id',
    'organization_id',
    'share_token',
    'status',
    'template_id',
    'title',
    'total_price',
    'updated_at',
    'version',
    'viewed_at',
    'clients(full_name, email)',
    'tour_templates(name)',
].join(', ');
const PROPOSAL_DETAIL_SELECT = [
    'approved_at',
    'approved_by',
    'client_id',
    'client_selected_price',
    'created_at',
    'expires_at',
    'id',
    'organization_id',
    'share_token',
    'status',
    'template_id',
    'title',
    'total_price',
    'updated_at',
    'version',
    'viewed_at',
    'clients(full_name, email)',
    'proposal_sections(id)',
    'tour_templates(id, name, destination)',
].join(', ');
type ProposalListRow = {
    approved_at: string | null;
    approved_by: string | null;
    client_id: string;
    client_selected_price: number | null;
    clients: { full_name?: string; email?: string } | null;
    created_at: string | null;
    expires_at: string | null;
    id: string;
    organization_id: string;
    share_token: string;
    status: string | null;
    template_id: string | null;
    title: string;
    total_price: number | null;
    tour_templates: { name?: string } | null;
    updated_at: string | null;
    version: number | null;
    viewed_at: string | null;
};
type ProposalDetailRow = ProposalListRow & {
    proposal_sections: Array<{ id: string }> | null;
    tour_templates: { id?: string; name?: string; destination?: string | null } | null;
};

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
                .select(PROPOSAL_LIST_SELECT)
                .eq('organization_id', profile.organization_id)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            const proposalRows = (data as unknown as ProposalListRow[] | null) ?? [];
            if (error) throw error;

            const formattedProposals = proposalRows.map((proposal) => {
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
                .select(PROPOSAL_DETAIL_SELECT)
                .eq('id', id)
                .single();

            if (error) throw error;
            return (data as unknown as ProposalDetailRow | null) ?? null;
        },
        enabled: !!id,
    });
}
