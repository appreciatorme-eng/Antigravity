'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatLocalDate, formatLocalDateTime } from '@/lib/date/tz';
import { useProposals } from '@/lib/queries/proposals';
import { useBackfillTripProposals } from '@/lib/queries/trips';
import { createClient } from '@/lib/supabase/client';
import { authedFetch } from '@/lib/api/authed-fetch';
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
  ChevronRight,
  TrendingUp,
  Mail,
  Zap,
  PenLine,
  Link2,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassConfirmModal } from '@/components/glass/GlassModal';
import { ErrorSection } from '@/components/ui/ErrorSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/skeletons/TableSkeleton';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import ESignature from '@/components/proposals/ESignature';
import { GuidedTour } from '@/components/tour/GuidedTour';

interface Proposal {
  id: string;
  organization_id: string;
  client_id: string;
  trip_id?: string | null;
  template_id: string | null;
  title: string;
  share_token: string;
  version: number | null;
  status: string | null;
  total_price: number | null;
  client_selected_price: number | null;
  expires_at: string | null;
  viewed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  client_name?: string;
  client_email?: string;
  template_name?: string;
  comments_count?: number;
  trips?: {
    id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
}

// Tracks which proposals have been signed locally (in production: stored in DB)
interface SignatureRecord {
  dataUrl: string;
  signedAt: string; // formatted display string
}

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant; icon: LucideIcon; color: string; bg: string }> = {
  draft: { label: 'Draft', variant: 'default', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50' },
  sent: { label: 'Sent', variant: 'info', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
  viewed: { label: 'Viewed', variant: 'primary', icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  commented: { label: 'Commented', variant: 'warning', icon: MessageCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  approved: { label: 'Approved', variant: 'success', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  archived: { label: 'Archived', variant: 'default', icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
};

function formatSignedAt(isoString: string, timezone: string): string {
  return formatLocalDateTime(isoString, timezone, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function ProposalsPage() {
  const { toast } = useToast();
  const { timezone } = useUserTimezone();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<Proposal | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState<false | 'approve' | 'archive'>(false);

  // E-Signature modal state
  const [signModalProposal, setSignModalProposal] = useState<Proposal | null>(null);
  const [signatureMap, setSignatureMap] = useState<Record<string, SignatureRecord>>({});
  const backfillMutation = useBackfillTripProposals();

  const { data: proposalsRaw, isLoading: loading, refetch: loadProposals } = useProposals(filterStatus);
  const proposals = useMemo<Proposal[]>(() => proposalsRaw ?? [], [proposalsRaw]);

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

  function copyPortalLink(shareToken: string) {
    const portalUrl = `${window.location.origin}/portal/${shareToken}`;
    void navigator.clipboard.writeText(portalUrl).then(() => {
      toast({ title: 'Client portal link copied', description: 'Portal link copied — send to your client!', variant: 'success' });
    });
  }

  function handleSigned(proposal: Proposal, dataUrl: string) {
    const record: SignatureRecord = {
      dataUrl,
      signedAt: new Date().toISOString(),
    };
    setSignatureMap((prev) => ({ ...prev, [proposal.id]: record }));
    setSignModalProposal(null);
    toast({
      title: 'Proposal signed!',
      description: `${proposal.title} has been signed and approved.`,
      variant: 'success',
    });
  }

  const filteredItems = useMemo(
    () =>
      proposals.filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q);
      }),
    [proposals, searchQuery],
  );

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => filteredItems.some((proposal) => proposal.id === id)));
  }, [filteredItems]);

  const allVisibleSelected =
    filteredItems.length > 0 && filteredItems.every((proposal) => selectedIds.includes(proposal.id));

  const summaryStats = [
    { label: 'Total Volume', value: `$${proposals.reduce((s, p) => s + (p.total_price || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Approved', value: proposals.filter(p => p.status === 'approved').length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Conversion', value: proposals.length ? `${Math.round((proposals.filter(p => p.status === 'approved').length / proposals.length) * 100)}%` : '0%', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Active Leas', value: proposals.filter(p => p.status === 'sent' || p.status === 'viewed').length, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  async function handleBulkAction(action: 'approve' | 'archive') {
    if (selectedIds.length === 0) return;
    setBulkSubmitting(action);

    try {
      const response = await authedFetch('/api/proposals/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || `Failed to ${action} proposals`);
      }

      const processed = payload?.data?.processed ?? 0;
      const errors = payload?.data?.errors ?? [];
      setSelectedIds([]);
      await loadProposals();
      toast({
        title: action === 'approve' ? 'Proposals approved' : 'Proposals archived',
        description:
          errors.length > 0
            ? `${processed} updated, ${errors.length} skipped.`
            : `${processed} proposal${processed === 1 ? '' : 's'} updated successfully.`,
        variant: errors.length > 0 ? 'info' : 'success',
      });
    } catch (error) {
      toast({
        title: 'Bulk action failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setBulkSubmitting(false);
    }
  }

  async function handleBackfillFromTrips() {
    if (backfillMutation.isPending) return;

    try {
      const collectedTripIds: string[] = [];
      let cursor: string | null = null;

      while (true) {
        const params = new URLSearchParams({
          status: 'all',
          limit: '100',
        });
        if (cursor) {
          params.set('cursor', cursor);
        }

        const tripsResponse = await authedFetch(`/api/trips?${params.toString()}`);
        const tripsPayload = await tripsResponse.json().catch(() => ({}));

        if (!tripsResponse.ok) {
          throw new Error(tripsPayload?.error || 'Failed to load trips for backfill');
        }

        const pageTripIds = Array.isArray(tripsPayload?.trips)
          ? tripsPayload.trips.map((trip: { id?: string | null }) => String(trip?.id || '')).filter(Boolean)
          : [];

        collectedTripIds.push(...pageTripIds);

        if (!tripsPayload?.hasMore || !tripsPayload?.nextCursor) {
          break;
        }

        cursor = String(tripsPayload.nextCursor);
      }

      const uniqueTripIds = [...new Set(collectedTripIds)];

      if (uniqueTripIds.length === 0) {
        toast({
          title: 'No trips available to backfill',
          description: 'The live trips feed returned no trips for this account.',
          variant: 'info',
        });
        return;
      }

      backfillMutation.mutate(uniqueTripIds, {
        onSuccess: (payload) => {
          const data = payload as { created?: number; skipped?: number; failed?: number };
          void loadProposals();
          toast({
            title: 'Proposal backfill finished',
            description: `${data.created ?? 0} linked, ${data.skipped ?? 0} skipped, ${data.failed ?? 0} failed.`,
            variant: data.failed ? 'warning' : 'success',
          });
        },
        onError: (error) => {
          toast({
            title: 'Backfill failed',
            description: error instanceof Error ? error.message : 'Unable to backfill linked proposals.',
            variant: 'error',
          });
        },
      });
    } catch (error) {
      toast({
        title: 'Backfill failed',
        description: error instanceof Error ? error.message : 'Unable to load trips for backfill.',
        variant: 'error',
      });
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <GuidedTour />
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-secondary tracking-tight">Proposals</h1>
          <p className="text-text-secondary mt-1 md:mt-2 text-sm md:text-lg">
            Manage your high-conversion itinerary proposals and client engagement.
          </p>
        </div>
        <Link href="/proposals/create" data-tour="create-proposal-btn">
          <GlassButton variant="primary" className="rounded-2xl shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" />
            Generate Proposal
          </GlassButton>
        </Link>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6" data-tour="proposal-stats">
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
      <div className="flex flex-col lg:flex-row gap-6 items-center" data-tour="proposal-filters">
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

        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 shadow-sm" role="tablist" aria-label="Proposal status filter">
          {['all', 'draft', 'sent', 'approved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              role="tab"
              aria-selected={filterStatus === s}
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
      <ErrorSection label="Proposals list">
        <GlassCard padding="none" className="overflow-hidden border-gray-100 shadow-xl" data-tour="proposal-list">
          {loading ? (
            <TableSkeleton rows={6} />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No proposals yet"
              description="Create your first proposal, or backfill linked proposals from existing trips."
              action={{
                label: backfillMutation.isPending ? 'Linking Trips…' : 'Backfill From Trips',
                onClick: () => { void handleBackfillFromTrips(); },
              }}
              className="py-20"
            />
          ) : (
            <div>
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-white/80 px-6 py-4">
                <label className="inline-flex items-center gap-3 text-sm font-semibold text-secondary">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => {
                      setSelectedIds(
                        event.target.checked ? filteredItems.map((proposal) => proposal.id) : [],
                      );
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Select all visible
                </label>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  {selectedIds.length} selected
                </span>
              </div>
              <div className="divide-y divide-gray-50">
            {filteredItems.map((proposal) => {
              const config = STATUS_CONFIG[proposal.status || 'draft'] || STATUS_CONFIG.draft;
              const signatureRecord = signatureMap[proposal.id] ?? null;

              return (
                <div key={proposal.id} className="group flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 p-4 md:p-6 hover:bg-gray-50/50 transition-all duration-300 relative overflow-hidden">
                  <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(proposal.id)}
                      onChange={(event) => {
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, proposal.id]
                            : current.filter((id) => id !== proposal.id),
                        );
                      }}
                      aria-label={`Select proposal ${proposal.title}`}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1 md:mt-0 shrink-0"
                    />
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 group-hover:shadow-md">
                      <Send className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <Link href={`/proposals/${proposal.id}`} className="text-sm md:text-lg font-bold text-secondary group-hover:text-primary transition-colors truncate">
                          {proposal.title}
                        </Link>
                        <span className={cn("px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border", config.color, config.bg)}>
                          {config.label}
                        </span>
                        {/* Signed chip */}
                        {signatureRecord ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle className="w-3 h-3" />
                            Signed — {formatSignedAt(signatureRecord.signedAt, timezone)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 md:gap-6 mt-1.5 md:mt-2 text-text-secondary text-xs md:text-sm flex-wrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-text-muted" />
                          <span className="truncate">{proposal.client_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                          <span className="font-bold text-secondary">${(proposal.total_price ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-muted" />
                          <span>{formatLocalDate(proposal.created_at || Date.now(), timezone)}</span>
                        </div>
                        {proposal.comments_count ? (
                          <div className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 animate-pulse">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{proposal.comments_count} Feedback</span>
                          </div>
                        ) : null}
                        {proposal.trip_id ? (
                          <Link
                            href={`/trips/${proposal.trip_id}`}
                            className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>View Trip</span>
                          </Link>
                        ) : null}
                      </div>

                      {/* Action buttons row — always visible on mobile, hover on desktop */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        {/* Get Signed / Signed chip */}
                        {signatureRecord ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Signed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSignModalProposal(proposal)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                            Get Signed
                          </button>
                        )}

                        {/* Client Portal button */}
                        <button
                          type="button"
                          onClick={() => copyPortalLink(proposal.share_token)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 bg-white hover:border-primary hover:text-primary transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Client Portal
                        </button>
                        {proposal.trip_id ? (
                          <Link
                            href={`/trips/${proposal.trip_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Trip
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 shrink-0 self-end md:self-center">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyShareLink(proposal.share_token)}
                        className="p-2 rounded-xl bg-white border border-gray-100 hover:border-primary hover:text-primary transition-all shadow-sm"
                        title="Copy Link"
                        aria-label={`Copy share link for ${proposal.title}`}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(proposal)}
                        className="p-2 rounded-xl bg-white border border-gray-100 hover:border-rose-200 hover:text-rose-500 transition-all shadow-sm"
                        title="Delete"
                        aria-label={`Delete proposal ${proposal.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Link href={`/proposals/${proposal.id}`} aria-label={`View proposal ${proposal.title}`} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center transition-all group-hover:bg-primary group-hover:border-primary group-hover:text-white">
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>

                  <div className="absolute left-0 top-0 w-1 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                </div>
              );
            })}
              </div>
            </div>
          )}
        </GlassCard>
      </ErrorSection>

      {selectedIds.length > 0 ? (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-2xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/90 px-5 py-4 text-white shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
            <span className="text-sm font-semibold">
              {selectedIds.length} selected
            </span>
            <div className="flex items-center gap-2">
              <GlassButton
                variant="primary"
                disabled={bulkSubmitting !== false}
                onClick={() => { void handleBulkAction('approve'); }}
              >
                {bulkSubmitting === 'approve' ? 'Approving…' : 'Approve'}
              </GlassButton>
              <GlassButton
                variant="ghost"
                disabled={bulkSubmitting !== false}
                onClick={() => { void handleBulkAction('archive'); }}
              >
                {bulkSubmitting === 'archive' ? 'Archiving…' : 'Archive'}
              </GlassButton>
              <GlassButton variant="ghost" onClick={() => setSelectedIds([])}>
                Cancel
              </GlassButton>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete confirm modal */}
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

      {/* ------------------------------------------------------------------ */}
      {/* E-Signature Modal                                                   */}
      {/* ------------------------------------------------------------------ */}
      {signModalProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSignModalProposal(null)}
          />

          {/* Modal panel */}
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">Digital Signature</h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                  {signModalProposal.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSignModalProposal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ESignature component */}
            <div className="px-2 pb-2">
              <ESignature
                proposalId={signModalProposal.id}
                clientName={signModalProposal.client_name ?? 'Client'}
                onSigned={(dataUrl) => handleSigned(signModalProposal, dataUrl)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
