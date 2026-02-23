'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  Eye,
  Send,
  Copy,
  Trash2,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassInput } from '@/components/glass/GlassInput';
import { GlassConfirmModal } from '@/components/glass/GlassModal';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassListSkeleton } from '@/components/glass/GlassSkeleton';
import { useToast } from '@/components/ui/toast';

interface Proposal {
  id: string;
  organization_id: string;
  client_id: string;
  template_id: string | null;
  title: string;
  share_token: string;
  version: number;
  status: string;
  total_price: number;
  client_selected_price: number | null;
  expires_at: string | null;
  viewed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  client_name?: string;
  client_email?: string;
  template_name?: string;
  comments_count?: number;
}

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_LABELS: Record<string, { label: string; variant: BadgeVariant; icon: any }> = {
  draft: { label: 'Draft', variant: 'default', icon: Clock },
  sent: { label: 'Sent', variant: 'info', icon: Send },
  viewed: { label: 'Viewed', variant: 'primary', icon: Eye },
  commented: { label: 'Commented', variant: 'warning', icon: MessageCircle },
  approved: { label: 'Approved', variant: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle },
};

export default function ProposalsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<Proposal | null>(null);

  useEffect(() => {
    loadProposals();
  }, []);

  async function loadProposals() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get organization ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      // Load proposals with joined client and template data
      let query = supabase
        .from('proposals')
        .select(
          `
          *,
          clients(full_name, email),
          tour_templates(name)
        `
        )
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading proposals:', error);
      } else {
        // Format data with joined fields
        const formattedProposals = (data || []).map((proposal: any) => ({
          ...proposal,
          client_name: proposal.clients?.full_name || 'Unknown Client',
          client_email: proposal.clients?.email,
          template_name: proposal.tour_templates?.name,
        }));

        // Load comment counts for each proposal
        const proposalsWithCounts = await Promise.all(
          formattedProposals.map(async (proposal) => {
            const { count } = await supabase
              .from('proposal_comments')
              .select('*', { count: 'exact', head: true })
              .eq('proposal_id', proposal.id);

            return {
              ...proposal,
              comments_count: count || 0,
            };
          })
        );

        setProposals(proposalsWithCounts);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProposal() {
    if (!deleteConfirm) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('proposals').delete().eq('id', deleteConfirm.id);

      if (error) {
        console.error('Error deleting proposal:', error);
        toast({
          title: 'Delete failed',
          description: 'Failed to delete proposal',
          variant: 'error',
        });
      } else {
        loadProposals();
        toast({
          title: 'Proposal deleted',
          description: 'Proposal has been removed.',
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
    } finally {
      setDeleteConfirm(null);
    }
  }

  function copyShareLink(shareToken: string) {
    const shareUrl = `${window.location.origin}/p/${shareToken}`;
    void navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Share link copied',
        description: 'Proposal share link copied to clipboard.',
        variant: 'success',
      });
    }).catch(() => {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy share link. Please copy manually.',
        variant: 'error',
      });
    });
  }

  const filteredProposals = proposals.filter((proposal) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        proposal.title.toLowerCase().includes(query) ||
        proposal.client_name?.toLowerCase().includes(query) ||
        proposal.client_email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Proposals</span>
              <h1 className="text-2xl font-serif text-secondary dark:text-white mt-1">
                Client Proposals
              </h1>
            </div>
          </div>
        </div>
        <GlassListSkeleton items={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Proposals</span>
            <h1 className="text-2xl font-serif text-secondary dark:text-white mt-1">
              Client Proposals
            </h1>
            <p className="text-sm text-text-secondary">Interactive itinerary proposals for clients</p>
          </div>
        </div>
        <Link href="/admin/proposals/create">
          <GlassButton variant="primary">
            <Plus className="w-4 h-4" />
            Create Proposal
          </GlassButton>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <GlassInput
            icon={Search}
            placeholder="Search proposals by title or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <GlassButton
            variant={filterStatus === 'all' ? 'primary' : 'ghost'}
            onClick={() => setFilterStatus('all')}
          >
            All
          </GlassButton>
          <GlassButton
            variant={filterStatus === 'draft' ? 'primary' : 'ghost'}
            onClick={() => setFilterStatus('draft')}
          >
            Draft
          </GlassButton>
          <GlassButton
            variant={filterStatus === 'sent' ? 'primary' : 'ghost'}
            onClick={() => setFilterStatus('sent')}
          >
            Sent
          </GlassButton>
          <GlassButton
            variant={filterStatus === 'approved' ? 'primary' : 'ghost'}
            onClick={() => setFilterStatus('approved')}
          >
            Approved
          </GlassButton>
        </div>
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <GlassCard padding="lg">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-secondary dark:text-white mb-2">No proposals found</h3>
            <p className="text-sm text-text-secondary mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating your first proposal'}
            </p>
            {!searchQuery && (
              <Link href="/admin/proposals/create">
                <GlassButton variant="primary">
                  <Plus className="w-4 h-4" />
                  Create Proposal
                </GlassButton>
              </Link>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => {
            const statusInfo = STATUS_LABELS[proposal.status] || STATUS_LABELS.draft;
            const StatusIcon = statusInfo.icon;

            return (
              <GlassCard key={proposal.id} padding="lg" className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                        <Send className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary dark:text-white">
                          {proposal.title}
                        </h3>
                        <p className="text-sm text-text-secondary">{proposal.client_name}</p>
                        {proposal.client_email && (
                          <p className="text-xs text-text-secondary">{proposal.client_email}</p>
                        )}
                      </div>
                      <GlassBadge variant={statusInfo.variant} icon={StatusIcon}>
                        {statusInfo.label}
                      </GlassBadge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-text-secondary">Price</p>
                        <p className="text-lg font-semibold text-primary">
                          ${proposal.total_price.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Version</p>
                        <p className="text-sm text-secondary dark:text-white">v{proposal.version}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Created</p>
                        <p className="text-sm text-secondary dark:text-white">
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Comments</p>
                        <p className="text-sm text-secondary dark:text-white flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {proposal.comments_count || 0}
                        </p>
                      </div>
                    </div>

                    {proposal.template_name && (
                      <p className="text-xs text-text-secondary mb-2">
                        From template: {proposal.template_name}
                      </p>
                    )}

                    {proposal.viewed_at && (
                      <p className="text-xs text-text-secondary flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Viewed {new Date(proposal.viewed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link href={`/admin/proposals/${proposal.id}`}>
                      <GlassButton variant="primary" size="sm" fullWidth>
                        <Eye className="w-4 h-4" />
                        View
                      </GlassButton>
                    </Link>
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => copyShareLink(proposal.share_token)}
                    >
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </GlassButton>
                    <a
                      href={`/p/${proposal.share_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <GlassButton variant="ghost" size="sm" fullWidth>
                        <ExternalLink className="w-4 h-4" />
                        Client View
                      </GlassButton>
                    </a>
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(proposal)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {proposals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard padding="lg">
            <p className="text-xs uppercase tracking-wider text-text-secondary font-bold mb-2">
              Total Proposals
            </p>
            <p className="text-2xl font-serif text-secondary dark:text-white">{proposals.length}</p>
          </GlassCard>
          <GlassCard padding="lg">
            <p className="text-xs uppercase tracking-wider text-text-secondary font-bold mb-2">
              Viewed
            </p>
            <p className="text-2xl font-serif text-secondary dark:text-white">
              {proposals.filter((p) => p.viewed_at).length}
            </p>
          </GlassCard>
          <GlassCard padding="lg">
            <p className="text-xs uppercase tracking-wider text-text-secondary font-bold mb-2">
              Approved
            </p>
            <p className="text-2xl font-serif text-green-600 dark:text-green-400">
              {proposals.filter((p) => p.approved_at).length}
            </p>
          </GlassCard>
          <GlassCard padding="lg">
            <p className="text-xs uppercase tracking-wider text-text-secondary font-bold mb-2">
              Total Value
            </p>
            <p className="text-2xl font-serif text-primary">
              $
              {proposals
                .reduce((sum, p) => sum + (p.total_price || 0), 0)
                .toFixed(2)}
            </p>
          </GlassCard>
        </div>
      )}

      {/* Delete Confirmation */}
      <GlassConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteProposal}
        title="Delete Proposal"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete Proposal"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
