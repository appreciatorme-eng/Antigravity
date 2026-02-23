'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { useRealtimeProposal } from '@/hooks/useRealtimeProposal';
import VersionDiff from '@/components/VersionDiff';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Send,
  MessageCircle,
  CheckCircle,
  Eye,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  RefreshCcw,
  Wifi,
  WifiOff,
  History,
} from 'lucide-react';
import Link from 'next/link';
import ConvertProposalModal from '@/components/admin/ConvertProposalModal';
import ProposalAddOnsManager from '@/components/admin/ProposalAddOnsManager';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { useToast } from '@/components/ui/toast';

interface Proposal {
  id: string;
  title: string;
  status: string;
  total_price: number;
  client_selected_price: number | null;
  share_token: string;
  version: number;
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
}

interface ProposalComment {
  id: string;
  proposal_day_id: string | null;
  author_name: string;
  author_email: string | null;
  comment: string;
  is_resolved: boolean;
  created_at: string;
  // Joined data
  day_title?: string;
  day_number?: number;
}

export default function AdminProposalViewPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [comments, setComments] = useState<ProposalComment[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    totalActivities: 0,
    selectedActivities: 0,
    optionalActivities: 0,
  });
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const { toast } = useToast();

  // Real-time subscription
  const { isSubscribed } = useRealtimeProposal({
    proposalId,
    onProposalUpdate: (payload) => {
      console.log('[Admin] Proposal updated via realtime:', payload);
      setRealtimeConnected(true);
      loadProposal(); // Reload proposal data
    },
    onActivityUpdate: (payload) => {
      console.log('[Admin] Activity updated via realtime:', payload);
      setRealtimeConnected(true);
      loadProposal(); // Reload to update stats
    },
    onCommentAdded: (payload) => {
      console.log('[Admin] New comment via realtime:', payload);
      setRealtimeConnected(true);
      loadComments(); // Reload comments only
    },
    enabled: !loading && !!proposal,
  });

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  async function loadProposal() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Load proposal with joined data
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select(
          `
          *,
          clients(
            profiles(full_name, email)
          ),
          tour_templates(name)
        `
        )
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposalData) {
        console.error('Error loading proposal:', proposalError);
        setLoading(false);
        return;
      }

      const formattedProposal: Proposal = {
        ...proposalData,
        status: proposalData.status || 'draft',
        total_price: proposalData.total_price || 0,
        version: proposalData.version || 1,
        created_at: proposalData.created_at || new Date().toISOString(),
        updated_at: proposalData.updated_at || new Date().toISOString(),
        client_name: proposalData.clients?.profiles?.full_name || 'Unknown Client',
        client_email: proposalData.clients?.profiles?.email || undefined,
        template_name: proposalData.tour_templates?.name,
      };

      setProposal(formattedProposal);

      // Load comments
      await loadComments();

      // Load stats
      await loadStats(supabase);
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    try {
      const supabase = createClient();

      const { data: commentsData } = await supabase
        .from('proposal_comments')
        .select(
          `
          *,
          proposal_days(day_number, title)
        `
        )
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false });

      const formattedComments =
        commentsData?.map((comment: any) => ({
          ...comment,
          day_title: comment.proposal_days?.title,
          day_number: comment.proposal_days?.day_number,
        })) || [];

      setComments(formattedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  async function loadStats(supabase: ReturnType<typeof createClient>) {
    try {
      const { count: daysCount } = await supabase
        .from('proposal_days')
        .select('*', { count: 'exact', head: true })
        .eq('proposal_id', proposalId);

      // Get all activities for this proposal
      const { data: days } = await supabase
        .from('proposal_days')
        .select('id')
        .eq('proposal_id', proposalId);

      if (days && days.length > 0) {
        const dayIds = days.map((d) => d.id);

        const { count: activitiesCount } = await supabase
          .from('proposal_activities')
          .select('*', { count: 'exact', head: true })
          .in('proposal_day_id', dayIds);

        const { count: selectedCount } = await supabase
          .from('proposal_activities')
          .select('*', { count: 'exact', head: true })
          .in('proposal_day_id', dayIds)
          .eq('is_selected', true);

        const { count: optionalCount } = await supabase
          .from('proposal_activities')
          .select('*', { count: 'exact', head: true })
          .in('proposal_day_id', dayIds)
          .eq('is_optional', true);

        setStats({
          totalDays: daysCount || 0,
          totalActivities: activitiesCount || 0,
          selectedActivities: selectedCount || 0,
          optionalActivities: optionalCount || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  function copyShareLink() {
    if (!proposal) return;
    const shareUrl = `${window.location.origin}/p/${proposal.share_token}`;
    void navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Share link copied',
        description: 'Proposal link copied to clipboard.',
        variant: 'success',
      });
    }).catch(() => {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy share link.',
        variant: 'error',
      });
    });
  }

  async function markCommentResolved(commentId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('proposal_comments')
      .update({ is_resolved: true })
      .eq('id', commentId);

    if (!error) {
      loadProposal();
    }
  }

  async function sendProposal() {
    if (!proposal) return;

    // TODO: Integrate with email/WhatsApp sending
    const shareUrl = `${window.location.origin}/p/${proposal.share_token}`;

    // For now, just copy link and show instructions
    await navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Share link copied',
      description: 'Send this link to your client. Email/WhatsApp integration will automate this next.',
      variant: 'info',
      durationMs: 7000,
    });

    // Update status to sent
    const supabase = createClient();
    await supabase.from('proposals').update({ status: 'sent' }).eq('id', proposal.id);

    loadProposal();
  }

  async function loadVersionHistory() {
    if (versions.length > 0) {
      // Already loaded, just toggle visibility
      setShowVersionHistory(!showVersionHistory);
      return;
    }

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('proposal_versions')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('version', { ascending: false });

      setVersions(data || []);
      setShowVersionHistory(true);
    } catch (error) {
      console.error('Error loading version history:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-text-secondary">Loading proposal...</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-serif text-secondary dark:text-white mb-2">Proposal Not Found</h2>
          <Link
            href="/admin/proposals"
            className="text-primary hover:underline"
          >
            Back to Proposals
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/p/${proposal.share_token}`;
  const unresolvedComments = comments.filter((c) => !c.is_resolved);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/proposals"
            className="p-2 hover:bg-white/40 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif text-secondary dark:text-white">
                {proposal.title}
              </h1>
              {isSubscribed && (
                <GlassBadge variant="success" icon={Wifi}>
                  Live
                </GlassBadge>
              )}
            </div>
            <p className="text-sm text-text-secondary">
              {proposal.client_name} • Version {proposal.version}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <GlassButton variant="secondary" onClick={loadVersionHistory}>
            <History className="w-4 h-4" />
            Version History ({proposal.version})
          </GlassButton>

          {(proposal.status === 'approved' || proposal.approved_at) && (
            <GlassButton
              variant="primary"
              onClick={() => setConvertModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
            >
              <CheckCircle className="w-4 h-4" />
              Convert to Trip
            </GlassButton>
          )}

          <GlassButton variant="primary" onClick={sendProposal}>
            <Send className="w-4 h-4" />
            Send to Client
          </GlassButton>
          <GlassButton variant="secondary" onClick={loadProposal}>
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </GlassButton>
        </div>
      </div>

      {/* Version History */}
      {showVersionHistory && versions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-serif text-secondary dark:text-white">Version History</h2>
          {versions.map((version, index) => {
            if (index === versions.length - 1) {
              // First version, nothing to compare
              return (
                <GlassCard key={version.id} padding="md" rounded="lg">
                  <p className="text-sm text-text-secondary">
                    Version {version.version} • Initial version •{' '}
                    {new Date(version.created_at).toLocaleString()}
                  </p>
                </GlassCard>
              );
            }

            const currentVer = version;
            const previousVer = versions[index + 1];

            return (
              <VersionDiff
                key={version.id}
                currentVersion={currentVer}
                previousVersion={previousVer}
              />
            );
          })}
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard padding="lg" rounded="2xl">
          <div className="text-sm text-primary mb-1">Status</div>
          <div className="text-2xl font-bold font-serif text-secondary dark:text-white capitalize">{proposal.status}</div>
          {proposal.approved_at && (
            <div className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Approved by {proposal.approved_by}
            </div>
          )}
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="text-sm text-primary mb-1">Views</div>
          <div className="text-2xl font-bold font-serif text-secondary dark:text-white">
            {proposal.viewed_at ? '1+' : '0'}
          </div>
          {proposal.viewed_at && (
            <div className="text-xs text-text-secondary mt-2 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {new Date(proposal.viewed_at).toLocaleDateString()}
            </div>
          )}
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="text-sm text-primary mb-1">Comments</div>
          <div className="text-2xl font-bold font-serif text-secondary dark:text-white">{comments.length}</div>
          {unresolvedComments.length > 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              {unresolvedComments.length} unresolved
            </div>
          )}
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="text-sm text-primary mb-1">Total Price</div>
          <div className="text-2xl font-bold text-primary">
            ${(proposal.client_selected_price || proposal.total_price).toFixed(2)}
          </div>
          {proposal.client_selected_price &&
            proposal.client_selected_price !== proposal.total_price && (
              <div className="text-xs text-text-secondary mt-2">
                Base: ${proposal.total_price.toFixed(2)}
              </div>
            )}
        </GlassCard>
      </div>

      {/* Share Link */}
      <GlassCard padding="lg" rounded="2xl" className="bg-gradient-to-r from-blue-50/90 to-purple-50/90 dark:from-blue-900/20 dark:to-purple-900/20">
        <h3 className="text-lg font-semibold font-serif text-secondary dark:text-white mb-3">Client Share Link</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-4 py-2 bg-white dark:bg-white/10 border border-white/20 rounded-lg text-sm text-secondary dark:text-white"
          />
          <GlassButton variant="secondary" onClick={copyShareLink}>
            <Copy className="w-4 h-4" />
            Copy
          </GlassButton>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GlassButton variant="secondary">
              <ExternalLink className="w-4 h-4" />
              Preview
            </GlassButton>
          </a>
        </div>
        {proposal.expires_at && (
          <p className="text-xs text-text-secondary mt-2">
            Expires: {new Date(proposal.expires_at).toLocaleDateString()}
          </p>
        )}
      </GlassCard>

      {/* Proposal Stats */}
      <GlassCard padding="lg" rounded="2xl">
        <h3 className="text-lg font-semibold font-serif text-secondary dark:text-white mb-4">Proposal Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-primary">Total Days</div>
            <div className="text-xl font-bold text-secondary dark:text-white">{stats.totalDays}</div>
          </div>
          <div>
            <div className="text-sm text-primary">Total Activities</div>
            <div className="text-xl font-bold text-secondary dark:text-white">{stats.totalActivities}</div>
          </div>
          <div>
            <div className="text-sm text-primary">Selected Activities</div>
            <div className="text-xl font-bold text-secondary dark:text-white">{stats.selectedActivities}</div>
          </div>
          <div>
            <div className="text-sm text-primary">Optional Activities</div>
            <div className="text-xl font-bold text-secondary dark:text-white">{stats.optionalActivities}</div>
          </div>
        </div>

        {proposal.template_name && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-sm text-primary">Created from template</div>
            <div className="text-sm text-secondary dark:text-white font-medium">{proposal.template_name}</div>
          </div>
        )}
      </GlassCard>

      {/* Client Information */}
      <GlassCard padding="lg" rounded="2xl">
        <h3 className="text-lg font-semibold font-serif text-secondary dark:text-white mb-4">Client Information</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-primary">Name:</span>
            <div className="text-sm text-secondary dark:text-white font-medium">{proposal.client_name}</div>
          </div>
          {proposal.client_email && (
            <div>
              <span className="text-sm text-primary">Email:</span>
              <div className="text-sm text-secondary dark:text-white font-medium">
                <a href={`mailto:${proposal.client_email}`} className="text-primary hover:underline">
                  {proposal.client_email}
                </a>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Add-Ons Manager */}
      <ProposalAddOnsManager proposalId={proposalId} />

      {/* Comments Section */}
      {comments.length > 0 && (
        <GlassCard padding="lg" rounded="2xl">
          <h3 className="text-lg font-semibold font-serif text-secondary dark:text-white mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Client Comments ({comments.length})
          </h3>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border ${comment.is_resolved
                  ? 'bg-gray-50/90 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                  : 'bg-orange-50/90 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-secondary dark:text-white">{comment.author_name}</div>
                    {comment.author_email && (
                      <div className="text-xs text-primary">{comment.author_email}</div>
                    )}
                    {comment.day_number && (
                      <div className="text-xs text-primary mt-1">
                        On Day {comment.day_number}
                        {comment.day_title && `: ${comment.day_title}`}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-primary">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                    {!comment.is_resolved && (
                      <button
                        onClick={() => markCommentResolved(comment.id)}
                        className="mt-1 text-xs text-primary hover:underline"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-text-secondary">{comment.comment}</p>
                {comment.is_resolved && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Resolved
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Timeline */}
      <GlassCard padding="lg" rounded="2xl">
        <h3 className="text-lg font-semibold font-serif text-secondary dark:text-white mb-4">Activity Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-text-secondary">Created:</span>
            <span className="text-secondary dark:text-white font-medium">
              {new Date(proposal.created_at).toLocaleString()}
            </span>
          </div>
          {proposal.viewed_at && (
            <div className="flex items-center gap-3 text-sm">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-text-secondary">First Viewed:</span>
              <span className="text-secondary dark:text-white font-medium">
                {new Date(proposal.viewed_at).toLocaleString()}
              </span>
            </div>
          )}
          {proposal.approved_at && (
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-text-secondary">Approved:</span>
              <span className="text-secondary dark:text-white font-medium">
                {new Date(proposal.approved_at).toLocaleString()} by {proposal.approved_by}
              </span>
            </div>
          )}
          {comments.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <MessageCircle className="w-4 h-4 text-orange-600" />
              <span className="text-text-secondary">Last Comment:</span>
              <span className="text-secondary dark:text-white font-medium">
                {new Date(comments[0].created_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Help Text */}
      <div className="bg-blue-50/90 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Next Steps</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
          {proposal.status === 'draft' && (
            <li>Click "Send to Client" to share the proposal link</li>
          )}
          {proposal.status === 'sent' && !proposal.viewed_at && (
            <li>Waiting for client to view the proposal...</li>
          )}
          {proposal.viewed_at && !proposal.approved_at && (
            <li>Client has viewed the proposal. Follow up if needed!</li>
          )}
          {unresolvedComments.length > 0 && (
            <li>Respond to {unresolvedComments.length} unresolved comment(s)</li>
          )}
          {proposal.approved_at && (
            <li>Proposal approved! Move client to "payment_pending" in CRM</li>
          )}
        </ul>
      </div>

      {/* Convert Modal */}
      {proposal && (
        <ConvertProposalModal
          open={convertModalOpen}
          onOpenChange={setConvertModalOpen}
          proposalId={proposal.id}
          proposalTitle={proposal.title}
          onSuccess={(tripId) => router.push(`/admin/trips/${tripId}`)}
        />
      )}
    </div>
  );
}
