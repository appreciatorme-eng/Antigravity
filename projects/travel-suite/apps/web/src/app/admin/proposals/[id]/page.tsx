'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { useRealtimeProposal } from '@/hooks/useRealtimeProposal';
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
} from 'lucide-react';
import Link from 'next/link';

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
          clients(full_name, email),
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
        client_name: proposalData.clients?.full_name || 'Unknown Client',
        client_email: proposalData.clients?.email,
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
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
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
    navigator.clipboard.writeText(shareUrl);

    alert(
      `Share link copied to clipboard!\n\nSend this link to your client:\n${shareUrl}\n\n(Email/WhatsApp integration coming soon)`
    );

    // Update status to sent
    const supabase = createClient();
    await supabase.from('proposals').update({ status: 'sent' }).eq('id', proposal.id);

    loadProposal();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading proposal...</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h2>
          <Link
            href="/admin/proposals"
            className="text-[#9c7c46] hover:underline"
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
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-[var(--font-display)] text-[#1b140a]">
                {proposal.title}
              </h1>
              {isSubscribed && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                  <Wifi className="w-3 h-3" />
                  Live
                </div>
              )}
            </div>
            <p className="text-sm text-[#6f5b3e]">
              {proposal.client_name} • Version {proposal.version}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={sendProposal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors"
          >
            <Send className="w-4 h-4" />
            Send to Client
          </button>
          <button
            onClick={loadProposal}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-gray-50 transition-colors"
            title="Manual refresh (updates automatically via WebSocket)"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
          <div className="text-sm text-[#bda87f] mb-1">Status</div>
          <div className="text-2xl font-bold text-[#1b140a] capitalize">{proposal.status}</div>
          {proposal.approved_at && (
            <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Approved by {proposal.approved_by}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
          <div className="text-sm text-[#bda87f] mb-1">Views</div>
          <div className="text-2xl font-bold text-[#1b140a]">
            {proposal.viewed_at ? '1+' : '0'}
          </div>
          {proposal.viewed_at && (
            <div className="text-xs text-[#6f5b3e] mt-2 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {new Date(proposal.viewed_at).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
          <div className="text-sm text-[#bda87f] mb-1">Comments</div>
          <div className="text-2xl font-bold text-[#1b140a]">{comments.length}</div>
          {unresolvedComments.length > 0 && (
            <div className="text-xs text-orange-600 mt-2">
              {unresolvedComments.length} unresolved
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
          <div className="text-sm text-[#bda87f] mb-1">Total Price</div>
          <div className="text-2xl font-bold text-[#9c7c46]">
            ${(proposal.client_selected_price || proposal.total_price).toFixed(2)}
          </div>
          {proposal.client_selected_price &&
            proposal.client_selected_price !== proposal.total_price && (
              <div className="text-xs text-[#6f5b3e] mt-2">
                Base: ${proposal.total_price.toFixed(2)}
              </div>
            )}
        </div>
      </div>

      {/* Share Link */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Share Link</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={copyShareLink}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Preview
          </a>
        </div>
        {proposal.expires_at && (
          <p className="text-xs text-gray-600 mt-2">
            Expires: {new Date(proposal.expires_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Proposal Stats */}
      <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
        <h3 className="text-lg font-semibold text-[#1b140a] mb-4">Proposal Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-[#bda87f]">Total Days</div>
            <div className="text-xl font-bold text-[#1b140a]">{stats.totalDays}</div>
          </div>
          <div>
            <div className="text-sm text-[#bda87f]">Total Activities</div>
            <div className="text-xl font-bold text-[#1b140a]">{stats.totalActivities}</div>
          </div>
          <div>
            <div className="text-sm text-[#bda87f]">Selected Activities</div>
            <div className="text-xl font-bold text-[#1b140a]">{stats.selectedActivities}</div>
          </div>
          <div>
            <div className="text-sm text-[#bda87f]">Optional Activities</div>
            <div className="text-xl font-bold text-[#1b140a]">{stats.optionalActivities}</div>
          </div>
        </div>

        {proposal.template_name && (
          <div className="mt-4 pt-4 border-t border-[#eadfcd]">
            <div className="text-sm text-[#bda87f]">Created from template</div>
            <div className="text-sm text-[#1b140a] font-medium">{proposal.template_name}</div>
          </div>
        )}
      </div>

      {/* Client Information */}
      <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
        <h3 className="text-lg font-semibold text-[#1b140a] mb-4">Client Information</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-[#bda87f]">Name:</span>
            <div className="text-sm text-[#1b140a] font-medium">{proposal.client_name}</div>
          </div>
          {proposal.client_email && (
            <div>
              <span className="text-sm text-[#bda87f]">Email:</span>
              <div className="text-sm text-[#1b140a] font-medium">
                <a href={`mailto:${proposal.client_email}`} className="text-[#9c7c46] hover:underline">
                  {proposal.client_email}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {comments.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
          <h3 className="text-lg font-semibold text-[#1b140a] mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Client Comments ({comments.length})
          </h3>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border ${
                  comment.is_resolved
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-[#1b140a]">{comment.author_name}</div>
                    {comment.author_email && (
                      <div className="text-xs text-[#bda87f]">{comment.author_email}</div>
                    )}
                    {comment.day_number && (
                      <div className="text-xs text-[#bda87f] mt-1">
                        On Day {comment.day_number}
                        {comment.day_title && `: ${comment.day_title}`}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#bda87f]">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                    {!comment.is_resolved && (
                      <button
                        onClick={() => markCommentResolved(comment.id)}
                        className="mt-1 text-xs text-[#9c7c46] hover:underline"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[#6f5b3e]">{comment.comment}</p>
                {comment.is_resolved && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Resolved
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
        <h3 className="text-lg font-semibold text-[#1b140a] mb-4">Activity Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-[#bda87f]" />
            <span className="text-[#6f5b3e]">Created:</span>
            <span className="text-[#1b140a] font-medium">
              {new Date(proposal.created_at).toLocaleString()}
            </span>
          </div>
          {proposal.viewed_at && (
            <div className="flex items-center gap-3 text-sm">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-[#6f5b3e]">First Viewed:</span>
              <span className="text-[#1b140a] font-medium">
                {new Date(proposal.viewed_at).toLocaleString()}
              </span>
            </div>
          )}
          {proposal.approved_at && (
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-[#6f5b3e]">Approved:</span>
              <span className="text-[#1b140a] font-medium">
                {new Date(proposal.approved_at).toLocaleString()} by {proposal.approved_by}
              </span>
            </div>
          )}
          {comments.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <MessageCircle className="w-4 h-4 text-orange-600" />
              <span className="text-[#6f5b3e]">Last Comment:</span>
              <span className="text-[#1b140a] font-medium">
                {new Date(comments[0].created_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Next Steps</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
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
            <li>🎉 Proposal approved! Move client to "payment_pending" in CRM</li>
          )}
        </ul>
      </div>
    </div>
  );
}
