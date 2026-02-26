'use client';

import { useState } from 'react';
import { useProposals } from '@/lib/queries/proposals';
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
  ChevronRight,
  TrendingUp,
  Mail,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassInput } from '@/components/glass/GlassInput';
import { GlassConfirmModal } from '@/components/glass/GlassModal';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassListSkeleton } from '@/components/glass/GlassSkeleton';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

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
  client_name?: string;
  client_email?: string;
  template_name?: string;
  comments_count?: number;
}

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant; icon: any; color: string; bg: string }> = {
  draft: { label: 'Draft', variant: 'default', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50' },
  sent: { label: 'Sent', variant: 'info', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
  viewed: { label: 'Viewed', variant: 'primary', icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  commented: { label: 'Commented', variant: 'warning', icon: MessageCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  approved: { label: 'Approved', variant: 'success', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
};

export default function ProposalsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<Proposal | null>(null);

  const { data: proposalsRaw, isLoading: loading, refetch: loadProposals } = useProposals(filterStatus);
  const proposals: Proposal[] = proposalsRaw || [];

  async function handleDeleteProposal() {
    if (!deleteConfirm) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('proposals').delete().eq('id', deleteConfirm.id);
      if (error) {
        toast({ title: 'Delete failed', description: 'Failed to delete proposal', variant: 'error' });
      } else {
        loadProposals();
        toast({ title: 'Proposal deleted', description: 'Proposal has been removed.', variant: 'success' });
      }
    } finally {
      setDeleteConfirm(null);
    }
  }

  function copyShareLink(shareToken: string) {
    const shareUrl = `${window.location.origin}/p/${shareToken}`;
    void navigator.clipboard.writeText(shareUrl).then(() => {
      toast({ title: 'Share link copied', description: 'Proposal share link copied to clipboard.', variant: 'success' });
    });
  }

  const filteredItems = proposals.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q);
  });

  const summaryStats = [
    { label: 'Total Volume', value: `$${proposals.reduce((s, p) => s + (p.total_price || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Approved', value: proposals.filter(p => p.status === 'approved').length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Conversion', value: proposals.length ? `${Math.round((proposals.filter(p => p.status === 'approved').length / proposals.length) * 100)}%` : '0%', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Active Leas', value: proposals.filter(p => p.status === 'sent' || p.status === 'viewed').length, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-serif text-secondary tracking-tight">Proposals</h1>
          <p className="text-text-secondary mt-2 text-lg">
            Manage your high-conversion itinerary proposals and client engagement.
          </p>
        </div>
        <Link href="/proposals/create">
          <GlassButton variant="primary" className="rounded-2xl shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" />
            Generate Proposal
          </GlassButton>
        </Link>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat) => (
          <GlassCard key={stat.label} padding="lg" className="group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
                <p className="text-3xl font-bold text-secondary mt-1 tracking-tight tabular-nums">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <GlassCard padding="none" className="flex-1 w-full overflow-hidden border-gray-100 shadow-sm">
          <div className="flex items-center px-4 py-2">
            <Search className="w-5 h-5 text-text-muted mr-3" />
            <input
              type="text"
              placeholder="Search by title, client name, or reference..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-secondary placeholder:text-text-muted/60 text-sm h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </GlassCard>

        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {['all', 'draft', 'sent', 'approved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize",
                filterStatus === s
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-text-secondary hover:bg-gray-100"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <GlassCard padding="none" className="overflow-hidden border-gray-100 shadow-xl">
        {loading ? (
          <GlassListSkeleton items={6} />
        ) : filteredItems.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-100">
              <Send className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-serif text-secondary">No proposals found</h3>
            <p className="text-text-secondary mt-3 max-w-sm mx-auto">
              Ready to win more business? Create your first professional itinerary proposal today.
            </p>
            <Link href="/proposals/create" className="inline-block mt-8">
              <GlassButton variant="primary" className="rounded-2xl">
                Begin Proposal
              </GlassButton>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredItems.map((proposal) => {
              const config = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;
              const StatusIcon = config.icon;
              return (
                <div key={proposal.id} className="group flex items-center justify-between p-6 hover:bg-gray-50/50 transition-all duration-300 relative overflow-hidden">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center transition-transform group-hover:scale-105 group-hover:shadow-md">
                      <Send className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <Link href={`/proposals/${proposal.id}`} className="text-lg font-bold text-secondary group-hover:text-primary transition-colors truncate">
                          {proposal.title}
                        </Link>
                        <span className={cn("px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border", config.color, config.bg)}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 mt-2 text-text-secondary text-sm">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-text-muted" />
                          <span className="truncate">{proposal.client_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                          <span className="font-bold text-secondary">${proposal.total_price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-muted" />
                          <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                        </div>
                        {proposal.comments_count ? (
                          <div className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 animate-pulse">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{proposal.comments_count} Feedback</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyShareLink(proposal.share_token)}
                        className="p-2 rounded-xl bg-white border border-gray-100 hover:border-primary hover:text-primary transition-all shadow-sm"
                        title="Copy Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(proposal)}
                        className="p-2 rounded-xl bg-white border border-gray-100 hover:border-rose-200 hover:text-rose-500 transition-all shadow-sm"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Link href={`/proposals/${proposal.id}`} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center transition-all group-hover:bg-primary group-hover:border-primary group-hover:text-white">
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>

                  <div className="absolute left-0 top-0 w-1 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <GlassConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteProposal}
        title="Retract Proposal"
        message={`Are you certain you wish to purge "${deleteConfirm?.title}"? This deployment will be permanently terminated.`}
        confirmText="Confirm Purge"
        cancelText="Preserve"
        variant="danger"
      />
    </div>
  );
}
