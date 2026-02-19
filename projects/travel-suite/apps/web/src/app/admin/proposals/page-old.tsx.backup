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

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700', icon: Eye },
  commented: { label: 'Commented', color: 'bg-yellow-100 text-yellow-700', icon: MessageCircle },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function ProposalsPage() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  async function handleDeleteProposal(proposalId: string) {
    if (!confirm('Are you sure you want to delete this proposal? This cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('proposals').delete().eq('id', proposalId);

      if (error) {
        console.error('Error deleting proposal:', error);
        alert('Failed to delete proposal');
      } else {
        loadProposals();
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  }

  function copyShareLink(shareToken: string) {
    const shareUrl = `${window.location.origin}/p/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading proposals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f6efe4] flex items-center justify-center">
            <Send className="w-5 h-5 text-[#9c7c46]" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[#bda87f]">Proposals</span>
            <h1 className="text-2xl font-[var(--font-display)] text-[#1b140a] mt-1">
              Client Proposals
            </h1>
            <p className="text-sm text-[#6f5b3e]">Interactive itinerary proposals for clients</p>
          </div>
        </div>
        <Link
          href="/admin/proposals/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Proposal
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search proposals by title or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="commented">Commented</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Send className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Get started by creating your first proposal'}
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <Link
                href="/admin/proposals/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#9c7c46] hover:bg-[#8a6d3e]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Proposal
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#eadfcd] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f8f1e6]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6f5b3e] uppercase tracking-wider">
                  Proposal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6f5b3e] uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6f5b3e] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6f5b3e] uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6f5b3e] uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#6f5b3e] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadfcd]">
              {filteredProposals.map((proposal) => {
                const statusInfo = STATUS_LABELS[proposal.status] || STATUS_LABELS.draft;
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={proposal.id} className="hover:bg-[#f8f1e6]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[#1b140a]">{proposal.title}</div>
                        {proposal.template_name && (
                          <div className="text-xs text-[#bda87f]">
                            From: {proposal.template_name}
                          </div>
                        )}
                        <div className="text-xs text-[#bda87f] mt-1">
                          v{proposal.version} •{' '}
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#1b140a]">{proposal.client_name}</div>
                      {proposal.client_email && (
                        <div className="text-xs text-[#bda87f]">{proposal.client_email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                      {proposal.comments_count && proposal.comments_count > 0 && (
                        <div className="text-xs text-[#bda87f] mt-1 flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {proposal.comments_count} comment{proposal.comments_count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-[#9c7c46]">
                        ${proposal.total_price.toFixed(2)}
                      </div>
                      {proposal.client_selected_price &&
                        proposal.client_selected_price !== proposal.total_price && (
                          <div className="text-xs text-[#bda87f]">
                            Client: ${proposal.client_selected_price.toFixed(2)}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6f5b3e]">
                      {proposal.viewed_at && (
                        <div className="flex items-center gap-1 text-xs mb-1">
                          <Eye className="w-3 h-3" />
                          Viewed {new Date(proposal.viewed_at).toLocaleDateString()}
                        </div>
                      )}
                      {proposal.approved_at && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Approved {new Date(proposal.approved_at).toLocaleDateString()}
                        </div>
                      )}
                      {!proposal.viewed_at && proposal.status === 'sent' && (
                        <div className="text-xs text-gray-500">Not viewed yet</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/proposals/${proposal.id}`}
                          className="inline-flex items-center justify-center p-2 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-[#f8f1e6] transition-colors"
                          title="View Proposal"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => copyShareLink(proposal.share_token)}
                          className="inline-flex items-center justify-center p-2 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-[#f8f1e6] transition-colors"
                          title="Copy Share Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={`/p/${proposal.share_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-2 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-[#f8f1e6] transition-colors"
                          title="Open Client View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteProposal(proposal.id)}
                          className="inline-flex items-center justify-center p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Proposal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Summary */}
      {proposals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-[#eadfcd] p-4">
            <div className="text-sm text-[#bda87f]">Total Proposals</div>
            <div className="text-2xl font-bold text-[#1b140a] mt-1">{proposals.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-[#eadfcd] p-4">
            <div className="text-sm text-[#bda87f]">Viewed</div>
            <div className="text-2xl font-bold text-[#1b140a] mt-1">
              {proposals.filter((p) => p.viewed_at).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#eadfcd] p-4">
            <div className="text-sm text-[#bda87f]">Approved</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {proposals.filter((p) => p.approved_at).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#eadfcd] p-4">
            <div className="text-sm text-[#bda87f]">Total Value</div>
            <div className="text-2xl font-bold text-[#9c7c46] mt-1">
              $
              {proposals
                .reduce((sum, p) => sum + (p.total_price || 0), 0)
                .toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
