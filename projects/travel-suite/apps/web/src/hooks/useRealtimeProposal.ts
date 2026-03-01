/**
 * Real-time WebSocket hook for proposal updates
 *
 * Subscribes to Supabase Realtime channels for:
 * - Proposal status changes (viewed, commented, approved)
 * - Activity selection changes (client toggles activities)
 * - New comments
 * - Price updates
 *
 * Integrated with browser push notifications
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  shouldShowNotification,
  notifyProposalComment,
  notifyProposalApproval,
  notifyProposalView,
  createEventNotification,
  showNotification,
} from '@/lib/notifications/browser-push';

type RealtimePayload = {
  old?: Record<string, unknown>;
  new?: Record<string, unknown>;
};

type RealtimeSubscriptionStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

interface UseRealtimeProposalOptions {
  proposalId: string;
  proposalTitle?: string;
  clientName?: string;
  onProposalUpdate?: (payload: RealtimePayload) => void;
  onActivityUpdate?: (payload: RealtimePayload) => void;
  onCommentAdded?: (payload: RealtimePayload) => void;
  enabled?: boolean;
  enableNotifications?: boolean;
}

/**
 * Subscribe to real-time updates for a proposal
 *
 * @example
 * ```tsx
 * useRealtimeProposal({
 *   proposalId: 'uuid',
 *   onProposalUpdate: (payload) => {
 *     console.log('Proposal updated:', payload);
 *     refetchProposal();
 *   },
 *   onCommentAdded: (payload) => {
 *     console.log('New comment:', payload);
 *     refetchComments();
 *   },
 * });
 * ```
 */
export function useRealtimeProposal({
  proposalId,
  proposalTitle = 'Proposal',
  clientName = 'Client',
  onProposalUpdate,
  onActivityUpdate,
  onCommentAdded,
  enabled = true,
  enableNotifications = true,
}: UseRealtimeProposalOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!enabled || !proposalId) return;

    const supabase = createClient();

    const channelName = `proposal:${proposalId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proposals',
          filter: `id=eq.${proposalId}`,
        },
        (payload: RealtimePayload) => {
          console.log('[Realtime] Proposal updated:', payload);

          if (enableNotifications && payload.new) {
            const oldStatus = typeof payload.old?.status === 'string' ? payload.old.status : null;
            const newStatus = typeof payload.new.status === 'string' ? payload.new.status : null;

            if (oldStatus !== 'viewed' && newStatus === 'viewed' && shouldShowNotification('view')) {
              notifyProposalView(proposalTitle, clientName, proposalId);
            }

            if (newStatus === 'approved' && oldStatus !== 'approved' && shouldShowNotification('approval')) {
              notifyProposalApproval(proposalTitle, clientName, proposalId);
            }
          }

          onProposalUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proposal_activities',
        },
        (payload: RealtimePayload) => {
          console.log('[Realtime] Activity updated:', payload);

          if (enableNotifications && payload.new) {
            const oldSelected = Boolean(payload.old?.is_selected);
            const newSelected = Boolean(payload.new.is_selected);

            if (oldSelected !== newSelected && shouldShowNotification('update')) {
              const notification = createEventNotification('update', {
                proposalTitle,
                clientName,
                proposalId,
              });
              showNotification(notification);
            }
          }

          onActivityUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proposal_comments',
          filter: `proposal_id=eq.${proposalId}`,
        },
        (payload: RealtimePayload) => {
          console.log('[Realtime] Comment added:', payload);

          if (enableNotifications && payload.new) {
            const authorName =
              typeof payload.new.author_name === 'string' && payload.new.author_name.trim().length > 0
                ? payload.new.author_name
                : clientName;
            const commentText =
              typeof payload.new.comment === 'string' ? payload.new.comment : '';

            if (shouldShowNotification('comment')) {
              notifyProposalComment(proposalTitle, authorName, proposalId, commentText);
            }
          }

          onCommentAdded?.(payload);
        }
      )
      .subscribe((status: RealtimeSubscriptionStatus) => {
        console.log('[Realtime] Subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      console.log('[Realtime] Unsubscribing from:', channelName);
      setIsSubscribed(false);
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [
    proposalId,
    proposalTitle,
    clientName,
    enabled,
    enableNotifications,
    onProposalUpdate,
    onActivityUpdate,
    onCommentAdded,
  ]);

  return {
    isSubscribed,
  };
}

/**
 * Subscribe to real-time updates for all proposals (admin dashboard)
 *
 * @example
 * ```tsx
 * useRealtimeProposals({
 *   organizationId: 'uuid',
 *   onProposalUpdate: () => refetchProposals(),
 * });
 * ```
 */
export function useRealtimeProposals({
  organizationId,
  onProposalUpdate,
  enabled = true,
}: {
  organizationId?: string;
  onProposalUpdate?: (payload: RealtimePayload) => void;
  enabled?: boolean;
}) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!enabled || !organizationId) return;

    const supabase = createClient();
    const channelName = `proposals:${organizationId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposals',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload: RealtimePayload) => {
          console.log('[Realtime] Proposals changed:', payload);
          onProposalUpdate?.(payload);
        }
      )
      .subscribe((status: RealtimeSubscriptionStatus) => {
        console.log('[Realtime] Proposals subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      console.log('[Realtime] Unsubscribing from:', channelName);
      setIsSubscribed(false);
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [organizationId, enabled, onProposalUpdate]);

  return {
    isSubscribed,
  };
}
