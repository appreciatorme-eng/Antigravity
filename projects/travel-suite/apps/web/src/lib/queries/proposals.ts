// Proposal query hooks — useProposals returns DEMO_PROPOSALS when isDemoMode is on.
// Cache key includes isDemoMode segment for instant isolation on toggle.

import { useQuery } from '@tanstack/react-query';
import { authedFetch } from '@/lib/api/authed-fetch';
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
    'trip_id',
    'template_id',
    'title',
    'total_price',
    'trips:trip_id(id, status, start_date, end_date)',
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
    'trip_id',
    'template_id',
    'title',
    'total_price',
    'trips:trip_id(id, status, start_date, end_date)',
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
    trip_id: string | null;
    template_id: string | null;
    title: string;
    total_price: number | null;
    trips: { id: string; status: string | null; start_date: string | null; end_date: string | null } | null;
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

            const response = await authedFetch(`/api/admin/proposals?status=${encodeURIComponent(statusFilter)}`);
            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload?.error || "Failed to load proposals");
            }

            const payload = await response.json();
            return (payload?.proposals as ProposalListRow[] | undefined) ?? [];
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
